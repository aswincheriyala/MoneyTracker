import { DashboardSummary, EntryStatus, MoneyEntry, MoneyNote, NoteSummary, SortOption } from '@/types/finance';
import { MoneyTheme } from '../constants/money-theme';

export function createId(prefix = 'id'): string {
  return `${prefix}_${Math.random().toString(36).slice(2, 10)}_${Date.now().toString(36)}`;
}

export function toPaise(amount: number | string): number {
  if (typeof amount === 'number') {
    if (!Number.isFinite(amount)) return 0;
    return Math.round(amount * 100);
  }

  const normalized = String(amount).replace(/[₹,\s]/g, '').replace(/[^\d.]/g, '');
  if (!normalized || normalized === '.') return 0;
  const value = Number(normalized);
  if (!Number.isFinite(value)) return 0;
  return Math.round(value * 100);
}

export function formatCurrency(paise: number): string {
  const value = Math.abs(paise) / 100;
  const rounded = new Intl.NumberFormat('en-IN', {
    minimumFractionDigits: 0,
    maximumFractionDigits: 2,
  }).format(value);

  return `₹${rounded}`;
}

export function formatCurrencyCompact(paise: number): string {
  return formatCurrency(paise);
}

export function isOverdue(entry: MoneyEntry, now = new Date()): boolean {
  if (entry.status !== 'PENDING' || !entry.dueDate) return false;
  const due = new Date(`${entry.dueDate}T00:00:00`);
  return due < new Date(now.toDateString());
}

export function getEntryAmount(entry: MoneyEntry): number {
  if (entry.status === 'CANCELLED') return 0;
  if (entry.status === 'PAID') return entry.amountPaise;
  return entry.amountPaise;
}

export function calculateDashboard(entries: MoneyEntry[]): DashboardSummary {
  const activeEntries = entries.filter((entry) => entry.status !== 'CANCELLED');
  const totalPaise = activeEntries.reduce((sum, entry) => sum + entry.amountPaise, 0);
  const paidPaise = activeEntries
    .filter((entry) => entry.status === 'PAID')
    .reduce((sum, entry) => sum + entry.amountPaise, 0);
  const pendingPaise = activeEntries
    .filter((entry) => entry.status === 'PENDING')
    .reduce((sum, entry) => sum + entry.amountPaise, 0);
  const overduePaise = activeEntries
    .filter((entry) => entry.status === 'PENDING' && isOverdue(entry))
    .reduce((sum, entry) => sum + entry.amountPaise, 0);

  return {
    totalPaise,
    paidPaise,
    pendingPaise,
    overduePaise,
    paidPercent: totalPaise === 0 ? 0 : (paidPaise / totalPaise) * 100,
  };
}

export function getNoteSummary(note: MoneyNote, entries: MoneyEntry[]): NoteSummary {
  const noteEntries = entries.filter((entry) => entry.noteId === note.id && entry.status !== 'CANCELLED');
  const totalPaise = noteEntries.reduce((sum, entry) => sum + entry.amountPaise, 0);
  const paidPaise = noteEntries
    .filter((entry) => entry.status === 'PAID')
    .reduce((sum, entry) => sum + entry.amountPaise, 0);
  const pendingPaise = noteEntries
    .filter((entry) => entry.status === 'PENDING')
    .reduce((sum, entry) => sum + entry.amountPaise, 0);
  const overduePaise = noteEntries
    .filter((entry) => entry.status === 'PENDING' && isOverdue(entry))
    .reduce((sum, entry) => sum + entry.amountPaise, 0);

  return {
    totalPaise,
    paidPaise,
    pendingPaise,
    overduePaise,
    entryCount: noteEntries.length,
    paidPercent: totalPaise === 0 ? 0 : (paidPaise / totalPaise) * 100,
  };
}

export function sortNotes(notes: MoneyNote[], entries: MoneyEntry[], option: SortOption): MoneyNote[] {
  const sorted = [...notes];
  switch (option) {
    case 'title':
      return sorted.sort((a, b) => a.title.localeCompare(b.title));
    case 'created':
      return sorted.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
    case 'updated':
      return sorted.sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime());
    default:
      return sorted.sort((a, b) => {
        const aCount = entries.filter((entry) => entry.noteId === a.id).length;
        const bCount = entries.filter((entry) => entry.noteId === b.id).length;
        return bCount - aCount;
      });
  }
}

export function sortEntries(entries: MoneyEntry[], option: SortOption): MoneyEntry[] {
  const sorted = [...entries];
  switch (option) {
    case 'title':
      return sorted.sort((a, b) => a.title.localeCompare(b.title));
    case 'amount':
      return sorted.sort((a, b) => b.amountPaise - a.amountPaise);
    case 'due-date':
      return sorted.sort((a, b) => {
        const aTime = a.dueDate ? new Date(`${a.dueDate}T00:00:00`).getTime() : Number.MAX_SAFE_INTEGER;
        const bTime = b.dueDate ? new Date(`${b.dueDate}T00:00:00`).getTime() : Number.MAX_SAFE_INTEGER;
        return aTime - bTime;
      });
    case 'created':
      return sorted.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
    default:
      return sorted.sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime());
  }
}

export function getStatusColor(status: EntryStatus): string {
  switch (status) {
    case 'PAID':
      return MoneyTheme.paid;
    case 'CANCELLED':
      return MoneyTheme.danger;
    default:
      return MoneyTheme.pending;
  }
}

export function safeDateLabel(date?: string): string {
  if (!date) return 'No due date';
  const parsed = new Date(`${date}T00:00:00`);
  if (Number.isNaN(parsed.getTime())) return 'No due date';
  return parsed.toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' });
}
