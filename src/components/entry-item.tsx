import { MoneyThemeColors, useMoneyTheme } from '@/constants/money-theme';
import { formatCurrency, getStatusColor } from '@/lib/finance';
import { MoneyEntry } from '@/types/finance';
import { useMemo } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';

interface EntryItemProps {
  entry: MoneyEntry;
  onEdit: () => void;
  onDelete: () => void;
  onClone: () => void;
  onPay?: () => void;
  onMarkPaid?: () => void;
  onMarkPending?: () => void;
  onPress?: () => void;
  onLongPress?: () => void;
  selected?: boolean;
  selectionMode?: boolean;
}

export function EntryItem({ entry, onEdit, onDelete, onClone, onPay, onMarkPaid, onMarkPending, onPress, onLongPress, selected = false, selectionMode = false }: EntryItemProps) {
  const theme = useMoneyTheme();
  const styles = useMemo(() => makeStyles(theme), [theme]);
  const isPaid = entry.status === 'PAID';
  const statusColor = getStatusColor(entry.status, theme);

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityState={{ selected }}
      onPress={onPress}
      onLongPress={onLongPress}
      style={[styles.card, selected && styles.selectedCard]}>
      <View style={styles.headerRow}>
        <View style={styles.textWrap}>
          <Text style={[styles.title, isPaid && styles.paidText]}>{entry.title}</Text>
        </View>
        <Text style={[styles.amount, isPaid && styles.paidText]}>{formatCurrency(entry.amountPaise)}</Text>
      </View>

      <View style={styles.metaRow}>
        <Text style={styles.meta} numberOfLines={1}>
          {entry.recipientUpiId ? `UPI: ${entry.recipientUpiId}` : 'No recipient'}
        </Text>
        <View style={styles.metaBadges}>
          <View style={[styles.statusBadge, { backgroundColor: `${statusColor}22` }]}>
            <Text style={[styles.statusText, { color: statusColor }]}>{entry.status}</Text>
          </View>
          {selectionMode ? (
            <View style={[styles.selectionIndicator, selected && styles.selectionIndicatorSelected]}>
              {selected ? <Text style={styles.selectionCheck}>✓</Text> : null}
            </View>
          ) : null}
        </View>
      </View>

      {!selectionMode && (
        <View style={styles.actionRow}>
        <Text style={styles.link} onPress={onEdit}>Edit</Text>
        <Text style={styles.link} onPress={onClone}>Clone</Text>
        <Text style={styles.link} onPress={onDelete}>Delete</Text>
        {entry.status === 'PENDING' && (onPay || onMarkPaid) ? (
          <View style={styles.paymentActions}>
            {onPay ? (
              <Pressable style={styles.payButton} onPress={onPay}>
                <Text style={styles.payText}>PAY</Text>
              </Pressable>
            ) : null}
            {onMarkPaid ? (
              <Pressable style={styles.markPaidButton} onPress={onMarkPaid}>
                <Text style={styles.markPaidText}>MARK PAID</Text>
              </Pressable>
            ) : null}
          </View>
        ) : null}
        {entry.status === 'PAID' && onMarkPending ? (
          <View style={styles.paymentActions}>
            <Pressable style={styles.markPendingButton} onPress={onMarkPending}>
              <Text style={styles.markPendingText}>MARK PENDING</Text>
            </Pressable>
          </View>
        ) : null}
        </View>
      )}
    </Pressable>
  );
}

const makeStyles = (theme: MoneyThemeColors) => StyleSheet.create({
  card: {
    backgroundColor: theme.surface,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: theme.line,
    padding: 12,
    marginBottom: 8,
  },
  selectedCard: {
    borderColor: theme.pine,
    backgroundColor: theme.surfaceSoft,
  },
  metaBadges: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  selectionIndicator: {
    width: 22,
    height: 22,
    borderRadius: 11,
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
    fontSize: 13,
    fontWeight: '700',
  },
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  textWrap: { flex: 1 },
  title: {
    fontSize: 16,
    fontWeight: '700',
    color: theme.ink,
  },
  amount: {
    fontSize: 18,
    fontWeight: '800',
    color: theme.ink,
  },
  paidText: {
    color: theme.quiet,
    textDecorationLine: 'line-through',
  },
  meta: {
    flex: 1,
    minWidth: 0,
    color: theme.muted,
    fontSize: 11,
  },
  metaRow: {
    marginTop: 5,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 8,
  },
  statusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 4,
  },
  statusText: {
    fontSize: 10,
    fontWeight: '700',
    textTransform: 'uppercase',
  },
  actionRow: {
    marginTop: 9,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    flexWrap: 'wrap',
  },
  link: {
    color: theme.ink,
    fontWeight: '600',
    fontSize: 11,
  },
  paymentActions: {
    marginLeft: 'auto',
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  payButton: {
    backgroundColor: theme.pine,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 5,
  },
  payText: {
    color: '#fff',
    fontWeight: '700',
    fontSize: 11,
  },
  markPaidButton: {
    borderColor: theme.paid,
    borderWidth: 1,
    backgroundColor: theme.paidSoft,
    paddingHorizontal: 9,
    paddingVertical: 6,
    borderRadius: 5,
  },
  markPaidText: {
    color: theme.paid,
    fontWeight: '700',
    fontSize: 10,
  },
  markPendingButton: {
    borderColor: theme.line,
    borderWidth: 1,
    backgroundColor: theme.surfaceSoft,
    paddingHorizontal: 9,
    paddingVertical: 6,
    borderRadius: 5,
  },
  markPendingText: {
    color: theme.muted,
    fontWeight: '700',
    fontSize: 11,
  },
});
