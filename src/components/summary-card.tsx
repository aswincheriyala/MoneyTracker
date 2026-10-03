import { Pressable, StyleSheet, Text } from 'react-native';

interface SummaryCardProps {
  label: string;
  value: string;
  subtitle?: string;
  accent?: string;
  onPress?: () => void;
}

export function SummaryCard({ label, value, subtitle, accent = '#3b82f6', onPress }: SummaryCardProps) {
  return (
    <Pressable style={[styles.card, { borderColor: accent }]} onPress={onPress}>
      <Text style={styles.label}>{label}</Text>
      <Text style={styles.value}>{value}</Text>
      {subtitle ? <Text style={styles.subtitle}>{subtitle}</Text> : null}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  card: {
    flex: 1,
    borderRadius: 18,
    borderWidth: 1,
    padding: 14,
    backgroundColor: '#f8fafc',
    minHeight: 110,
    justifyContent: 'center',
  },
  label: {
    fontSize: 12,
    fontWeight: '600',
    color: '#475569',
    marginBottom: 8,
  },
  value: {
    fontSize: 20,
    fontWeight: '700',
    color: '#0f172a',
  },
  subtitle: {
    marginTop: 6,
    fontSize: 11,
    color: '#64748b',
  },
});
