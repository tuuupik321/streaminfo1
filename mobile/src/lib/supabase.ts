import 'react-native-url-polyfill/auto';

import Constants from 'expo-constants';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { createClient } from '@supabase/supabase-js';

type ExpoExtra = {
  EXPO_PUBLIC_SUPABASE_URL?: string;
  EXPO_PUBLIC_SUPABASE_ANON_KEY?: string;
  EXPO_PUBLIC_API_BASE_URL?: string;
};

const extra =
  (Constants.expoConfig?.extra as ExpoExtra | undefined) ??
  ((Constants.manifest as { extra?: ExpoExtra } | undefined)?.extra ?? {});

const supabaseUrl = extra.EXPO_PUBLIC_SUPABASE_URL ?? '';
const supabaseAnonKey = extra.EXPO_PUBLIC_SUPABASE_ANON_KEY ?? '';

if (!supabaseUrl || !supabaseAnonKey) {
  console.warn('Supabase config missing. Check EXPO_PUBLIC_SUPABASE_URL/EXPO_PUBLIC_SUPABASE_ANON_KEY.');
}

export const apiBaseUrl = (extra.EXPO_PUBLIC_API_BASE_URL ?? '').replace(/\/$/, '');

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    storage: AsyncStorage,
    persistSession: true,
    autoRefreshToken: true,
    detectSessionInUrl: false,
  },
});
