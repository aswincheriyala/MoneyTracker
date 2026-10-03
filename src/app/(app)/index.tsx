import { NoteCard } from '@/components/note-card';
import { MoneyTheme } from '@/constants/money-theme';
import { useAppData } from '@/context/app-context';
import { router } from 'expo-router';
import { useMemo, useRef, useState } from 'react';
import { Alert, KeyboardAvoidingView, Modal, Platform, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

export default function HomeScreen() {
  const { notes, entries, user, createNote, updateNote, deleteNote, cloneNote } = useAppData();
  const [query, setQuery] = useState('');
  const [draftTitle, setDraftTitle] = useState('');
  const [isComposerOpen, setComposerOpen] = useState(false);
  const [editingNoteId, setEditingNoteId] = useState<string | null>(null);
  const [cloningNoteId, setCloningNoteId] = useState<string | null>(null);
  const titleInputRef = useRef<TextInput>(null);

  const filteredNotes = useMemo(() => {
    const lower = query.trim().toLowerCase();
    const base = notes.filter((note) => (lower ? note.title.toLowerCase().includes(lower) : true));
    return base.sort((first, second) => Date.parse(second.createdAt) - Date.parse(first.createdAt));
  }, [notes, query]);

  const openComposer = (noteId?: string, title?: string, sourceNoteId?: string) => {
    setEditingNoteId(noteId ?? null);
    setCloningNoteId(sourceNoteId ?? null);
    setDraftTitle(title ?? '');
    setComposerOpen(true);
  };

  const handleCreateNote = () => openComposer();

  const handleEditNote = (noteId: string, title: string) => openComposer(noteId, title);

  const handleCloneNote = (noteId: string) => {
    const sourceNote = notes.find((note) => note.id === noteId);
    if (!sourceNote) return;
    openComposer(undefined, `${sourceNote.title} Copy`, sourceNote.id);
  };

  const closeComposer = () => {
    setComposerOpen(false);
    setDraftTitle('');
    setEditingNoteId(null);
    setCloningNoteId(null);
  };

  const submitNote = async () => {
    const cleaned = draftTitle.trim();
    if (!cleaned) {
      Alert.alert('Title required', 'A note title is required.');
      return;
    }

    try {
      if (editingNoteId) {
        await updateNote(editingNoteId, cleaned);
      } else if (cloningNoteId) {
        await cloneNote(cloningNoteId, cleaned);
      } else {
        await createNote(cleaned);
      }
      closeComposer();
    } catch (error) {
      Alert.alert('Unable to save note', error instanceof Error ? error.message : 'Unknown error');
    }
  };

  const handleDeleteNote = (noteId: string) => {
    Alert.alert('Delete note?', 'This will remove the note and all its entries.', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete',
        style: 'destructive',
        onPress: async () => {
          try {
            await deleteNote(noteId);
          } catch (error) {
            Alert.alert('Delete failed', error instanceof Error ? error.message : 'Unknown error');
          }
        },
      },
    ]);
  };

  return (
    <SafeAreaView style={styles.screen} edges={['top', 'bottom']}>
      <ScrollView contentContainerStyle={styles.content}>
        <View style={styles.headerRow}>
          <View>
            <Text style={styles.eyebrow}>Welcome back</Text>
            <Text style={styles.title}>{user?.displayName ?? 'Money Tracker'}</Text>
          </View>
          <Pressable style={styles.profileButton} onPress={() => router.push('/(app)/profile')}>
            <Text style={styles.profileText}>{user?.displayName?.slice(0, 1).toUpperCase() ?? 'M'}</Text>
          </Pressable>
        </View>

        <View style={styles.toolbar}>
          <TextInput
            value={query}
            onChangeText={setQuery}
            placeholder="Search notes"
            style={styles.searchInput}
          />
          <Pressable style={styles.primaryButton} onPress={handleCreateNote}>
            <Text style={styles.primaryText}>+ New</Text>
          </Pressable>
        </View>

        {filteredNotes.length === 0 ? (
          <View style={styles.emptyState}>
            <Text style={styles.emptyTitle}>No notes yet</Text>
            <Text style={styles.emptyBody}>Create your first note to track monthly expenses, recurring bills, or investment goals.</Text>
            <Pressable style={styles.primaryButton} onPress={handleCreateNote}>
              <Text style={styles.primaryText}>Create note</Text>
            </Pressable>
          </View>
        ) : (
          filteredNotes.map((note) => (
            <NoteCard
              key={note.id}
              note={note}
              entries={entries}
              onPress={() => router.push({ pathname: '/(app)/notes/[id]', params: { id: note.id } })}
              onEdit={() => handleEditNote(note.id, note.title)}
              onClone={() => handleCloneNote(note.id)}
              onDelete={() => handleDeleteNote(note.id)}
            />
          ))
        )}
      </ScrollView>

      <Modal
        visible={isComposerOpen}
        transparent
        animationType="slide"
        onRequestClose={closeComposer}
        onShow={() => titleInputRef.current?.focus()}
      >
        <KeyboardAvoidingView
          style={styles.modalBackdrop}
          behavior={Platform.OS === 'ios' ? 'padding' : undefined}
          keyboardVerticalOffset={0}
        >
          <View style={styles.modalCard}>
            <Text style={styles.modalTitle}>
              {editingNoteId ? 'Edit note' : cloningNoteId ? 'Clone note' : 'New note'}
            </Text>
            <TextInput
              ref={titleInputRef}
              value={draftTitle}
              onChangeText={setDraftTitle}
              placeholder="Note title"
              autoFocus
              style={styles.modalInput}
            />
            <View style={styles.modalActions}>
              <Pressable style={styles.modalSecondary} onPress={closeComposer}>
                <Text style={styles.modalSecondaryText}>Cancel</Text>
              </Pressable>
              <Pressable style={styles.modalPrimary} onPress={submitNote}>
                <Text style={styles.modalPrimaryText}>
                  {editingNoteId ? 'Save' : cloningNoteId ? 'Create copy' : 'Create'}
                </Text>
              </Pressable>
            </View>
          </View>
        </KeyboardAvoidingView>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: MoneyTheme.canvas,
  },
  content: {
    padding: 22,
    paddingBottom: 32,
    gap: 4,
  },
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 18,
  },
  eyebrow: {
    color: MoneyTheme.clay,
    fontSize: 12,
    textTransform: 'uppercase',
    fontWeight: '700',
  },
  title: {
    fontSize: 28,
    fontWeight: '600',
    fontFamily: 'serif',
    color: MoneyTheme.ink,
    marginTop: 4,
  },
  profileButton: {
    width: 44,
    height: 44,
    backgroundColor: MoneyTheme.pine,
    borderRadius: 5,
    justifyContent: 'center',
    alignItems: 'center',
  },
  profileText: {
    color: MoneyTheme.surface,
    fontWeight: '700',
    fontSize: 16,
  },
  toolbar: {
    flexDirection: 'row',
    gap: 12,
    alignItems: 'center',
    marginBottom: 16,
  },
  searchInput: {
    flex: 1,
    backgroundColor: MoneyTheme.surface,
    borderRadius: 6,
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontSize: 15,
    borderWidth: 1,
    borderColor: MoneyTheme.line,
  },
  primaryButton: {
    backgroundColor: MoneyTheme.pine,
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 5,
  },
  primaryText: {
    color: MoneyTheme.surface,
    fontWeight: '700',
  },
  emptyState: {
    backgroundColor: MoneyTheme.surface,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: MoneyTheme.line,
    padding: 30,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 12,
  },
  emptyTitle: {
    fontSize: 22,
    fontFamily: 'serif',
    fontWeight: '600',
    color: MoneyTheme.ink,
  },
  emptyBody: {
    textAlign: 'center',
    color: MoneyTheme.muted,
    lineHeight: 22,
  },
  modalBackdrop: {
    flex: 1,
    backgroundColor: MoneyTheme.overlay,
    justifyContent: 'flex-end',
  },
  modalCard: {
    backgroundColor: MoneyTheme.surface,
    borderTopLeftRadius: 8,
    borderTopRightRadius: 8,
    padding: 20,
    gap: 14,
  },
  modalTitle: {
    fontSize: 22,
    fontWeight: '700',
    fontFamily: 'serif',
    color: MoneyTheme.ink,
  },
  modalInput: {
    borderWidth: 1,
    borderColor: MoneyTheme.line,
    backgroundColor: MoneyTheme.canvas,
    borderRadius: 5,
    paddingHorizontal: 12,
    paddingVertical: 12,
    fontSize: 16,
  },
  modalActions: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    gap: 12,
  },
  modalSecondary: {
    borderRadius: 5,
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: MoneyTheme.surfaceSoft,
  },
  modalSecondaryText: {
    color: MoneyTheme.ink,
    fontWeight: '700',
  },
  modalPrimary: {
    borderRadius: 5,
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: MoneyTheme.pine,
  },
  modalPrimaryText: {
    color: MoneyTheme.surface,
    fontWeight: '700',
  },
});
