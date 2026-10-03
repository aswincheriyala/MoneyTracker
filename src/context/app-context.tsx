import AsyncStorage from '@react-native-async-storage/async-storage';
import React, { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';

import { signInWithGoogle, signOutUser, supabase } from '@/lib/supabase';
import { AppUser, EntryStatus, MoneyEntry, MoneyNote } from '@/types/finance';

const STORAGE_KEY = 'moneytracker:data:v1';

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
  createNote: (title: string) => Promise<MoneyNote>;
  updateNote: (noteId: string, title: string) => Promise<void>;
  deleteNote: (noteId: string) => Promise<void>;
  cloneNote: (noteId: string, title?: string) => Promise<MoneyNote>;
  createEntry: (entry: Omit<MoneyEntry, 'id' | 'userId' | 'createdAt' | 'updatedAt'>) => Promise<MoneyEntry>;
  updateEntry: (entryId: string, changes: Partial<MoneyEntry>) => Promise<void>;
  deleteEntry: (entryId: string) => Promise<void>;
  cloneEntry: (entryId: string) => Promise<MoneyEntry>;
  togglePaidStatus: (entryId: string, confirmed: boolean, paymentReference?: string) => Promise<void>;
  signIn: () => Promise<void>;
  signOut: () => Promise<void>;
  refreshData: () => Promise<void>;
}

const AppContext = createContext<AppContextValue | null>(null);

