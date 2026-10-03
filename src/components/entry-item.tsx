import { MoneyTheme } from '@/constants/money-theme';
import { formatCurrency, getStatusColor } from '@/lib/finance';
import { MoneyEntry } from '@/types/finance';
import { Pressable, StyleSheet, Text, View } from 'react-native';

interface EntryItemProps {
  entry: MoneyEntry;
  onEdit: () => void;
  onDelete: () => void;
  onClone: () => void;
  onPay?: () => void;
  onMarkPaid?: () => void;
  onMarkPending?: () => void;
}

export function EntryItem({ entry, onEdit, onDelete, onClone, onPay, onMarkPaid, onMarkPending }: EntryItemProps) {
  const isPaid = entry.status === 'PAID';

  return (
    <View style={styles.card}>
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
        <View style={[styles.statusBadge, { backgroundColor: `${getStatusColor(entry.status)}22` }]}> 
          <Text style={[styles.statusText, { color: getStatusColor(entry.status) }]}>{entry.status}</Text>
        </View>
      </View>

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
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: MoneyTheme.surface,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: MoneyTheme.line,
    padding: 12,
    marginBottom: 8,
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
    color: MoneyTheme.ink,
  },
  amount: {
    fontSize: 18,
    fontWeight: '800',
    color: MoneyTheme.ink,
  },
  paidText: {
    color: MoneyTheme.quiet,
    textDecorationLine: 'line-through',
  },
  meta: {
    flex: 1,
    minWidth: 0,
    color: MoneyTheme.muted,
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
    color: MoneyTheme.ink,
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
    backgroundColor: MoneyTheme.pine,
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
    borderColor: MoneyTheme.paid,
    borderWidth: 1,
    backgroundColor: MoneyTheme.paidSoft,
    paddingHorizontal: 9,
    paddingVertical: 6,
    borderRadius: 5,
  },
  markPaidText: {
    color: MoneyTheme.paid,
    fontWeight: '700',
    fontSize: 10,
  },
  markPendingButton: {
    borderColor: MoneyTheme.line,
    borderWidth: 1,
    backgroundColor: MoneyTheme.surfaceSoft,
    paddingHorizontal: 9,
    paddingVertical: 6,
    borderRadius: 5,
  },
  markPendingText: {
    color: MoneyTheme.muted,
    fontWeight: '700',
    fontSize: 11,
  },
});
