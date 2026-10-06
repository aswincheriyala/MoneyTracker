import AsyncStorage from '@react-native-async-storage/async-storage';
import React, { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from 'react';

import { signInWithGoogle, signOutUser, supabase } from '@/lib/supabase';
import { AppUser, EntryStatus, MoneyEntry, MoneyNote } from '@/types/finance';

const STORAGE_KEY = 'moneytracker:data:v2';
const LEGACY_STORAGE_KEY = 'moneytracker:data:v1';

type SupabaseNote = {
  id: string;
  user_id: string;
  title: string;
  created_at: string;
  updated_at: string;
};

type SupabaseEntry = {
  id: string;
  user_id: string;
  note_id: string;
  title: string;
  amount_paise: number | string;
  category: string | null;
  recipient_upi_id: string | null;
  due_date: string | null;
  description: string | null;
  status: EntryStatus;
  paid_at: string | null;
  payment_reference: string | null;
  created_at: string;
  updated_at: string;
};

type PendingChange =
  | { id: string; kind: 'upsert-note'; note: MoneyNote }
  | { id: string; kind: 'delete-note'; noteId: string; deletedAt: string }
  | { id: string; kind: 'upsert-entry'; entry: MoneyEntry }
  | { id: string; kind: 'delete-entry'; entryId: string; deletedAt: string };

type LocalData = {
  notes: MoneyNote[];
  entries: MoneyEntry[];
  changes: PendingChange[];
  lastSyncedAt?: string;
};

const emptyLocalData = (): LocalData => ({ notes: [], entries: [], changes: [] });

function makeId(): string {
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (character) => {
    const random = Math.floor(Math.random() * 16);
    return (character === 'x' ? random : (random & 0x3) | 0x8).toString(16);
  });
}

function noteToSupabase(note: MoneyNote) {
  return {
    id: note.id,
    user_id: note.userId,
    title: note.title,
    created_at: note.createdAt,
    updated_at: note.updatedAt,
  };
}

function entryToSupabase(entry: MoneyEntry) {
  return {
    id: entry.id,
    user_id: entry.userId,
    note_id: entry.noteId,
    title: entry.title,
    amount_paise: entry.amountPaise,
    category: entry.category ?? null,
    recipient_upi_id: entry.recipientUpiId ?? null,
    due_date: entry.dueDate ?? null,
    description: entry.description ?? null,
    status: entry.status,
    paid_at: entry.paidAt ?? null,
    payment_reference: entry.paymentReference ?? null,
    created_at: entry.createdAt,
    updated_at: entry.updatedAt,
  };
}

function accountStorageKey(userId: string): string {
  return `${STORAGE_KEY}:${userId}`;
}

async function readRemoteData(userId: string): Promise<{ notes: MoneyNote[]; entries: MoneyEntry[] }> {
  if (!supabase) throw new Error('Supabase is not configured.');

  const { data: noteData, error: noteError } = await supabase
    .from('money_notes')
    .select('*')
    .eq('user_id', userId);
  if (noteError) throw noteError;

  const { data: entryData, error: entryError } = await supabase
    .from('money_entries')
    .select('*')
    .eq('user_id', userId);
  if (entryError) throw entryError;

  return {
    notes: (noteData ?? []).map(mapSupabaseNote),
    entries: (entryData ?? []).map(mapSupabaseEntry),
  };
}

