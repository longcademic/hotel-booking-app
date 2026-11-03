import { useState } from 'react';
import { View, Text, ScrollView, KeyboardAvoidingView, Platform, TouchableOpacity } from 'react-native';
import { Stack, useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../AuthContext';
import { theme } from '../theme';
import { Button, Input, errMsg } from '../ui';

export default function Login() {
  const { login, register } = useAuth();
  const router = useRouter();
  const [isRegister, setIsRegister] = useState(false);
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');

  const submit = async () => {
    setError('');
    if (!email.trim() || !password || (isRegister && !name.trim())) return setError('Please fill in all fields.');
    if (isRegister && password.length < 6) return setError('Password must be at least 6 characters.');
    setBusy(true);
    try {
      if (isRegister) await register(name.trim(), email.trim(), password);
      else await login(email.trim(), password);
      router.canGoBack() ? router.back() : router.replace('/');
    } catch (e) { setError(errMsg(e)); }
    finally { setBusy(false); }
  };

  return (
    <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <Stack.Screen options={{ title: '', headerStyle: { backgroundColor: theme.bg } }} />
      <ScrollView contentContainerStyle={{ flexGrow: 1, justifyContent: 'center', padding: 24, gap: 14 }} keyboardShouldPersistTaps="handled">
        <View style={{ alignItems: 'center', gap: 8, marginBottom: 8 }}>
          <View style={{ width: 72, height: 72, borderRadius: 36, backgroundColor: theme.primary, alignItems: 'center', justifyContent: 'center' }}>
            <Ionicons name="bed" size={34} color="#fff" />
          </View>
          <Text style={{ fontSize: 26, fontWeight: '800', color: theme.text }}>{isRegister ? 'Create your account' : 'Welcome back'}</Text>
          <Text style={{ color: theme.muted, textAlign: 'center' }}>
            {isRegister ? 'Book stays, manage trips and leave reviews.' : 'Sign in to book and manage your stays.'}
          </Text>
        </View>

        {isRegister && <Input icon="person-outline" placeholder="Full name" value={name} onChangeText={setName} />}
        <Input icon="mail-outline" placeholder="Email" autoCapitalize="none" keyboardType="email-address" value={email} onChangeText={setEmail} />
        <View style={{ position: 'relative' }}>
          <Input icon="lock-closed-outline" placeholder="Password" secureTextEntry={!showPassword}
            value={password} onChangeText={setPassword} box={{ paddingRight: 48 }} />
          <TouchableOpacity onPress={() => setShowPassword((visible) => !visible)} hitSlop={8}
            accessibilityRole="button" accessibilityLabel={showPassword ? 'Hide password' : 'Show password'}
            style={{ position: 'absolute', top: 0, right: 12, bottom: 0, width: 32, alignItems: 'center', justifyContent: 'center' }}>
            <Ionicons name={showPassword ? 'eye-off-outline' : 'eye-outline'} size={20} color={theme.muted} />
          </TouchableOpacity>
        </View>
        {error ? <Text style={{ color: theme.danger }}>{error}</Text> : null}

        <Button title={isRegister ? 'Create account' : 'Sign in'} loading={busy} onPress={submit} />
        <TouchableOpacity onPress={() => { setIsRegister(!isRegister); setError(''); setShowPassword(false); }} style={{ alignItems: 'center', padding: 8 }}>
          <Text style={{ color: theme.muted }}>
            {isRegister ? 'Already have an account? ' : 'New here? '}
            <Text style={{ color: theme.primary, fontWeight: '700' }}>{isRegister ? 'Sign in' : 'Create an account'}</Text>
          </Text>
        </TouchableOpacity>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}
