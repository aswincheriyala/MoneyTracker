import { AnimatedModal } from '@/components/animated-modal';
import { NoteCard } from '@/components/note-card';
import { MoneyTheme } from '@/constants/money-theme';
import { useAppData } from '@/context/app-context';
import { router } from 'expo-router';
import { useEffect, useMemo, useRef, useState } from 'react';
import { Alert, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

export default function HomeScreen() {
  const { notes, entries, user, createNote, updateNote, deleteNote, deleteNotes, cloneNote } = useAppData();
  const [query, setQuery] = useState('');
  const [draftTitle, setDraftTitle] = useState('');
  const [isComposerOpen, setComposerOpen] = useState(false);
  const [editingNoteId, setEditingNoteId] = useState<string | null>(null);
  const [cloningNoteId, setCloningNoteId] = useState<string | null>(null);
  const [selectedNoteIds, setSelectedNoteIds] = useState<Set<string>>(() => new Set());
  const [isDeletingSelected, setDeletingSelected] = useState(false);
  const titleInputRef = useRef<TextInput>(null);
  const selectionMode = selectedNoteIds.size > 0;

  const filteredNotes = useMemo(() => {
    const lower = query.trim().toLowerCase();
    const base = notes.filter((note) => (lower ? note.title.toLowerCase().includes(lower) : true));
    return base.sort((first, second) => Date.parse(second.createdAt) - Date.parse(first.createdAt));
  }, [notes, query]);
  const hasSearchQuery = query.trim().length > 0;

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
    setDraftTitle('');
    setEditingNoteId(null);
    setCloningNoteId(null);
    setComposerOpen(false);
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

  const toggleNoteSelection = (noteId: string) => {
    setSelectedNoteIds((current) => {
      const next = new Set(current);
      if (next.has(noteId)) next.delete(noteId);
      else next.add(noteId);
      return next;
    });
  };

  const startNoteSelection = (noteId: string) => {
    setSelectedNoteIds((current) => new Set(current).add(noteId));
  };

  const handleNotePress = (noteId: string) => {
    if (selectionMode) {
      toggleNoteSelection(noteId);
      return;
    }
    router.push({ pathname: '/(app)/notes/[id]', params: { id: noteId } });
  };

  const handleDeleteSelected = () => {
    const noteIds = [...selectedNoteIds];
    if (noteIds.length === 0 || isDeletingSelected) return;

    Alert.alert('Delete selected notes?', `Delete ${noteIds.length} notes and all their entries?`, [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete',
        style: 'destructive',
        onPress: async () => {
          setDeletingSelected(true);
          try {
            await deleteNotes(noteIds);
            setSelectedNoteIds(new Set());
          } catch (error) {
            Alert.alert('Delete failed', error instanceof Error ? error.message : 'Unknown error');
          } finally {
            setDeletingSelected(false);
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

        {selectionMode && (
          <View style={styles.selectionToolbar}>
            <Text style={styles.selectionCount}>{selectedNoteIds.size} selected</Text>
            <Pressable onPress={() => setSelectedNoteIds(new Set())} disabled={isDeletingSelected}>
              <Text style={styles.cancelSelectionText}>Cancel</Text>
            </Pressable>
            <Pressable
              style={[styles.deleteSelectedButton, isDeletingSelected && styles.deleteSelectedButtonDisabled]}
              onPress={handleDeleteSelected}
              disabled={isDeletingSelected}>
              <Text style={styles.deleteSelectedText}>{isDeletingSelected ? 'Deleting…' : 'Delete'}</Text>
            </Pressable>
          </View>
        )}

        {filteredNotes.length === 0 ? (
          <View style={styles.emptyState}>
            <Text style={styles.emptyTitle}>{hasSearchQuery ? 'No search results' : 'No notes yet'}</Text>
            {!hasSearchQuery && (
              <>
                <Text style={styles.emptyBody}>Create your first note to track monthly expenses, recurring bills, or investment goals.</Text>
                <Pressable style={styles.primaryButton} onPress={handleCreateNote}>
                  <Text style={styles.primaryText}>Create note</Text>
                </Pressable>
              </>
            )}
          </View>
        ) : (
          filteredNotes.map((note) => (
            <NoteCard
              key={note.id}
              note={note}
              entries={entries}
              onPress={() => handleNotePress(note.id)}
              onLongPress={() => startNoteSelection(note.id)}
              selected={selectedNoteIds.has(note.id)}
              selectionMode={selectionMode}
              onEdit={() => handleEditNote(note.id, note.title)}
              onClone={() => handleCloneNote(note.id)}
              onDelete={() => handleDeleteNote(note.id)}
            />
          ))
        )}
      </ScrollView>

      <NoteComposer
        visible={isComposerOpen}
        title={draftTitle}
        isEditing={Boolean(editingNoteId)}
        isCloning={Boolean(cloningNoteId)}
        inputRef={titleInputRef}
        onChangeTitle={setDraftTitle}
        onClose={closeComposer}
        onSubmit={submitNote}
      />
    </SafeAreaView>
  );
}

type NoteComposerProps = {
  visible: boolean;
  title: string;
  isEditing: boolean;
  isCloning: boolean;
  inputRef: React.RefObject<TextInput | null>;
  onChangeTitle: (value: string) => void;
  onClose: () => void;
  onSubmit: () => void;
};

function NoteComposer({ visible, title, isEditing, isCloning, inputRef, onChangeTitle, onClose, onSubmit }: NoteComposerProps) {
  useEffect(() => {
    if (!visible) return;
    const focusTimer = setTimeout(() => inputRef.current?.focus(), 120);
    return () => clearTimeout(focusTimer);
  }, [visible, inputRef]);

  return (
    <AnimatedModal visible={visible} onClose={onClose}>
      <Text style={styles.modalTitle}>
        {isEditing ? 'Edit note' : isCloning ? 'Clone note' : 'New note'}
      </Text>
      <ScrollView
        style={styles.modalScroll}
        contentContainerStyle={styles.modalScrollContent}
        keyboardShouldPersistTaps="handled"
      >
        <TextInput
          ref={inputRef}
          value={title}
          onChangeText={onChangeTitle}
          placeholder="Note title"
          style={styles.modalInput}
        />
      </ScrollView>
      <View style={styles.modalActions}>
        <Pressable style={styles.modalSecondary} onPress={onClose}>
          <Text style={styles.modalSecondaryText}>Cancel</Text>
        </Pressable>
        <Pressable style={styles.modalPrimary} onPress={onSubmit}>
          <Text style={styles.modalPrimaryText}>
            {isEditing ? 'Save' : isCloning ? 'Create copy' : 'Create'}
          </Text>
        </Pressable>
      </View>
    </AnimatedModal>
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
  selectionToolbar: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
    padding: 12,
    marginBottom: 14,
    backgroundColor: MoneyTheme.surface,
    borderWidth: 1,
    borderColor: MoneyTheme.line,
    borderRadius: 6,
  },
  selectionCount: {
    flex: 1,
    color: MoneyTheme.ink,
    fontWeight: '700',
  },
  cancelSelectionText: {
    color: MoneyTheme.muted,
    fontWeight: '600',
    paddingVertical: 8,
  },
  deleteSelectedButton: {
    backgroundColor: MoneyTheme.danger,
    borderRadius: 5,
    paddingHorizontal: 14,
    paddingVertical: 9,
  },
  deleteSelectedButtonDisabled: {
    opacity: 0.55,
  },
  deleteSelectedText: {
    color: MoneyTheme.surface,
    fontWeight: '700',
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
  modalScroll: {
    flexGrow: 0,
  },
  modalScrollContent: {
    flexGrow: 1,
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
