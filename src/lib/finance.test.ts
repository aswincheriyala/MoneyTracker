import { describe, expect, it } from 'vitest';

import type { MoneyEntry, MoneyNote } from '@/types/finance';
import { calculateDashboard, formatCurrency, getNoteSummary, isOverdue, toPaise } from './finance';

const note: MoneyNote = {
  id: 'note-1',
  userId: 'user-1',
  title: 'January Spends',
  createdAt: '2025-01-01T00:00:00.000Z',
  updatedAt: '2025-01-01T00:00:00.000Z',
};

const entries: MoneyEntry[] = [
  {
    id: 'entry-1',
    userId: 'user-1',
    noteId: 'note-1',
    title: 'LIC Premium',
    amountPaise: 200000,
    status: 'PENDING',
    dueDate: '2025-01-11',
    createdAt: '2025-01-01T00:00:00.000Z',
    updatedAt: '2025-01-01T00:00:00.000Z',
  },
  {
    id: 'entry-2',
    userId: 'user-1',
    noteId: 'note-1',
    title: 'SIP',
    amountPaise: 1000000,
    status: 'PAID',
    paidAt: '2025-01-02T00:00:00.000Z',
    createdAt: '2025-01-01T00:00:00.000Z',
    updatedAt: '2025-01-01T00:00:00.000Z',
  },
  {
    id: 'entry-3',
    userId: 'user-1',
    noteId: 'note-1',
    title: 'Cancelled item',
    amountPaise: 300000,
    status: 'CANCELLED',
    createdAt: '2025-01-01T00:00:00.000Z',
    updatedAt: '2025-01-01T00:00:00.000Z',
  },
];

describe('finance helpers', () => {
  it('parses decimal rupee strings without floating point drift', () => {
    expect(toPaise('₹1,250.50')).toBe(125050);
    expect(toPaise('999')).toBe(99900);
  });

  it('formats currency in Indian numbering style', () => {
    expect(formatCurrency(12505000)).toBe('₹1,25,050');
    expect(formatCurrency(200000)).toBe('₹2,000');
  });

  it('marks overdue values only for pending, past-due items', () => {
    expect(isOverdue(entries[0], new Date('2025-01-12T00:00:00.000Z'))).toBe(true);
    expect(isOverdue(entries[1], new Date('2025-01-12T00:00:00.000Z'))).toBe(false);
  });

  it('calculates active totals, paid totals, and overdue totals correctly', () => {
    const summary = calculateDashboard(entries);
    expect(summary.totalPaise).toBe(1200000);
    expect(summary.paidPaise).toBe(1000000);
    expect(summary.pendingPaise).toBe(200000);
    expect(summary.overduePaise).toBe(200000);
  });

  it('returns safe note totals and zero values for empty notes', () => {
    const summary = getNoteSummary(note, []);
    expect(summary.totalPaise).toBe(0);
    expect(summary.paidPercent).toBe(0);
    expect(summary.entryCount).toBe(0);
  });
});