async function syncLocalData(userId: string, localData: LocalData): Promise<{ notes: MoneyNote[]; entries: MoneyEntry[] }> {
  if (!supabase) throw new Error('Supabase is not configured.');

  const remoteData = await readRemoteData(userId);
  const remoteNotes = new Map(remoteData.notes.map((note) => [note.id, note]));
  const remoteEntries = new Map(remoteData.entries.map((entry) => [entry.id, entry]));
  const latestChanges = new Map<string, PendingChange>();
  for (const change of localData.changes) {
    const entityId = 'note' in change ? change.note.id
      : 'noteId' in change ? change.noteId
        : 'entry' in change ? change.entry.id
          : change.entryId;
    latestChanges.set(`${change.kind.includes('note') ? 'note' : 'entry'}:${entityId}`, change);
  }

  const noteUpserts = [...latestChanges.values()].filter((change): change is Extract<PendingChange, { kind: 'upsert-note' }> => change.kind === 'upsert-note');
  const entryUpserts = [...latestChanges.values()].filter((change): change is Extract<PendingChange, { kind: 'upsert-entry' }> => change.kind === 'upsert-entry');
  const entryDeletes = [...latestChanges.values()].filter((change): change is Extract<PendingChange, { kind: 'delete-entry' }> => change.kind === 'delete-entry');
  const noteDeletes = [...latestChanges.values()].filter((change): change is Extract<PendingChange, { kind: 'delete-note' }> => change.kind === 'delete-note');

  for (const { note } of noteUpserts) {
    const serverNote = remoteNotes.get(note.id);
    if (!serverNote || note.updatedAt >= serverNote.updatedAt) {
      const { error } = await supabase.from('money_notes').upsert(noteToSupabase(note));
      if (error) throw error;
    }
  }
  for (const { entry } of entryUpserts) {
    const serverEntry = remoteEntries.get(entry.id);
    if (!serverEntry || entry.updatedAt >= serverEntry.updatedAt) {
      const { error } = await supabase.from('money_entries').upsert(entryToSupabase(entry));
      if (error) throw error;
    }
  }
  for (const change of entryDeletes) {
    const serverEntry = remoteEntries.get(change.entryId);
    if (!serverEntry || change.deletedAt >= serverEntry.updatedAt) {
      const { error } = await supabase.from('money_entries').delete().eq('id', change.entryId).eq('user_id', userId);
      if (error) throw error;
    }
  }
  for (const change of noteDeletes) {
    const serverNote = remoteNotes.get(change.noteId);
    if (!serverNote || change.deletedAt >= serverNote.updatedAt) {
      const { error } = await supabase.from('money_notes').delete().eq('id', change.noteId).eq('user_id', userId);
      if (error) throw error;
    }
  }

  return readRemoteData(userId);
}

function mapSupabaseNote(note: SupabaseNote): MoneyNote {
  return {
    id: note.id,
    userId: note.user_id,
    title: note.title,
    createdAt: note.created_at,
    updatedAt: note.updated_at,
  };
}

function mapSupabaseEntry(entry: SupabaseEntry): MoneyEntry {
  return {
    id: entry.id,
    userId: entry.user_id,
    noteId: entry.note_id,
    title: entry.title,
    amountPaise: Number(entry.amount_paise),
    category: entry.category ?? undefined,
    recipientUpiId: entry.recipient_upi_id ?? undefined,
    dueDate: entry.due_date ?? undefined,
    description: entry.description ?? undefined,
    status: entry.status,
    paidAt: entry.paid_at ?? undefined,
    paymentReference: entry.payment_reference ?? undefined,
    createdAt: entry.created_at,
    updatedAt: entry.updated_at,
  };
}

interface AppContextValue {
  user: AppUser | null;
  notes: MoneyNote[];
  entries: MoneyEntry[];
  loading: boolean;
  syncing: boolean;
  initialSyncing: boolean;
  lastSyncedAt?: string;
  pendingChangeCount: number;
  createNote: (title: string) => Promise<MoneyNote>;
  updateNote: (noteId: string, title: string) => Promise<void>;
  deleteNote: (noteId: string) => Promise<void>;
  deleteNotes: (noteIds: string[]) => Promise<void>;
  cloneNote: (noteId: string, title?: string) => Promise<MoneyNote>;
  createEntry: (entry: Omit<MoneyEntry, 'id' | 'userId' | 'createdAt' | 'updatedAt'>) => Promise<MoneyEntry>;
  updateEntry: (entryId: string, changes: Partial<MoneyEntry>) => Promise<void>;
  deleteEntry: (entryId: string) => Promise<void>;
  deleteEntries: (entryIds: string[]) => Promise<void>;
  cloneEntry: (entryId: string) => Promise<MoneyEntry>;
  togglePaidStatus: (entryId: string, confirmed: boolean, paymentReference?: string) => Promise<void>;
  setEntriesPaidStatus: (entryIds: string[], confirmed: boolean) => Promise<void>;
  signIn: () => Promise<void>;
  signOut: () => Promise<void>;
  syncData: () => Promise<void>;
}

const AppContext = createContext<AppContextValue | null>(null);

