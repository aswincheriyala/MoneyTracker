import { useColorScheme } from '@/hooks/use-color-scheme';
import { useThemePreference } from '@/lib/theme-preference';

export type MoneyThemeColors = {
  canvas: string;
  surface: string;
  surfaceSoft: string;
  ink: string;
  muted: string;
  quiet: string;
  line: string;
  pine: string;
  pinePressed: string;
  clay: string;
  sand: string;
  paid: string;
  paidSoft: string;
  pending: string;
  pendingSoft: string;
  danger: string;
  dangerSoft: string;
  overlay: string;
};

const LightMoneyTheme: MoneyThemeColors = {
  canvas: '#edf1e9',
  surface: '#fbfcf8',
  surfaceSoft: '#e5ebe2',
  ink: '#183d32',
  muted: '#69776d',
  quiet: '#89958b',
  line: '#d4dbd0',
  pine: '#183d32',
  pinePressed: '#245444',
  clay: '#bd795b',
  sand: '#d9c99d',
  paid: '#52745d',
  paidSoft: '#e5eee5',
  pending: '#a46a43',
  pendingSoft: '#f3e8dc',
  danger: '#a65345',
  dangerSoft: '#f5e5df',
  overlay: 'rgba(24, 61, 50, 0.46)',
};

const DarkMoneyTheme: MoneyThemeColors = {
  canvas: '#101a15',
  surface: '#1a251f',
  surfaceSoft: '#243028',
  ink: '#e8f0ea',
  muted: '#93a49a',
  quiet: '#6d7f74',
  line: '#2b3830',
  pine: '#3f7a63',
  pinePressed: '#356a56',
  clay: '#d2926f',
  sand: '#a8935f',
  paid: '#7ba487',
  paidSoft: '#223128',
  pending: '#cf9267',
  pendingSoft: '#342a21',
  danger: '#d0806f',
  dangerSoft: '#342420',
  overlay: 'rgba(0, 0, 0, 0.6)',
};

/** @deprecated Use useMoneyTheme() inside components for dark-mode support. Static light palette kept for module-level usage. */
export const MoneyTheme = LightMoneyTheme;

export function getMoneyTheme(scheme: 'light' | 'dark' | null | undefined): MoneyThemeColors {
  return scheme === 'dark' ? DarkMoneyTheme : LightMoneyTheme;
}

export function useMoneyTheme(): MoneyThemeColors {
  const systemScheme = useColorScheme();
  const [preference] = useThemePreference();
  const resolved = preference === 'system' ? systemScheme : preference;
  return resolved === 'dark' ? DarkMoneyTheme : LightMoneyTheme;
}