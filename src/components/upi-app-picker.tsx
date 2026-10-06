import { AnimatedModal } from '@/components/animated-modal';
import { MoneyThemeColors, useMoneyTheme } from '@/constants/money-theme';
import { UpiApp } from '@/lib/upi';
import { Image } from 'expo-image';
import { useMemo } from 'react';
import { ActivityIndicator, Pressable, StyleSheet, Text, View } from 'react-native';

type UpiAppPickerProps = {
  visible: boolean;
  apps: UpiApp[];
  loading: boolean;
  onSelect: (app: UpiApp) => void;
  onSelectGeneric: () => void;
  onClose: () => void;
};

export function UpiAppPicker({ visible, apps, loading, onSelect, onSelectGeneric, onClose }: UpiAppPickerProps) {
  const theme = useMoneyTheme();
  const styles = useMemo(() => makeStyles(theme), [theme]);

  return (
    <AnimatedModal visible={visible} onClose={onClose} maxHeight="70%">
      <Text style={styles.title}>Pay with</Text>

      {loading ? (
        <View style={styles.loadingWrap}>
          <ActivityIndicator color={theme.pine} />
        </View>
      ) : (
        <>
          {apps.map((app) => (
            <Pressable
              key={app.id}
              style={({ pressed }) => [styles.appRow, pressed && styles.appRowPressed]}
              onPress={() => onSelect(app)}
              accessibilityRole="button"
            >
              {app.icon ? (
                <Image source={{ uri: app.icon }} style={styles.appIcon} contentFit="contain" />
              ) : (
                <View style={[styles.appIcon, styles.appIconFallback]}>
                  <Text style={styles.appIconFallbackText}>{app.name.slice(0, 1)}</Text>
                </View>
              )}
              <Text style={styles.appName}>{app.name}</Text>
              <Text style={styles.chevron}>›</Text>
            </Pressable>
          ))}

          <Pressable
            style={({ pressed }) => [styles.appRow, pressed && styles.appRowPressed]}
            onPress={onSelectGeneric}
            accessibilityRole="button"
          >
            <View style={[styles.appIcon, styles.appIconFallback]}>
              <Text style={styles.appIconFallbackText}>₹</Text>
            </View>
            <Text style={styles.appName}>Other UPI app</Text>
            <Text style={styles.chevron}>›</Text>
          </Pressable>
        </>
      )}
    </AnimatedModal>
  );
}

const makeStyles = (theme: MoneyThemeColors) => StyleSheet.create({
  title: {
    fontSize: 20,
    fontWeight: '700',
    fontFamily: 'serif',
    color: theme.ink,
  },
  loadingWrap: {
    paddingVertical: 30,
    alignItems: 'center',
  },
  appRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingVertical: 10,
    paddingHorizontal: 10,
    borderRadius: 6,
  },
  appRowPressed: {
    backgroundColor: theme.surfaceSoft,
  },
  appIcon: {
    width: 34,
    height: 34,
    borderRadius: 8,
  },
  appIconFallback: {
    backgroundColor: theme.surfaceSoft,
    borderWidth: 1,
    borderColor: theme.line,
    alignItems: 'center',
    justifyContent: 'center',
  },
  appIconFallbackText: {
    color: theme.ink,
    fontWeight: '800',
    fontSize: 14,
  },
  appName: {
    flex: 1,
    color: theme.ink,
    fontSize: 15,
    fontWeight: '700',
  },
  chevron: {
    color: theme.quiet,
    fontSize: 20,
    lineHeight: 22,
  },
});
