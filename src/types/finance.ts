export type EntryStatus = 'PENDING' | 'PAID' | 'CANCELLED';
export type SortOption = 'updated' | 'title' | 'created' | 'due-date' | 'amount';

export interface AppUser {
  id: string;
  email: string;
  displayName: string;
  avatarUrl?: string;
}

export interface MoneyNote {
  id: string;
  userId: string;
  title: string;
  createdAt: string;
  updatedAt: string;
}

export interface MoneyEntry {
  id: string;
  userId: string;
  noteId: string;
  title: string;
  amountPaise: number;
  recipientUpiId?: string;
  status: EntryStatus;
  paidAt?: string;
  paymentReference?: string;
  createdAt: string;
  updatedAt: string;
}

export interface NoteSummary {
  totalPaise: number;
  paidPaise: number;
  pendingPaise: number;
  overduePaise: number;
  entryCount: number;
  paidPercent: number;
}

export interface DashboardSummary {
  totalPaise: number;
  paidPaise: number;
  pendingPaise: number;
  overduePaise: number;
  paidPercent: number;
}
