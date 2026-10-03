import { MoneyTheme } from '@/constants/money-theme';
import { formatCurrency, getNoteSummary } from '@/lib/finance';
import { MoneyEntry, MoneyNote } from '@/types/finance';
import { Pressable, StyleSheet, Text, View } from 'react-native';

interface NoteCardProps {
  note: MoneyNote;
  entries: MoneyEntry[];
  onPress: () => void;
  onEdit: () => void;
  onClone: () => void;
  onDelete: () => void;
}

export function NoteCard({ note, entries, onPress, onEdit, onClone, onDelete }: NoteCardProps) {
  const summary = getNoteSummary(note, entries);

  return (
    <Pressable onPress={onPress} style={styles.card}>
      <View style={styles.headerRow}>
        <View style={styles.titleWrap}>
          <Text style={styles.title}>{note.title}</Text>
          <Text style={styles.meta}>{summary.entryCount} entries</Text>
        </View>
        <View style={styles.miniActions}>
          <Text onPress={onEdit} style={styles.pill}>Edit</Text>
          <Text onPress={onClone} style={styles.pill}>Clone</Text>
          <Text onPress={onDelete} style={[styles.pill, styles.danger]}>Delete</Text>
        </View>
      </View>
      <Text style={styles.total}>{formatCurrency(summary.totalPaise)}</Text>
      <View style={styles.row}>
        <Text style={styles.label}>Paid</Text>
        <Text style={styles.value}>{formatCurrency(summary.paidPaise)}</Text>
      </View>
      <View style={styles.row}>
        <Text style={styles.label}>Pending</Text>
        <Text style={styles.value}>{formatCurrency(summary.pendingPaise)}</Text>
      </View>
      <View style={styles.progressWrap}>
        <View style={[styles.progressBar, { width: `${Math.min(summary.paidPercent, 100)}%` }]} />
      </View>
      <Text style={styles.completion}>{Math.round(summary.paidPercent)}% complete</Text>
      {summary.entryCount > 0 && summary.paidPercent >= 100 ? (
        <View pointerEvents="none" style={styles.completedStampPosition}>
          <View style={styles.completedStamp}>
            <Text style={styles.completedStampText}>COMPLETED</Text>
          </View>
        </View>
      ) : null}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  card: {
    position: 'relative',
    backgroundColor: MoneyTheme.surface,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: MoneyTheme.line,
    borderLeftWidth: 3,
    borderLeftColor: MoneyTheme.clay,
    padding: 16,
    marginBottom: 14,
  },
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 8,
  },
  titleWrap: { flex: 1 },
  title: {
    fontSize: 18,
    color: MoneyTheme.ink,
    fontFamily: 'serif',
    fontWeight: '600',
  },
  meta: {
    color: MoneyTheme.muted,
    fontSize: 12,
    marginTop: 4,
  },
  miniActions: {
    flexDirection: 'row',
    gap: 8,
  },
  pill: {
    color: MoneyTheme.ink,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 999,
    backgroundColor: MoneyTheme.surfaceSoft,
    fontSize: 11,
    fontWeight: '600',
  },
  danger: {
    color: MoneyTheme.danger,
    backgroundColor: MoneyTheme.dangerSoft,
  },
  total: {
    fontSize: 28,
    color: MoneyTheme.ink,
    fontFamily: 'serif',
    fontWeight: '600',
    marginBottom: 12,
  },
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 6,
  },
  label: {
    color: MoneyTheme.muted,
    fontSize: 13,
  },
  value: {
    color: MoneyTheme.ink,
    fontWeight: '600',
    fontSize: 13,
  },
  progressWrap: {
    height: 8,
    backgroundColor: MoneyTheme.surfaceSoft,
    borderRadius: 999,
    overflow: 'hidden',
    marginTop: 12,
  },
  progressBar: {
    height: '100%',
    backgroundColor: MoneyTheme.paid,
    borderRadius: 999,
  },
  completion: {
    textAlign: 'right',
    marginTop: 8,
    color: MoneyTheme.muted,
    fontWeight: '600',
    fontSize: 12,
  },
  completedStampPosition: {
    position: 'absolute',
    top: '42%',
    left: 0,
    right: 0,
    alignItems: 'center',
    zIndex: 1,
    opacity: 0.9,
  },
  completedStamp: {
    // borderWidth: 3,
    borderColor: MoneyTheme.paid,
    borderRadius: 6,
    backgroundColor: MoneyTheme.paidSoft,
    paddingHorizontal: 14,
    paddingVertical: 10,
    transform: [{ rotate: '-14deg' }],
  },
  completedStampText: {
    color: MoneyTheme.paid,
    fontSize: 18,
    fontWeight: '900',
    letterSpacing: 1,
  },
});
