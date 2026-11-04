import { useEffect, useState } from 'react';
import { Alert, ScrollView, Text } from 'react-native';
import { Stack } from 'expo-router';
import { useAuth } from '../AuthContext';
import { useRequireAuth } from '../useRequireAuth';
import { theme } from '../theme';
import { Button, Card, InfoRow, Input, Loader, SectionTitle, errMsg } from '../ui';
import PasswordField from '../components/PasswordField';

export default function Profile() {
  const { user, loading } = useRequireAuth();
  const { updateProfile, changePassword, logout } = useAuth();
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [busy, setBusy] = useState(false);
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [passwordBusy, setPasswordBusy] = useState(false);
  const [passwordVisibility, setPasswordVisibility] = useState({ current: false, next: false, confirm: false });

  useEffect(() => {
    if (!user) return;
    setName(user.name);
    setPhone(user.phone ?? '');
  }, [user]);

  const save = async () => {
    if (!name.trim()) return Alert.alert('Name required', 'Please enter your name.');
    setBusy(true);
    try {
      await updateProfile(name.trim(), phone.trim());
      Alert.alert('Saved', 'Your profile has been updated.');
    } catch (e) {
      Alert.alert('Could not save profile', errMsg(e));
    } finally {
      setBusy(false);
    }
  };

  const savePassword = async () => {
    if (!currentPassword || !newPassword || !confirmPassword)
      return Alert.alert('Missing information', 'Enter your current password and the new password twice.');
    if (newPassword.length < 6)
      return Alert.alert('Password too short', 'The new password must be at least 6 characters.');
    if (newPassword !== confirmPassword)
      return Alert.alert('Passwords do not match', 'Check the new password and confirmation.');
    if (newPassword === currentPassword)
      return Alert.alert('Choose a new password', 'The new password must differ from the current password.');

    setPasswordBusy(true);
    try {
      await changePassword(currentPassword, newPassword);
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
      Alert.alert('Password changed', 'Your password has been updated.');
    } catch (e) {
      Alert.alert('Could not change password', errMsg(e));
    } finally {
      setPasswordBusy(false);
    }
  };

  const togglePassword = (field: keyof typeof passwordVisibility) =>
    setPasswordVisibility((visible) => ({ ...visible, [field]: !visible[field] }));

  const confirmLogout = () => Alert.alert('Log out?', undefined, [
    { text: 'Cancel' },
    { text: 'Log out', onPress: logout },
  ]);

  if (loading || !user) return <Loader />;

  return (
    <ScrollView contentContainerStyle={{ padding: 16, gap: 16 }} keyboardShouldPersistTaps="handled">
      <Stack.Screen options={{ title: 'My profile' }} />
      <Card style={{ padding: 16, gap: 14 }}>
        <SectionTitle>Personal information</SectionTitle>
        <InfoRow icon="mail-outline">{user.email}</InfoRow>
        <Input icon="person-outline" placeholder="Full name" autoCapitalize="words"
          value={name} onChangeText={setName} />
        <Input icon="call-outline" placeholder="Phone (optional)" keyboardType="phone-pad"
          maxLength={30} value={phone} onChangeText={setPhone} />
        <Text style={{ color: theme.muted, fontSize: 13 }}>Your phone number is optional.</Text>
      </Card>
      <Button title="Save changes" loading={busy} onPress={save} />

      <Card style={{ padding: 16, gap: 14 }}>
        <SectionTitle>Change password</SectionTitle>
        <PasswordField icon="lock-closed-outline" placeholder="Current password" value={currentPassword}
          visible={passwordVisibility.current} onChangeText={setCurrentPassword}
          onToggleVisibility={() => togglePassword('current')} />
        <PasswordField icon="lock-closed-outline" placeholder="New password" value={newPassword}
          visible={passwordVisibility.next} onChangeText={setNewPassword}
          onToggleVisibility={() => togglePassword('next')} />
        <PasswordField icon="lock-closed-outline" placeholder="Confirm new password" value={confirmPassword}
          visible={passwordVisibility.confirm} onChangeText={setConfirmPassword}
          onToggleVisibility={() => togglePassword('confirm')} />
        <Text style={{ color: theme.muted, fontSize: 13 }}>Use at least 6 characters.</Text>
      </Card>
      <Button title="Update password" loading={passwordBusy} onPress={savePassword} />
      <Button title="Log out" variant="danger" icon="log-out-outline" onPress={confirmLogout} />
    </ScrollView>
  );
}
