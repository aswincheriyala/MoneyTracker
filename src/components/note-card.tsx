import { MoneyThemeColors, useMoneyTheme } from '@/constants/money-theme';
import { formatCurrency, getNoteSummary } from '@/lib/finance';
import { MoneyEntry, MoneyNote } from '@/types/finance';
import { useMemo } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';

interface NoteCardProps {
  note: MoneyNote;
  entries: MoneyEntry[];
  onPress: () => void;
  onEdit: () => void;
  onClone: () => void;
  onDelete: () => void;
  onLongPress: () => void;
  selected: boolean;
  selectionMode: boolean;
}

export function NoteCard({ note, entries, onPress, onEdit, onClone, onDelete, onLongPress, selected, selectionMode }: NoteCardProps) {
  const theme = useMoneyTheme();
  const styles = useMemo(() => makeStyles(theme), [theme]);
  const summary = getNoteSummary(note, entries);

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityState={{ selected }}
      onPress={onPress}
      onLongPress={onLongPress}
      style={[styles.card, selected && styles.selectedCard]}>
      <View style={styles.headerRow}>
        <View style={styles.titleWrap}>
          <Text style={styles.title}>{note.title}</Text>
          <Text style={styles.meta}>{summary.entryCount} entries</Text>
        </View>
        {selectionMode ? (
          <View style={[styles.selectionIndicator, selected && styles.selectionIndicatorSelected]}>
            {selected && <Text style={styles.selectionCheck}>✓</Text>}
          </View>
        ) : (
          <View style={styles.miniActions}>
            <Text onPress={onEdit} style={styles.pill}>Edit</Text>
            <Text onPress={onClone} style={styles.pill}>Clone</Text>
            <Text onPress={onDelete} style={[styles.pill, styles.danger]}>Delete</Text>
          </View>
        )}
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

const makeStyles = (theme: MoneyThemeColors) => StyleSheet.create({
  card: {
    position: 'relative',
    backgroundColor: theme.surface,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: theme.line,
    borderLeftWidth: 3,
    borderLeftColor: theme.clay,
    padding: 16,
    marginBottom: 14,
  },
  selectedCard: {
    borderColor: theme.pine,
    backgroundColor: theme.surfaceSoft,
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
    color: theme.ink,
    fontFamily: 'serif',
    fontWeight: '600',
  },
  meta: {
    color: theme.muted,
    fontSize: 12,
    marginTop: 4,
  },
  miniActions: {
    flexDirection: 'row',
    gap: 8,
  },
  selectionIndicator: {
    width: 24,
    height: 24,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: theme.muted,
    alignItems: 'center',
    justifyContent: 'center',
  },
  selectionIndicatorSelected: {
    backgroundColor: theme.pine,
    borderColor: theme.pine,
  },
  selectionCheck: {
    color: theme.surface,
    fontSize: 15,
    fontWeight: '700',
  },
  pill: {
    color: theme.ink,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 999,
    backgroundColor: theme.surfaceSoft,
    fontSize: 11,
    fontWeight: '600',
  },
  danger: {
    color: theme.danger,
    backgroundColor: theme.dangerSoft,
  },
  total: {
    fontSize: 28,
    color: theme.ink,
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
    color: theme.muted,
    fontSize: 13,
  },
  value: {
    color: theme.ink,
    fontWeight: '600',
    fontSize: 13,
  },
  progressWrap: {
    height: 8,
    backgroundColor: theme.surfaceSoft,
    borderRadius: 999,
    overflow: 'hidden',
    marginTop: 12,
  },
  progressBar: {
    height: '100%',
    backgroundColor: theme.paid,
    borderRadius: 999,
  },
  completion: {
    textAlign: 'right',
    marginTop: 8,
    color: theme.muted,
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
    borderColor: theme.paid,
    borderRadius: 6,
    backgroundColor: theme.paidSoft,
    paddingHorizontal: 14,
    paddingVertical: 10,
    transform: [{ rotate: '-14deg' }],
  },
  completedStampText: {
    color: theme.paid,
    fontSize: 18,
    fontWeight: '900',
    letterSpacing: 1,
  },
});
