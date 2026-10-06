import { AnimatedModal } from '@/components/animated-modal';
import { EntryItem } from '@/components/entry-item';
import { UpiAppPicker } from '@/components/upi-app-picker';
import { MoneyThemeColors, useMoneyTheme } from '@/constants/money-theme';
import { useAppData } from '@/context/app-context';
import { formatCurrency, getNoteSummary, sortEntries, toPaise } from '@/lib/finance';
import { detectInstalledUpiApps, openUpiPayment, openUpiPaymentWithApp, UpiApp } from '@/lib/upi';
import { MoneyEntry } from '@/types/finance';
import { router, Stack, useLocalSearchParams } from 'expo-router';
import { useEffect, useMemo, useRef, useState } from 'react';
import { Alert, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

export default function NoteDetailScreen() {
  const theme = useMoneyTheme();
  const styles = useMemo(() => makeStyles(theme), [theme]);
  const { id } = useLocalSearchParams<{ id: string }>();
  const { notes, entries, createEntry, updateEntry, deleteEntry, deleteEntries, setEntriesPaidStatus, togglePaidStatus } = useAppData();
  const note = notes.find((item) => item.id === id);
  const [title, setTitle] = useState('');
  const [amount, setAmount] = useState('');
  const [recipientUpiId, setRecipientUpiId] = useState('');
  const [editingEntryId, setEditingEntryId] = useState<string | null>(null);
  const [formMode, setFormMode] = useState<'create' | 'edit' | 'clone'>('create');
  const [isFormOpen, setFormOpen] = useState(false);
  const [selectedEntryIds, setSelectedEntryIds] = useState<Set<string>>(() => new Set());
  const [isApplyingBulk, setApplyingBulk] = useState(false);
  const entryTitleInputRef = useRef<TextInput>(null);
  const selectionMode = selectedEntryIds.size > 0;
  const [payingEntry, setPayingEntry] = useState<MoneyEntry | null>(null);
  const [upiApps, setUpiApps] = useState<UpiApp[]>([]);
  const [detectingApps, setDetectingApps] = useState(false);

  useEffect(() => {
    if (!isFormOpen) return;
    const focusTimer = setTimeout(() => entryTitleInputRef.current?.focus(), 120);
    return () => clearTimeout(focusTimer);
  }, [isFormOpen]);

  const noteEntries = useMemo(() => sortEntries(entries.filter((entry) => entry.noteId === id), 'created'), [entries, id]);
  const summary = useMemo(() => note ? getNoteSummary(note, entries) : null, [entries, note]);

  const resetForm = () => {
    setTitle('');
    setAmount('');
    setRecipientUpiId('');
    setEditingEntryId(null);
    setFormMode('create');
  };

  const openCreateForm = () => {
    resetForm();
    setFormOpen(true);
  };

  const closeForm = () => {
    resetForm();
    setFormOpen(false);
  };

  const handleSubmit = async () => {
    if (!note) return;
    const parsedAmount = toPaise(amount);

    if (!title.trim()) {
      Alert.alert('Title required', 'Enter an item title before saving.');
      return;
    }
    if (parsedAmount <= 0) {
      Alert.alert('Invalid amount', 'Amount must be greater than zero.');
      return;
    }

    const payload: Omit<MoneyEntry, 'id' | 'userId' | 'createdAt' | 'updatedAt'> = {
      noteId: note.id,
      title: title.trim(),
      amountPaise: parsedAmount,
      recipientUpiId: recipientUpiId.trim() || undefined,
      category: undefined,
      dueDate: undefined,
      description: undefined,
      status: 'PENDING',
      paymentReference: undefined,
      paidAt: undefined,
    };

    try {
      if (editingEntryId) {
        await updateEntry(editingEntryId, payload);
      } else {
        await createEntry(payload);
      }
      closeForm();
    } catch (error) {
      Alert.alert('Save failed', error instanceof Error ? error.message : 'Unknown error');
    }
  };

  const handleEditEntry = (entry: MoneyEntry) => {
    setFormMode('edit');
    setEditingEntryId(entry.id);
    setTitle(entry.title);
    setAmount((entry.amountPaise / 100).toFixed(2));
    setRecipientUpiId(entry.recipientUpiId ?? '');
    setFormOpen(true);
  };

  const handleDeleteEntry = (entryId: string) => {
    Alert.alert('Delete entry?', 'This action cannot be undone.', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete',
        style: 'destructive',
        onPress: async () => {
          try {
            await deleteEntry(entryId);
          } catch (error) {
            Alert.alert('Delete failed', error instanceof Error ? error.message : 'Unknown error');
          }
        },
      },
    ]);
  };

  const handleCloneEntry = (entry: MoneyEntry) => {
    setFormMode('clone');
    setEditingEntryId(null);
    setTitle(entry.title);
    setAmount((entry.amountPaise / 100).toFixed(2));
    setRecipientUpiId(entry.recipientUpiId ?? '');
    setFormOpen(true);
  };

  const handlePay = async (entry: MoneyEntry) => {
    if (entry.amountPaise <= 0) {
      Alert.alert('Invalid amount', 'Enter a valid amount before paying.');
      return;
    }

    setPayingEntry(entry);
    setDetectingApps(true);
    const installed = await detectInstalledUpiApps();
    setUpiApps(installed);
    setDetectingApps(false);
  };

  const launchGenericUpi = async (entry: MoneyEntry) => {
    const didOpen = await openUpiPayment(entry, note?.title ?? 'Money Tracker');
    if (!didOpen) {
      Alert.alert('No UPI app found', 'Install a UPI app like Google Pay, PhonePe, or Paytm to make this payment. The entry remains pending.');
      return;
    }
    setPayingEntry(null);
    router.push({ pathname: '/(app)/payment-confirm', params: { entryId: entry.id, returnTo: 'note' } });
  };

  const handlePickUpiApp = async (app: UpiApp) => {
    if (!payingEntry) return;
    const didOpen = await openUpiPaymentWithApp(payingEntry, note?.title ?? 'Money Tracker', app);
    if (!didOpen) {
      Alert.alert('Could not open app', `${app.name} did not respond. Try another UPI app.`);
      return;
    }
    const entry = payingEntry;
    setPayingEntry(null);
    router.push({ pathname: '/(app)/payment-confirm', params: { entryId: entry.id, returnTo: 'note' } });
  };

  const handleMarkPaid = async (entry: MoneyEntry) => {
    await togglePaidStatus(entry.id, true);
    // Alert.alert('Mark as paid?', `Confirm that ${entry.title} has been paid.`, [
    //   { text: 'Cancel', style: 'cancel' },
    //   {
    //     text: 'Mark paid',
    //     onPress: async () => {
    //       try {
    //         await togglePaidStatus(entry.id, true);
    //         // Alert.alert('Marked as paid', `${entry.title} is now marked as paid.`);
    //       } catch (error) {
    //         Alert.alert('Unable to update payment', error instanceof Error ? error.message : 'Unknown error');
    //       }
    //     },
    //   },
    // ]);
  };

  const handleMarkPending = async (entry: MoneyEntry) => {
    await togglePaidStatus(entry.id, false);
    // Alert.alert('Revert to pending?', `Mark ${entry.title} as pending again?`, [
    //   { text: 'Cancel', style: 'cancel' },
    //   {
    //     text: 'Mark pending',
    //     onPress: async () => {
    //       try {
    //         await togglePaidStatus(entry.id, false);
    //         // Alert.alert('Marked as pending', `${entry.title} is pending again.`);
    //       } catch (error) {
    //         Alert.alert('Unable to update payment', error instanceof Error ? error.message : 'Unknown error');
    //       }
    //     },
    //   },
    // ]);
  };

  const toggleEntrySelection = (entryId: string) => {
    setSelectedEntryIds((current) => {
      const next = new Set(current);
      if (next.has(entryId)) next.delete(entryId);
      else next.add(entryId);
      return next;
    });
  };

  const startEntrySelection = (entryId: string) => {
    setSelectedEntryIds((current) => new Set(current).add(entryId));
  };

  const handleEntryPress = (entry: MoneyEntry) => {
    if (selectionMode) toggleEntrySelection(entry.id);
  };

  const handleBulkSetPaidStatus = async (confirmed: boolean) => {
    const entryIds = [...selectedEntryIds];
    if (entryIds.length === 0 || isApplyingBulk) return;
    setApplyingBulk(true);
    try {
      await setEntriesPaidStatus(entryIds, confirmed);
      setSelectedEntryIds(new Set());
    } catch (error) {
      Alert.alert('Update failed', error instanceof Error ? error.message : 'Unknown error');
    } finally {
      setApplyingBulk(false);
    }
  };

  const handleDeleteSelectedEntries = () => {
    const entryIds = [...selectedEntryIds];
    if (entryIds.length === 0 || isApplyingBulk) return;

    Alert.alert('Delete selected entries?', `Delete ${entryIds.length} entries? This action cannot be undone.`, [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete',
        style: 'destructive',
        onPress: async () => {
          setApplyingBulk(true);
          try {
            await deleteEntries(entryIds);
            setSelectedEntryIds(new Set());
          } catch (error) {
            Alert.alert('Delete failed', error instanceof Error ? error.message : 'Unknown error');
          } finally {
            setApplyingBulk(false);
          }
        },
      },
    ]);
  };

  if (!note) {
    return (
      <View style={styles.emptyState}>
        <Text style={styles.emptyTitle}>Note not found</Text>
      </View>
    );
  }

  return (
    <SafeAreaView style={styles.screen} edges={['bottom']}>
      <Stack.Screen options={{ title: note.title }} />
      <ScrollView contentContainerStyle={styles.container}>
        {noteEntries.length !== 0 && (
          <View style={styles.summarySection}>
          <View style={styles.summaryTotalRow}>
            <View>
              <Text style={styles.summaryLabel}>Total tracked</Text>
              <Text style={styles.summaryCount}>{noteEntries.length} items</Text>
            </View>
            <Text style={styles.summaryTotal}>{formatCurrency(summary?.totalPaise ?? 0)}</Text>
          </View>
          <View style={styles.summaryDivider} />
          <View style={styles.summaryMetrics}>
            {[
              { label: 'Paid', amountPaise: summary?.paidPaise ?? 0, color: theme.paid },
              { label: 'Pending', amountPaise: summary?.pendingPaise ?? 0, color: theme.pending },
            ].map((metric, index) => (
              <View key={metric.label} style={[styles.summaryMetric, index > 0 && styles.summaryMetricSeparated]}>
                <Text style={styles.summaryMetricLabel}>{metric.label}</Text>
                <Text style={[styles.summaryMetricValue, { color: metric.color }]}>{formatCurrency(metric.amountPaise)}</Text>
              </View>
            ))}
          </View>
        </View>
        )}

        {selectionMode && (
          <View style={styles.selectionToolbar}>
            <Text style={styles.selectionCount}>{selectedEntryIds.size} selected</Text>
            <Pressable onPress={() => setSelectedEntryIds(new Set())} disabled={isApplyingBulk}>
              <Text style={styles.cancelSelectionText}>Cancel</Text>
            </Pressable>
            <Pressable
              style={[styles.bulkPaidButton, isApplyingBulk && styles.bulkButtonDisabled]}
              onPress={() => handleBulkSetPaidStatus(true)}
              disabled={isApplyingBulk}>
              <Text style={styles.bulkPaidText}>Mark paid</Text>
            </Pressable>
            <Pressable
              style={[styles.bulkPendingButton, isApplyingBulk && styles.bulkButtonDisabled]}
              onPress={() => handleBulkSetPaidStatus(false)}
              disabled={isApplyingBulk}>
              <Text style={styles.bulkPendingText}>Mark pending</Text>
            </Pressable>
            <Pressable
              style={[styles.bulkDeleteButton, isApplyingBulk && styles.bulkButtonDisabled]}
              onPress={handleDeleteSelectedEntries}
              disabled={isApplyingBulk}>
              <Text style={styles.bulkDeleteText}>{isApplyingBulk ? 'Working…' : 'Delete'}</Text>
            </Pressable>
          </View>
        )}

        {noteEntries.length === 0 ? (
          <View style={styles.emptyState}>
            <Text style={styles.emptyTitle}>No entries in this note yet</Text>
          </View>
        ) : (
          noteEntries.map((entry) => (
            <EntryItem
              key={entry.id}
              entry={entry}
              onEdit={() => handleEditEntry(entry)}
              onDelete={() => handleDeleteEntry(entry.id)}
              onClone={() => handleCloneEntry(entry)}
              onPay={() => handlePay(entry)}
              onMarkPaid={() => handleMarkPaid(entry)}
              onMarkPending={() => handleMarkPending(entry)}
              onPress={() => handleEntryPress(entry)}
              onLongPress={() => startEntrySelection(entry.id)}
              selected={selectedEntryIds.has(entry.id)}
              selectionMode={selectionMode}
            />
          ))
        )}
      </ScrollView>

      <Pressable
        style={styles.floatingButton}
        onPress={openCreateForm}
        accessibilityRole="button"
        accessibilityLabel="Add item"
      >
        <Text style={styles.floatingButtonText}>+</Text>
      </Pressable>

      <AnimatedModal visible={isFormOpen} onClose={closeForm}>
        <EntryFormHeader
          mode={formMode}
          onClose={closeForm}
        />
        <ScrollView
          style={styles.modalScroll}
          contentContainerStyle={styles.modalContent}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          <TextInput ref={entryTitleInputRef} value={title} onChangeText={setTitle} placeholder="Title or item" placeholderTextColor={theme.quiet} style={styles.input} />
          <View style={styles.quickAmountRow}>
            {[500, 1000, 5000].map((preset) => (
              <Pressable
                key={preset}
                style={styles.quickAmountButton}
                onPress={() => setAmount(((toPaise(amount) + preset * 100) / 100).toString())}
                accessibilityRole="button"
                accessibilityLabel={`Add ${preset} rupees to amount`}
              >
                <Text style={styles.quickAmountText}>+₹{preset.toLocaleString('en-IN')}</Text>
              </Pressable>
            ))}
          </View>
          <TextInput value={amount} onChangeText={setAmount} placeholder="Amount in ₹" keyboardType="decimal-pad" placeholderTextColor={theme.quiet} style={styles.input} />
          <TextInput value={recipientUpiId} onChangeText={setRecipientUpiId} placeholder="Recipient UPI ID (optional)" placeholderTextColor={theme.quiet} style={styles.input} />
          <View style={styles.formActions}>
            <Pressable style={styles.secondaryButton} onPress={closeForm}>
              <Text style={styles.secondaryText}>Cancel</Text>
            </Pressable>
            <Pressable style={styles.primaryButton} onPress={handleSubmit}>
              <Text style={styles.primaryText}>
                {formMode === 'edit' ? 'Update item' : formMode === 'clone' ? 'Create copy' : 'Add item'}
              </Text>
            </Pressable>
          </View>
        </ScrollView>
      </AnimatedModal>

      <UpiAppPicker
        visible={payingEntry !== null}
        apps={upiApps}
        loading={detectingApps}
        onSelect={handlePickUpiApp}
        onSelectGeneric={() => {
          if (payingEntry) void launchGenericUpi(payingEntry);
        }}
        onClose={() => setPayingEntry(null)}
      />
    </SafeAreaView>
  );
}

