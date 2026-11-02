import { useEffect, useState } from 'react';
import { ScrollView, Text, Alert } from 'react-native';
import { Stack, useLocalSearchParams, useRouter } from 'expo-router';
import { api } from '../../api';
import { useRequireAuth } from '../../useRequireAuth';
import { theme } from '../../theme';
import { Button, Card, EmptyState, Loader, errMsg } from '../../ui';
import ImageEditor from '../../components/ImageEditor';

export default function AdminPhotos() {
  const { user } = useRequireAuth();
  const { kind, id } = useLocalSearchParams<{ kind: 'hotel' | 'room-type'; id: string }>();
  const router = useRouter();
  const base = kind === 'hotel' ? '/admin/hotels' : '/admin/room-types';
  const [name, setName] = useState('');
  const [urls, setUrls] = useState<string[] | null>(null);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (user?.role === 'admin')
      api.get(`${base}/${id}`).then((r) => { setName(r.data.name); setUrls(r.data.images); }).catch(() => {});
  }, [user, id]);

  const save = async () => {
    setBusy(true);
    try {
      await api.patch(`${base}/${id}`, { images: urls });
      Alert.alert('Saved', 'Photos updated.', [{ text: 'OK', onPress: () => router.back() }]);
    } catch (e) { Alert.alert('Error', errMsg(e)); }
    finally { setBusy(false); }
  };

  if (user && user.role !== 'admin') return <EmptyState icon="lock-closed-outline" title="Admins only" />;
  if (!urls) return <Loader />;

  return (
    <ScrollView contentContainerStyle={{ padding: 16, gap: 16 }}>
      <Stack.Screen options={{ title: 'Edit photos' }} />
      <Card style={{ padding: 16, gap: 12 }}>
        <Text style={{ fontSize: 18, fontWeight: '800', color: theme.text }}>{name}</Text>
        <ImageEditor urls={urls} onChange={setUrls} />
      </Card>
      <Button title="Save photos" loading={busy} onPress={save} />
    </ScrollView>
  );
}