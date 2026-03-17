import { StatusBar } from 'expo-status-bar';
import { useEffect, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import type { Session } from '@supabase/supabase-js';

import { apiFetch } from './src/lib/api';
import { apiBaseUrl, supabase } from './src/lib/supabase';

export default function App() {
  const [session, setSession] = useState<Session | null>(null);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [mode, setMode] = useState<'login' | 'register'>('login');
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [profile, setProfile] = useState<{ user_id?: number; email?: string } | null>(null);

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => setSession(data.session));
    const { data: listener } = supabase.auth.onAuthStateChange((_event, nextSession) => {
      setSession(nextSession);
      if (!nextSession) {
        setProfile(null);
      }
    });
    return () => {
      listener.subscription.unsubscribe();
    };
  }, []);

  const disabled = busy || !email || !password;

  const authHint = useMemo(() => {
    if (mode === 'register') {
      return 'После регистрации может прийти письмо для подтверждения.';
    }
    return 'Используй тот же email/пароль, что и в Supabase.';
  }, [mode]);

  const handleAuth = async () => {
    setBusy(true);
    setMessage(null);
    try {
      if (mode === 'login') {
        const { error } = await supabase.auth.signInWithPassword({ email, password });
        if (error) throw error;
      } else {
        const { error } = await supabase.auth.signUp({ email, password });
        if (error) throw error;
        setMessage('Регистрация успешна. Проверь почту, если включено подтверждение.');
      }
    } catch (error) {
      const text = error instanceof Error ? error.message : 'Ошибка авторизации';
      setMessage(text);
    } finally {
      setBusy(false);
    }
  };

  const handleLogout = async () => {
    setBusy(true);
    setMessage(null);
    await supabase.auth.signOut();
    setBusy(false);
  };

  const handleCheckApi = async () => {
    setBusy(true);
    setMessage(null);
    const result = await apiFetch<{ user_id: number; email: string }>('/api/auth/me');
    if (!result.ok) {
      setMessage(result.error ?? 'API error');
      setBusy(false);
      return;
    }
    setProfile(result.data ?? null);
    setBusy(false);
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar style="light" />
      <ScrollView contentContainerStyle={styles.container}>
        <Text style={styles.title}>StreamInfo Mobile</Text>
        <Text style={styles.subtitle}>Supabase Auth + наш API</Text>

        {!session ? (
          <View style={styles.card}>
            <View style={styles.segment}>
              <TouchableOpacity
                onPress={() => setMode('login')}
                style={[styles.segmentButton, mode === 'login' && styles.segmentButtonActive]}
              >
                <Text style={styles.segmentText}>Вход</Text>
              </TouchableOpacity>
              <TouchableOpacity
                onPress={() => setMode('register')}
                style={[styles.segmentButton, mode === 'register' && styles.segmentButtonActive]}
              >
                <Text style={styles.segmentText}>Регистрация</Text>
              </TouchableOpacity>
            </View>

            <TextInput
              style={styles.input}
              placeholder="Email"
              placeholderTextColor="#94A3B8"
              autoCapitalize="none"
              keyboardType="email-address"
              value={email}
              onChangeText={setEmail}
            />
            <TextInput
              style={styles.input}
              placeholder="Пароль"
              placeholderTextColor="#94A3B8"
              secureTextEntry
              value={password}
              onChangeText={setPassword}
            />
            <Text style={styles.hint}>{authHint}</Text>

            <TouchableOpacity
              style={[styles.primaryButton, disabled && styles.buttonDisabled]}
              disabled={disabled}
              onPress={handleAuth}
            >
              {busy ? <ActivityIndicator color="#0F172A" /> : <Text style={styles.primaryText}>Продолжить</Text>}
            </TouchableOpacity>
          </View>
        ) : (
          <View style={styles.card}>
            <Text style={styles.sectionTitle}>Сессия активна</Text>
            <Text style={styles.value}>Email: {session.user.email}</Text>
            <Text style={styles.value}>User ID (supabase): {session.user.id}</Text>

            <TouchableOpacity style={styles.secondaryButton} onPress={handleCheckApi} disabled={busy}>
              {busy ? <ActivityIndicator color="#E2E8F0" /> : <Text style={styles.secondaryText}>Проверить API</Text>}
            </TouchableOpacity>

            {profile ? (
              <View style={styles.profileBox}>
                <Text style={styles.profileText}>API user_id: {profile.user_id}</Text>
                <Text style={styles.profileText}>API email: {profile.email}</Text>
              </View>
            ) : null}

            <TouchableOpacity style={styles.logoutButton} onPress={handleLogout} disabled={busy}>
              <Text style={styles.logoutText}>Выйти</Text>
            </TouchableOpacity>
          </View>
        )}

        {message ? <Text style={styles.message}>{message}</Text> : null}

        <Text style={styles.footer}>API: {apiBaseUrl || 'не задан'}</Text>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#0B1220',
  },
  container: {
    flexGrow: 1,
    padding: 24,
    alignItems: 'stretch',
  },
  title: {
    fontSize: 28,
    fontWeight: '700',
    color: '#E2E8F0',
    marginBottom: 6,
  },
  subtitle: {
    fontSize: 14,
    color: '#94A3B8',
    marginBottom: 24,
  },
  card: {
    backgroundColor: '#111827',
    borderRadius: 16,
    padding: 20,
    gap: 12,
    borderWidth: 1,
    borderColor: '#1F2937',
  },
  segment: {
    flexDirection: 'row',
    backgroundColor: '#0B1220',
    padding: 4,
    borderRadius: 999,
    marginBottom: 8,
  },
  segmentButton: {
    flex: 1,
    paddingVertical: 8,
    alignItems: 'center',
    borderRadius: 999,
  },
  segmentButtonActive: {
    backgroundColor: '#22C55E',
  },
  segmentText: {
    color: '#E2E8F0',
    fontSize: 14,
    fontWeight: '600',
  },
  input: {
    backgroundColor: '#0B1220',
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 12,
    color: '#E2E8F0',
    borderWidth: 1,
    borderColor: '#1F2937',
  },
  hint: {
    fontSize: 12,
    color: '#94A3B8',
  },
  primaryButton: {
    backgroundColor: '#22C55E',
    borderRadius: 12,
    paddingVertical: 12,
    alignItems: 'center',
    marginTop: 4,
  },
  buttonDisabled: {
    opacity: 0.6,
  },
  primaryText: {
    color: '#0B1220',
    fontWeight: '700',
    fontSize: 16,
  },
  sectionTitle: {
    color: '#E2E8F0',
    fontSize: 16,
    fontWeight: '600',
  },
  value: {
    color: '#94A3B8',
    fontSize: 13,
  },
  secondaryButton: {
    backgroundColor: '#1E293B',
    borderRadius: 12,
    paddingVertical: 10,
    alignItems: 'center',
  },
  secondaryText: {
    color: '#E2E8F0',
    fontWeight: '600',
  },
  profileBox: {
    backgroundColor: '#0B1220',
    borderRadius: 12,
    padding: 12,
  },
  profileText: {
    color: '#E2E8F0',
    fontSize: 13,
  },
  logoutButton: {
    alignItems: 'center',
    paddingVertical: 10,
  },
  logoutText: {
    color: '#F87171',
    fontWeight: '600',
  },
  message: {
    marginTop: 16,
    color: '#FBBF24',
    fontSize: 13,
  },
  footer: {
    marginTop: 24,
    color: '#64748B',
    fontSize: 12,
  },
});