export function AppProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<AppUser | null>(null);
  const [notes, setNotes] = useState<MoneyNote[]>([]);
  const [entries, setEntries] = useState<MoneyEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [syncing, setSyncing] = useState(false);
  const [initialSyncing, setInitialSyncing] = useState(false);
  const [lastSyncedAt, setLastSyncedAt] = useState<string>();
  const [pendingChangeCount, setPendingChangeCount] = useState(0);
  const dataRef = useRef<LocalData>(emptyLocalData());
  const syncInProgressRef = useRef(false);
  const initialSyncDoneRef = useRef(false);

  const saveLocalData = useCallback(async (nextData: LocalData) => {
    dataRef.current = nextData;
    setNotes(nextData.notes);
    setEntries(nextData.entries);
    setLastSyncedAt(nextData.lastSyncedAt);
    setPendingChangeCount(nextData.changes.length);
    if (user) {
      await AsyncStorage.setItem(accountStorageKey(user.id), JSON.stringify(nextData));
    }
  }, [user]);

  const syncData = useCallback(async () => {
    if (!user) throw new Error('Sign in to sync your data.');
    if (syncInProgressRef.current) return;

    syncInProgressRef.current = true;
    setSyncing(true);
    const startingData = dataRef.current;
    const startingChangeIds = new Set(startingData.changes.map((change) => change.id));
    try {
      const remoteData = await syncLocalData(user.id, startingData);
      const latestData = dataRef.current;
      const remainingChanges = latestData.changes.filter((change) => !startingChangeIds.has(change.id));
      const pendingNoteIds = new Set<string>();
      const pendingEntryIds = new Set<string>();
      const deletedNoteIds = new Set<string>();
      const deletedEntryIds = new Set<string>();
      for (const change of remainingChanges) {
        if ('note' in change) pendingNoteIds.add(change.note.id);
        else if ('noteId' in change) {
          pendingNoteIds.add(change.noteId);
          deletedNoteIds.add(change.noteId);
        } else if ('entry' in change) pendingEntryIds.add(change.entry.id);
        else {
          pendingEntryIds.add(change.entryId);
          deletedEntryIds.add(change.entryId);
        }
      }

      const noteMap = new Map(remoteData.notes.map((note) => [note.id, note]));
      const entryMap = new Map(remoteData.entries.map((entry) => [entry.id, entry]));
      for (const note of latestData.notes) {
        if (pendingNoteIds.has(note.id)) noteMap.set(note.id, note);
      }
      for (const entry of latestData.entries) {
        if (pendingEntryIds.has(entry.id)) entryMap.set(entry.id, entry);
      }
      for (const noteId of deletedNoteIds) noteMap.delete(noteId);
      for (const entryId of deletedEntryIds) entryMap.delete(entryId);

      const nextData: LocalData = {
        notes: [...noteMap.values()],
        entries: [...entryMap.values()],
        changes: remainingChanges,
        lastSyncedAt: new Date().toISOString(),
      };
      await saveLocalData(nextData);
    } finally {
      syncInProgressRef.current = false;
      setSyncing(false);
    }
  }, [saveLocalData, user]);

  useEffect(() => {
    let active = true;

    const bootstrap = async () => {
      try {
        if (supabase) {
          const { data: sessionData } = await supabase.auth.getSession();
          const activeUser = sessionData.session?.user;
          if (activeUser && active) {
            const appUser = {
              id: activeUser.id,
              email: activeUser.email ?? 'unknown@example.com',
              displayName: activeUser.user_metadata?.full_name ?? activeUser.email ?? 'User',
              avatarUrl: activeUser.user_metadata?.avatar_url,
            };
            let stored = await AsyncStorage.getItem(accountStorageKey(appUser.id));
            if (!stored) {
              const legacyStored = await AsyncStorage.getItem(LEGACY_STORAGE_KEY);
              if (legacyStored) {
                const legacyData = JSON.parse(legacyStored) as Pick<LocalData, 'notes' | 'entries'>;
                const migratedData = { ...emptyLocalData(), ...legacyData };
                stored = JSON.stringify(migratedData);
                await AsyncStorage.setItem(accountStorageKey(appUser.id), stored);
                await AsyncStorage.removeItem(LEGACY_STORAGE_KEY);
              }
            }
            const loadedData = stored ? JSON.parse(stored) as LocalData : emptyLocalData();
            if (active) {
              dataRef.current = { ...loadedData, changes: loadedData.changes ?? [] };
              setNotes(loadedData.notes ?? []);
              setEntries(loadedData.entries ?? []);
              setLastSyncedAt(loadedData.lastSyncedAt);
              setPendingChangeCount(dataRef.current.changes.length);
              setUser(appUser);
            }
          }
        }

      } catch (error) {
        console.warn('Unable to restore app data', error);
      } finally {
        if (active) setLoading(false);
      }
    };

    void bootstrap();
    return () => {
      active = false;
    };
  }, []);

  useEffect(() => {
    if (!user || initialSyncDoneRef.current) return;
    initialSyncDoneRef.current = true;
    setInitialSyncing(true);
    void syncData()
      .catch((error) => console.warn('Initial data sync failed', error))
      .finally(() => setInitialSyncing(false));
  }, [syncData, user]);

  useEffect(() => {
    if (!user) return;
    const now = new Date();
    const target = new Date(now);
    target.setHours(22, 0, 0, 0);
    const syncedAfterNightlyTime = lastSyncedAt && new Date(lastSyncedAt) >= target;
    if (!lastSyncedAt) return;
    if (syncedAfterNightlyTime) target.setDate(target.getDate() + 1);
    const syncDelay = target <= now ? 0 : target.getTime() - now.getTime();
    const timeout = setTimeout(() => {
      void syncData().catch((error) => console.warn('Scheduled data sync failed', error));
    }, syncDelay);
    return () => clearTimeout(timeout);
  }, [lastSyncedAt, syncData, user]);

  const createNote = useCallback(async (title: string) => {
    const trimmedTitle = title.trim();
    if (!trimmedTitle) {
      throw new Error('Please provide a note title.');
    }
    if (!user) {
      throw new Error('Sign in to continue.');
    }
    const timestamp = new Date().toISOString();
    const note: MoneyNote = { id: makeId(), userId: user.id, title: trimmedTitle, createdAt: timestamp, updatedAt: timestamp };
    const current = dataRef.current;
    await saveLocalData({
      ...current,
      notes: [note, ...current.notes],
      changes: [...current.changes, { id: makeId(), kind: 'upsert-note', note }],
    });
    return note;
  }, [saveLocalData, user]);

  const updateNote = useCallback(async (noteId: string, title: string) => {
    const trimmedTitle = title.trim();
    if (!trimmedTitle) {
      throw new Error('Note title cannot be empty.');
    }
    if (!user) {
      throw new Error('Sign in to continue.');
    }
    const current = dataRef.current;
    const existing = current.notes.find((note) => note.id === noteId);
    if (!existing) throw new Error('Note not found.');
    const note = { ...existing, title: trimmedTitle, updatedAt: new Date().toISOString() };
    await saveLocalData({
      ...current,
      notes: current.notes.map((item) => item.id === noteId ? note : item),
      changes: [...current.changes, { id: makeId(), kind: 'upsert-note', note }],
    });
  }, [saveLocalData, user]);

  const deleteNotes = useCallback(async (noteIds: string[]) => {
    if (!user) {
      throw new Error('Sign in to continue.');
    }
    const selectedIds = new Set(noteIds);
    if (selectedIds.size === 0) return;
    const current = dataRef.current;
    const removedNotes = current.notes.filter((note) => selectedIds.has(note.id));
    if (removedNotes.length !== selectedIds.size) throw new Error('One or more notes could not be found.');
    const timestamp = new Date().toISOString();
    const removedEntries = current.entries.filter((entry) => selectedIds.has(entry.noteId));
    const changes: PendingChange[] = removedEntries.map((entry) => ({ id: makeId(), kind: 'delete-entry', entryId: entry.id, deletedAt: timestamp }));
    changes.push(...removedNotes.map((note) => ({ id: makeId(), kind: 'delete-note' as const, noteId: note.id, deletedAt: timestamp })));
    await saveLocalData({
      ...current,
      notes: current.notes.filter((note) => !selectedIds.has(note.id)),
      entries: current.entries.filter((entry) => !selectedIds.has(entry.noteId)),
      changes: [...current.changes, ...changes],
    });
  }, [saveLocalData, user]);

  const deleteNote = useCallback(async (noteId: string) => {
    await deleteNotes([noteId]);
  }, [deleteNotes]);

  const cloneNote = useCallback(async (noteId: string, title?: string) => {
    const current = dataRef.current;
    const original = current.notes.find((note) => note.id === noteId);
    if (!original) {
      throw new Error('Note not found.');
    }

    if (!user) {
      throw new Error('Sign in to continue.');
    }
    const timestamp = new Date().toISOString();
    const newNote: MoneyNote = {
      id: makeId(), userId: user.id, title: title?.trim() || `${original.title} Copy`, createdAt: timestamp, updatedAt: timestamp,
    };
    const clonedEntries = current.entries.filter((entry) => entry.noteId === noteId).map((entry): MoneyEntry => ({
      ...entry,
      id: makeId(),
      noteId: newNote.id,
      status: 'PENDING',
      paidAt: undefined,
      paymentReference: undefined,
      createdAt: timestamp,
      updatedAt: timestamp,
    }));
    await saveLocalData({
      ...current,
      notes: [newNote, ...current.notes],
      entries: [...clonedEntries, ...current.entries],
      changes: [
        ...current.changes,
        { id: makeId(), kind: 'upsert-note', note: newNote },
        ...clonedEntries.map((entry) => ({ id: makeId(), kind: 'upsert-entry' as const, entry })),
      ],
    });
    return newNote;
  }, [saveLocalData, user]);

  const createEntry = useCallback(async (entry: Omit<MoneyEntry, 'id' | 'userId' | 'createdAt' | 'updatedAt'>) => {
    if (!user) {
      throw new Error('Sign in to continue.');
    }
    const timestamp = new Date().toISOString();
    const nextEntry: MoneyEntry = { ...entry, id: makeId(), userId: user.id, createdAt: timestamp, updatedAt: timestamp };
    const current = dataRef.current;
    await saveLocalData({
      ...current,
      entries: [nextEntry, ...current.entries],
      changes: [...current.changes, { id: makeId(), kind: 'upsert-entry', entry: nextEntry }],
    });
    return nextEntry;
  }, [saveLocalData, user]);

  const updateEntry = useCallback(async (entryId: string, changes: Partial<MoneyEntry>) => {
    if (!user) {
      throw new Error('Sign in to continue.');
    }
    const current = dataRef.current;
    const existing = current.entries.find((entry) => entry.id === entryId);
    if (!existing) throw new Error('Entry not found.');
    const updatedEntry = {
      ...existing,
      ...changes,
      id: existing.id,
      userId: existing.userId,
      createdAt: existing.createdAt,
      updatedAt: new Date().toISOString(),
    };
    await saveLocalData({
      ...current,
      entries: current.entries.map((entry) => entry.id === entryId ? updatedEntry : entry),
      changes: [...current.changes, { id: makeId(), kind: 'upsert-entry', entry: updatedEntry }],
    });
  }, [saveLocalData, user]);

  const deleteEntries = useCallback(async (entryIds: string[]) => {
    if (!user) {
      throw new Error('Sign in to continue.');
    }
    const selectedIds = new Set(entryIds);
    if (selectedIds.size === 0) return;
    const current = dataRef.current;
    const removedEntries = current.entries.filter((entry) => selectedIds.has(entry.id));
    if (removedEntries.length !== selectedIds.size) throw new Error('One or more entries could not be found.');
    const timestamp = new Date().toISOString();
    const changes: PendingChange[] = removedEntries.map((entry) => ({ id: makeId(), kind: 'delete-entry', entryId: entry.id, deletedAt: timestamp }));
    await saveLocalData({
      ...current,
      entries: current.entries.filter((entry) => !selectedIds.has(entry.id)),
      changes: [...current.changes, ...changes],
    });
  }, [saveLocalData, user]);

  const deleteEntry = useCallback(async (entryId: string) => {
    await deleteEntries([entryId]);
  }, [deleteEntries]);

  const cloneEntry = useCallback(async (entryId: string) => {
    const original = dataRef.current.entries.find((entry) => entry.id === entryId);
    if (!original) {
      throw new Error('Entry not found.');
    }
    if (!user) {
      throw new Error('Sign in to continue.');
    }
    const timestamp = new Date().toISOString();
    const cloned: MoneyEntry = {
      ...original,
      id: makeId(),
      status: 'PENDING',
      paidAt: undefined,
      paymentReference: undefined,
      createdAt: timestamp,
      updatedAt: timestamp,
    };
    const current = dataRef.current;
    await saveLocalData({
      ...current,
      entries: [cloned, ...current.entries],
      changes: [...current.changes, { id: makeId(), kind: 'upsert-entry', entry: cloned }],
    });
    return cloned;
  }, [saveLocalData, user]);

  const togglePaidStatus = useCallback(async (entryId: string, confirmed: boolean, paymentReference?: string) => {
    const current = dataRef.current;
    const currentEntry = current.entries.find((entry) => entry.id === entryId);
    if (!currentEntry) {
      throw new Error('Entry not found.');
    }

    const updatedAt = new Date().toISOString();
    const paidAt = confirmed ? updatedAt : undefined;
    const nextStatus = confirmed ? 'PAID' : 'PENDING';

    const updatedEntry: MoneyEntry = {
      ...currentEntry,
      status: nextStatus,
      paidAt,
      paymentReference: confirmed ? paymentReference ?? currentEntry.paymentReference : undefined,
      updatedAt,
    };
    await saveLocalData({
      ...current,
      entries: current.entries.map((entry) => entry.id === entryId ? updatedEntry : entry),
      changes: [...current.changes, { id: makeId(), kind: 'upsert-entry', entry: updatedEntry }],
    });
  }, [saveLocalData]);

  const setEntriesPaidStatus = useCallback(async (entryIds: string[], confirmed: boolean) => {
    const selectedIds = new Set(entryIds);
    if (selectedIds.size === 0) return;
    const current = dataRef.current;
    const selectedEntries = current.entries.filter((entry) => selectedIds.has(entry.id));
    if (selectedEntries.length !== selectedIds.size) throw new Error('One or more entries could not be found.');
    const updatedAt = new Date().toISOString();
    const nextStatus: EntryStatus = confirmed ? 'PAID' : 'PENDING';
    const updatedEntries = selectedEntries.map((entry): MoneyEntry => ({
      ...entry,
      status: nextStatus,
      paidAt: confirmed ? updatedAt : undefined,
      paymentReference: confirmed ? entry.paymentReference : undefined,
      updatedAt,
    }));
    const updatedEntryMap = new Map(updatedEntries.map((entry) => [entry.id, entry]));
    await saveLocalData({
      ...current,
      entries: current.entries.map((entry) => updatedEntryMap.get(entry.id) ?? entry),
      changes: [...current.changes, ...updatedEntries.map((entry) => ({ id: makeId(), kind: 'upsert-entry' as const, entry }))],
    });
  }, [saveLocalData]);

  const signIn = useCallback(async () => {
    await signInWithGoogle();
    const userData = await supabase?.auth.getUser();
    const sessionUser = userData?.data.user;
    if (sessionUser) {
      const appUser = {
        id: sessionUser.id,
        email: sessionUser.email ?? 'unknown@example.com',
        displayName: sessionUser.user_metadata?.full_name ?? sessionUser.email ?? 'User',
        avatarUrl: sessionUser.user_metadata?.avatar_url,
      };
      const stored = await AsyncStorage.getItem(accountStorageKey(appUser.id));
      const loadedData = stored ? JSON.parse(stored) as LocalData : emptyLocalData();
      dataRef.current = { ...loadedData, changes: loadedData.changes ?? [] };
      setNotes(loadedData.notes ?? []);
      setEntries(loadedData.entries ?? []);
      setPendingChangeCount(dataRef.current.changes.length);
      setUser(appUser);
    }
  }, []);

  const signOut = useCallback(async () => {
    if (syncInProgressRef.current) {
      throw new Error('Wait for sync to finish before signing out.');
    }
    const signingOutUserId = user?.id;
    if (supabase) {
      await signOutUser();
    }
    if (signingOutUserId) {
      await AsyncStorage.removeItem(accountStorageKey(signingOutUserId));
    }
    setUser(null);
    dataRef.current = emptyLocalData();
    setNotes([]);
    setEntries([]);
    setLastSyncedAt(undefined);
    setPendingChangeCount(0);
    initialSyncDoneRef.current = false;
  }, [user]);

  const value = useMemo<AppContextValue>(
    () => ({
      user,
      notes,
      entries,
      loading,
      syncing,
      initialSyncing,
      lastSyncedAt,
      pendingChangeCount,
      createNote,
      updateNote,
      deleteNote,
      deleteNotes,
      cloneNote,
      createEntry,
      updateEntry,
      deleteEntry,
      deleteEntries,
      cloneEntry,
      setEntriesPaidStatus,
      togglePaidStatus,
      signIn,
      signOut,
      syncData,
    }),
    [createEntry, createNote, cloneEntry, cloneNote, deleteEntries, deleteEntry, deleteNote, deleteNotes, entries, initialSyncing, lastSyncedAt, loading, notes, pendingChangeCount, setEntriesPaidStatus, signIn, signOut, syncData, syncing, togglePaidStatus, updateEntry, updateNote, user],
  );

  return <AppContext.Provider value={value}>{children}</AppContext.Provider>;
}

export function useAppData() {
  const context = useContext(AppContext);
  if (!context) {
    throw new Error('useAppData must be used inside AppProvider');
  }
  return context;
}
