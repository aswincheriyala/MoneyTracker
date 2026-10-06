import AsyncStorage from '@react-native-async-storage/async-storage';
import { useCallback, useEffect, useState } from 'react';

export type ThemePreference = 'system' | 'light' | 'dark';

const THEME_PREFERENCE_KEY = 'moneytracker:theme-preference:v1';

let currentPreference: ThemePreference = 'system';
const listeners = new Set<(preference: ThemePreference) => void>();

function emit(preference: ThemePreference) {
  currentPreference = preference;
  listeners.forEach((listener) => listener(preference));
}

export async function loadThemePreference(): Promise<ThemePreference> {
  try {
    const stored = await AsyncStorage.getItem(THEME_PREFERENCE_KEY);
    if (stored === 'light' || stored === 'dark' || stored === 'system') {
      currentPreference = stored;
    }
  } catch {
    // keep default
  }
  return currentPreference;
}

export async function saveThemePreference(preference: ThemePreference): Promise<void> {
  try {
    await AsyncStorage.setItem(THEME_PREFERENCE_KEY, preference);
  } catch {
    // persistence failure is non-fatal
  }
  emit(preference);
}

export function getThemePreference(): ThemePreference {
  return currentPreference;
}

export function useThemePreference(): [ThemePreference, (preference: ThemePreference) => void] {
  const [preference, setPreference] = useState<ThemePreference>(currentPreference);

  useEffect(() => {
    listeners.add(setPreference);
    if (currentPreference === 'system') {
      void loadThemePreference().then((loaded) => {
        if (loaded !== currentPreference) emit(loaded);
      });
    }
    return () => {
      listeners.delete(setPreference);
    };
  }, []);

  const update = useCallback((next: ThemePreference) => {
    void saveThemePreference(next);
  }, []);

  return [preference, update];
}