export function AppProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<AppUser | null>(null);
  const [notes, setNotes] = useState<MoneyNote[]>([]);
  const [entries, setEntries] = useState<MoneyEntry[]>([]);
  const [loading, setLoading] = useState(true);

  const persistLocalData = useCallback(async (nextNotes: MoneyNote[], nextEntries: MoneyEntry[]) => {
    await AsyncStorage.setItem(
      STORAGE_KEY,
      JSON.stringify({
        notes: nextNotes,
        entries: nextEntries,
      }),
    );
  }, []);

  const fetchUserData = useCallback(async (userId: string) => {
    if (!supabase) {
      throw new Error('Supabase is not configured.');
    }

    const { data: noteData, error: noteError } = await supabase
      .from('money_notes')
      .select('*')
      .eq('user_id', userId)
      .order('updated_at', { ascending: false });
    if (noteError) throw noteError;

    const { data: entryData, error: entryError } = await supabase
      .from('money_entries')
      .select('*')
      .eq('user_id', userId)
      .order('updated_at', { ascending: false });
    if (entryError) throw entryError;

    const loadedNotes = (noteData ?? []).map(mapSupabaseNote);
    const loadedEntries = (entryData ?? []).map(mapSupabaseEntry);
    await persistLocalData(loadedNotes, loadedEntries);
    return { notes: loadedNotes, entries: loadedEntries };
  }, [persistLocalData]);

  const refreshData = useCallback(async () => {
    if (!user) {
      setNotes([]);
      setEntries([]);
      return;
    }

    if (supabase) {
      const loadedData = await fetchUserData(user.id);
      setNotes(loadedData.notes);
      setEntries(loadedData.entries);
      return;
    }

    const stored = await AsyncStorage.getItem(STORAGE_KEY);
    if (stored) {
      const parsed = JSON.parse(stored) as { notes?: MoneyNote[]; entries?: MoneyEntry[] };
      setNotes(parsed.notes ?? []);
      setEntries(parsed.entries ?? []);
    }
  }, [fetchUserData, user]);

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
            setUser(appUser);
            const loadedData = await fetchUserData(appUser.id);
            if (active) {
              setNotes(loadedData.notes);
              setEntries(loadedData.entries);
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
  }, [fetchUserData]);

  const createNote = useCallback(async (title: string) => {
    const trimmedTitle = title.trim();
    if (!trimmedTitle) {
      throw new Error('Please provide a note title.');
    }
    if (!supabase || !user) {
      throw new Error('Sign in to continue.');
    }

    const { data, error } = await supabase
      .from('money_notes')
      .insert({ user_id: user.id, title: trimmedTitle })
      .select('*')
      .single();
    if (error) throw error;

    const note = mapSupabaseNote(data);

    const nextNotes = [note, ...notes];
    setNotes(nextNotes);
    await persistLocalData(nextNotes, entries);
    return note;
  }, [entries, notes, persistLocalData, user]);

  const updateNote = useCallback(async (noteId: string, title: string) => {
    const trimmedTitle = title.trim();
    if (!trimmedTitle) {
      throw new Error('Note title cannot be empty.');
    }
    if (!supabase || !user) {
      throw new Error('Sign in to continue.');
    }

    const { data, error } = await supabase
      .from('money_notes')
      .update({ title: trimmedTitle })
      .eq('id', noteId)
      .eq('user_id', user.id)
      .select('*')
      .maybeSingle();
    if (error) throw error;
    if (!data) throw new Error('Note not found.');

    const updatedNote = mapSupabaseNote(data);
    const nextNotes = notes.map((note) => note.id === noteId ? updatedNote : note);
    setNotes(nextNotes);
    await persistLocalData(nextNotes, entries);
  }, [entries, notes, persistLocalData, user]);

  const deleteNote = useCallback(async (noteId: string) => {
    if (!supabase || !user) {
      throw new Error('Sign in to continue.');
    }

    const { data, error } = await supabase
      .from('money_notes')
      .delete()
      .eq('id', noteId)
      .eq('user_id', user.id)
      .select('id')
      .maybeSingle();
    if (error) throw error;
    if (!data) throw new Error('Note not found.');

    const nextNotes = notes.filter((note) => note.id !== noteId);
    const nextEntries = entries.filter((entry) => entry.noteId !== noteId);
    setNotes(nextNotes);
    setEntries(nextEntries);
    await persistLocalData(nextNotes, nextEntries);
  }, [entries, notes, persistLocalData, user]);

  const cloneNote = useCallback(async (noteId: string, title?: string) => {
    const original = notes.find((note) => note.id === noteId);
    if (!original) {
      throw new Error('Note not found.');
    }

    if (!supabase || !user) {
      throw new Error('Sign in to continue.');
    }

    const { data: noteData, error: noteError } = await supabase
      .from('money_notes')
      .insert({ user_id: user.id, title: title?.trim() || `${original.title} Copy` })
      .select('*')
      .single();
    if (noteError) throw noteError;

    const newNote = mapSupabaseNote(noteData);

    const matchingEntries = entries.filter((entry) => entry.noteId === noteId);
    let clonedEntries: MoneyEntry[] = [];
    if (matchingEntries.length > 0) {
      const { data: entryData, error: entryError } = await supabase
        .from('money_entries')
        .insert(matchingEntries.map((entry) => ({
          user_id: user.id,
          note_id: newNote.id,
          title: entry.title,
          amount_paise: entry.amountPaise,
          category: entry.category ?? null,
          recipient_upi_id: entry.recipientUpiId ?? null,
          due_date: entry.dueDate ?? null,
          description: entry.description ?? null,
          status: 'PENDING',
        })))
        .select('*');
      if (entryError) {
        await supabase.from('money_notes').delete().eq('id', newNote.id).eq('user_id', user.id);
        throw entryError;
      }
      clonedEntries = (entryData ?? []).map(mapSupabaseEntry);
    }

    const nextNotes = [newNote, ...notes];
    const nextEntries = [...clonedEntries, ...entries];
    setNotes(nextNotes);
    setEntries(nextEntries);
    await persistLocalData(nextNotes, nextEntries);
    return newNote;
  }, [entries, notes, persistLocalData, user]);

  const createEntry = useCallback(async (entry: Omit<MoneyEntry, 'id' | 'userId' | 'createdAt' | 'updatedAt'>) => {
    if (!supabase || !user) {
      throw new Error('Sign in to continue.');
    }

    const { data, error } = await supabase
      .from('money_entries')
      .insert({
        user_id: user.id,
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
      })
      .select('*')
      .single();
    if (error) throw error;

    const nextEntry = mapSupabaseEntry(data);

    const nextEntries = [nextEntry, ...entries];
    setEntries(nextEntries);
    await persistLocalData(notes, nextEntries);
    return nextEntry;
  }, [entries, notes, persistLocalData, user]);

  const updateEntry = useCallback(async (entryId: string, changes: Partial<MoneyEntry>) => {
    if (!supabase || !user) {
      throw new Error('Sign in to continue.');
    }

    const rowChanges: Record<string, unknown> = { updated_at: new Date().toISOString() };
    if ('noteId' in changes) rowChanges.note_id = changes.noteId;
    if ('title' in changes) rowChanges.title = changes.title;
    if ('amountPaise' in changes) rowChanges.amount_paise = changes.amountPaise;
    if ('category' in changes) rowChanges.category = changes.category ?? null;
    if ('recipientUpiId' in changes) rowChanges.recipient_upi_id = changes.recipientUpiId ?? null;
    if ('dueDate' in changes) rowChanges.due_date = changes.dueDate ?? null;
    if ('description' in changes) rowChanges.description = changes.description ?? null;
    if ('status' in changes) rowChanges.status = changes.status;
    if ('paidAt' in changes) rowChanges.paid_at = changes.paidAt ?? null;
    if ('paymentReference' in changes) rowChanges.payment_reference = changes.paymentReference ?? null;

    const { data, error } = await supabase
      .from('money_entries')
      .update(rowChanges)
      .eq('id', entryId)
      .eq('user_id', user.id)
      .select('*')
      .maybeSingle();
    if (error) throw error;
    if (!data) throw new Error('Entry not found.');

    const updatedEntry = mapSupabaseEntry(data);
    const nextEntries: MoneyEntry[] = entries.map((entry) => entry.id === entryId ? updatedEntry : entry);
    setEntries(nextEntries);
    await persistLocalData(notes, nextEntries);
  }, [entries, notes, persistLocalData, user]);

  const deleteEntry = useCallback(async (entryId: string) => {
    if (!supabase || !user) {
      throw new Error('Sign in to continue.');
    }

    const { data, error } = await supabase
      .from('money_entries')
      .delete()
      .eq('id', entryId)
      .eq('user_id', user.id)
      .select('id')
      .maybeSingle();
    if (error) throw error;
    if (!data) throw new Error('Entry not found.');

    const nextEntries = entries.filter((entry) => entry.id !== entryId);
    setEntries(nextEntries);
    await persistLocalData(notes, nextEntries);
  }, [entries, notes, persistLocalData, user]);

  const cloneEntry = useCallback(async (entryId: string) => {
    const original = entries.find((entry) => entry.id === entryId);
    if (!original) {
      throw new Error('Entry not found.');
    }
    if (!supabase || !user) {
      throw new Error('Sign in to continue.');
    }

    const { data, error } = await supabase
      .from('money_entries')
      .insert({
        user_id: user.id,
        note_id: original.noteId,
        title: original.title,
        amount_paise: original.amountPaise,
        category: original.category ?? null,
        recipient_upi_id: original.recipientUpiId ?? null,
        due_date: original.dueDate ?? null,
        description: original.description ?? null,
        status: 'PENDING',
      })
      .select('*')
      .single();
    if (error) throw error;

    const cloned = mapSupabaseEntry(data);

    const nextEntries = [cloned, ...entries];
    setEntries(nextEntries);
    await persistLocalData(notes, nextEntries);
    return cloned;
  }, [entries, notes, persistLocalData, user]);

  const togglePaidStatus = useCallback(async (entryId: string, confirmed: boolean, paymentReference?: string) => {
    const currentEntry = entries.find((entry) => entry.id === entryId);
    if (!currentEntry) {
      throw new Error('Entry not found.');
    }

    const updatedAt = new Date().toISOString();
    const paidAt = confirmed ? updatedAt : undefined;
    const nextStatus = confirmed ? 'PAID' : 'PENDING';

    if (supabase) {
      const { data, error } = await supabase
        .from('money_entries')
        .update({
          status: nextStatus,
          paid_at: paidAt ?? null,
          payment_reference: confirmed ? paymentReference ?? currentEntry.paymentReference ?? null : null,
          updated_at: updatedAt,
        })
        .eq('id', entryId)
        .eq('user_id', currentEntry.userId)
        .select('id')
        .maybeSingle();

      if (error) throw error;
      if (!data) throw new Error('Entry could not be updated.');
    }

    const nextEntries: MoneyEntry[] = entries.map((entry) => {
      if (entry.id !== entryId) return entry;
      if (!confirmed) {
        return { ...entry, status: 'PENDING' as const, paidAt: undefined, paymentReference: undefined, updatedAt };
      }
      return {
        ...entry,
        status: 'PAID' as const,
        paidAt: updatedAt,
        paymentReference: paymentReference ?? entry.paymentReference,
        updatedAt,
      };
    });
    setEntries(nextEntries);
    await persistLocalData(notes, nextEntries);
  }, [entries, notes, persistLocalData]);

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
      setUser(appUser);
      const loadedData = await fetchUserData(appUser.id);
      setNotes(loadedData.notes);
      setEntries(loadedData.entries);
    }
  }, [fetchUserData]);

  const signOut = useCallback(async () => {
    if (supabase) {
      await signOutUser();
    }
    setUser(null);
    setNotes([]);
    setEntries([]);
    await AsyncStorage.removeItem(STORAGE_KEY);
  }, []);

  const value = useMemo<AppContextValue>(
    () => ({
      user,
      notes,
      entries,
      loading,
      createNote,
      updateNote,
      deleteNote,
      cloneNote,
      createEntry,
      updateEntry,
      deleteEntry,
      cloneEntry,
      togglePaidStatus,
      signIn,
      signOut,
      refreshData,
    }),
    [createEntry, createNote, cloneEntry, cloneNote, deleteEntry, deleteNote, entries, loading, notes, refreshData, signIn, signOut, togglePaidStatus, updateEntry, updateNote, user],
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