function EntryFormHeader({ mode, onClose }: { mode: 'create' | 'edit' | 'clone'; onClose: () => void }) {
  const theme = useMoneyTheme();
  const styles = useMemo(() => makeStyles(theme), [theme]);
  return (
    <View style={styles.modalHeader}>
      <Text style={styles.formTitle}>
        {mode === 'edit' ? 'Edit item' : mode === 'clone' ? 'Clone item' : 'Add item'}
      </Text>
      <Pressable onPress={onClose} accessibilityRole="button" accessibilityLabel="Close form">
        <Text style={styles.modalClose}>×</Text>
      </Pressable>
    </View>
  );
}

const makeStyles = (theme: MoneyThemeColors) => StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: theme.canvas,
  },
  container: {
    padding: 18,
    backgroundColor: theme.canvas,
    paddingBottom: 104,
    gap: 16,
  },
  summarySection: {
    gap: 12,
    marginBottom: 4,
  },
  summaryTotalRow: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    justifyContent: 'space-between',
    gap: 12,
  },
  summaryLabel: {
    color: theme.muted,
    fontSize: 14,
    fontWeight: '700',
  },
  summaryCount: {
    color: theme.quiet,
    fontSize: 12,
    marginTop: 3,
  },
  summaryTotal: {
    color: theme.ink,
    fontFamily: 'serif',
    fontWeight: '600',
    fontSize: 26,
    flexShrink: 1,
  },
  summaryDivider: {
    height: StyleSheet.hairlineWidth,
    backgroundColor: theme.line,
  },
  summaryMetrics: {
    flexDirection: 'row',
  },
  summaryMetric: {
    flex: 1,
    minWidth: 0,
  },
  summaryMetricSeparated: {
    borderLeftWidth: StyleSheet.hairlineWidth,
    borderLeftColor: theme.line,
    paddingLeft: 12,
  },
  summaryMetricLabel: {
    color: theme.muted,
    fontSize: 11,
    fontWeight: '600',
    marginBottom: 4,
  },
  summaryMetricValue: {
    fontSize: 14,
    fontWeight: '700',
    flexShrink: 1,
  },
  floatingButton: {
    position: 'absolute',
    right: 22,
    bottom: 22,
    width: 58,
    height: 58,
    borderRadius: 29,
    backgroundColor: theme.pine,
    alignItems: 'center',
    justifyContent: 'center',
    elevation: 5,
    shadowColor: theme.ink,
    shadowOpacity: 0.22,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 4 },
  },
  floatingButtonText: {
    color: theme.surface,
    fontSize: 34,
    fontWeight: '400',
    lineHeight: 38,
    marginTop: -2,
  },
  modalScroll: {
    flexGrow: 0,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  modalClose: {
    color: theme.muted,
    fontSize: 28,
    lineHeight: 30,
    paddingHorizontal: 4,
  },
  modalContent: {
    gap: 10,
    paddingBottom: 4,
  },
  formTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: theme.ink,
    fontFamily: 'serif',
    marginBottom: 2,
  },
  input: {
    backgroundColor: theme.canvas,
    borderRadius: 5,
    borderWidth: 1,
    borderColor: theme.line,
    paddingHorizontal: 12,
    paddingVertical: 12,
    fontSize: 15,
    color: theme.ink,
  },
  quickAmountRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  quickAmountButton: {
    flex: 1,
    minWidth: 76,
    minHeight: 40,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 10,
    borderWidth: 1,
    borderColor: theme.line,
    borderRadius: 5,
    backgroundColor: theme.surfaceSoft,
  },
  quickAmountText: {
    color: theme.ink,
    fontSize: 13,
    fontWeight: '700',
  },
  formActions: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    gap: 12,
    marginTop: 8,
  },
  primaryButton: {
    backgroundColor: theme.pine,
    paddingHorizontal: 18,
    paddingVertical: 12,
    borderRadius: 5,
  },
  primaryText: {
    color: theme.surface,
    fontWeight: '700',
  },
  secondaryButton: {
    backgroundColor: theme.surfaceSoft,
    paddingHorizontal: 18,
    paddingVertical: 12,
    borderRadius: 5,
  },
  secondaryText: {
    color: theme.ink,
    fontWeight: '700',
  },
  selectionToolbar: {
    flexDirection: 'row',
    alignItems: 'center',
    flexWrap: 'wrap',
    gap: 10,
    padding: 12,
    backgroundColor: theme.surface,
    borderWidth: 1,
    borderColor: theme.line,
    borderRadius: 6,
  },
  selectionCount: {
    flex: 1,
    color: theme.ink,
    fontWeight: '700',
  },
  cancelSelectionText: {
    color: theme.muted,
    fontWeight: '600',
    paddingVertical: 8,
  },
  bulkPaidButton: {
    backgroundColor: theme.paid,
    borderRadius: 5,
    paddingHorizontal: 12,
    paddingVertical: 9,
  },
  bulkPaidText: {
    color: theme.surface,
    fontWeight: '700',
    fontSize: 12,
  },
  bulkPendingButton: {
    backgroundColor: theme.surfaceSoft,
    borderWidth: 1,
    borderColor: theme.line,
    borderRadius: 5,
    paddingHorizontal: 12,
    paddingVertical: 9,
  },
  bulkPendingText: {
    color: theme.ink,
    fontWeight: '700',
    fontSize: 12,
  },
  bulkDeleteButton: {
    backgroundColor: theme.danger,
    borderRadius: 5,
    paddingHorizontal: 12,
    paddingVertical: 9,
  },
  bulkDeleteText: {
    color: theme.surface,
    fontWeight: '700',
    fontSize: 12,
  },
  bulkButtonDisabled: {
    opacity: 0.55,
  },
  emptyState: {
    backgroundColor: theme.surface,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: theme.line,
    padding: 24,
    alignItems: 'center',
  },
  emptyTitle: {
    color: theme.muted,
    fontWeight: '600',
    fontSize: 18,
  },
});
