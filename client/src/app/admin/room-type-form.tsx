import { useEffect, useState } from 'react';
import { ScrollView, View, Alert } from 'react-native';
import { Stack, useLocalSearchParams, useRouter } from 'expo-router';
import { api } from '../../api';
import { useRequireAuth } from '../../useRequireAuth';
import { Button, Card, EmptyState, Loader, SectionTitle, errMsg } from '../../ui';
import { Field, Toggle } from '../../components/Field';
import AmenityPicker from '../../components/AmenityPicker';

export default function RoomTypeForm() {
  const { user } = useRequireAuth();
  const { hotel, id } = useLocalSearchParams<{ hotel: string; id?: string }>();
  const router = useRouter();
  const [ready, setReady] = useState(!id);
  const [busy, setBusy] = useState(false);
  const [f, setF] = useState({
    name: '', description: '', capacity: '2', beds: '1', bedType: 'Double', sizeM2: '', pricePerNight: '',
    isActive: true, amenities: [] as string[], quantity: '5', startNumber: '',
  });
  const [add, setAdd] = useState({ quantity: '1', startNumber: '' });
  const set = (k: keyof typeof f) => (v: any) => setF((p) => ({ ...p, [k]: v }));

  useEffect(() => {
    if (!id || user?.role !== 'admin') return;
    api.get(`/admin/room-types/${id}`).then((r) => {
      const t = r.data;
      setF((p) => ({ ...p, name: t.name, description: t.description ?? '', capacity: String(t.capacity), beds: String(t.beds),
        bedType: t.bedType, sizeM2: t.sizeM2 ? String(t.sizeM2) : '', pricePerNight: String(t.pricePerNight),
        isActive: t.isActive !== false, amenities: t.amenities.map((a: any) => a._id) }));
      setReady(true);
    }).catch((e) => Alert.alert('Error', errMsg(e)));
  }, [id, user]);

  const save = async () => {
    if (!f.name.trim() || !f.pricePerNight || !f.capacity) return Alert.alert('Missing info', 'Name, capacity and price are required.');
    const body: any = {
      name: f.name, description: f.description, capacity: Number(f.capacity), beds: Number(f.beds) || 1, bedType: f.bedType,
      sizeM2: f.sizeM2 ? Number(f.sizeM2) : undefined, pricePerNight: Number(f.pricePerNight),
      isActive: f.isActive, amenities: f.amenities,
    };
    setBusy(true);
    try {
      if (id) { await api.patch(`/admin/room-types/${id}`, body); Alert.alert('Saved'); }
      else {
        const { data } = await api.post('/admin/room-types', {
          ...body, hotel, quantity: Number(f.quantity) || 0, startNumber: f.startNumber ? Number(f.startNumber) : undefined,
        });
        Alert.alert('Created', `${data.rooms.length} room(s): ${data.rooms.map((r: any) => r.roomNumber).join(', ')}`);
        router.replace({ pathname: '/admin/room-type-form', params: { hotel, id: data.roomType._id } });
      }
    } catch (e) { Alert.alert('Error', errMsg(e)); }
    finally { setBusy(false); }
  };

  const addRooms = async () => {
    try {
      const { data } = await api.post(`/admin/room-types/${id}/rooms`, {
        quantity: Number(add.quantity) || 1, startNumber: add.startNumber ? Number(add.startNumber) : undefined,
      });
      Alert.alert('Added', `Rooms: ${data.map((r: any) => r.roomNumber).join(', ')}`);
    } catch (e) { Alert.alert('Error', errMsg(e)); }
  };

  const remove = () => Alert.alert('Delete room type?', 'Its rooms and photos are removed too. Types with bookings cannot be deleted, so hide them instead.',
    [{ text: 'Cancel' }, { text: 'Delete', style: 'destructive', onPress: async () => {
      try { await api.delete(`/admin/room-types/${id}`); router.back(); }
      catch (e) { Alert.alert('Cannot delete', errMsg(e)); }
    } }]);

  if (user && user.role !== 'admin') return <EmptyState icon="lock-closed-outline" title="Admins only" />;
  if (!ready) return <Loader />;

  return (
    <ScrollView contentContainerStyle={{ padding: 16, gap: 16, paddingBottom: 32 }} keyboardShouldPersistTaps="handled">
      <Stack.Screen options={{ title: id ? 'Edit room type' : 'New room type' }} />

      <Card style={{ padding: 16, gap: 12 }}>
        <SectionTitle>Details</SectionTitle>
        <Field label="Name" value={f.name} onChangeText={set('name')} />
        <Field label="Description" value={f.description} onChangeText={set('description')} multiline />
        <View style={{ flexDirection: 'row', gap: 10 }}>
          <View style={{ flex: 1 }}><Field label="Max guests" value={f.capacity} onChangeText={set('capacity')} keyboardType="numeric" /></View>
          <View style={{ flex: 1 }}><Field label="Beds" value={f.beds} onChangeText={set('beds')} keyboardType="numeric" /></View>
        </View>
        <View style={{ flexDirection: 'row', gap: 10 }}>
          <View style={{ flex: 1 }}><Field label="Bed type" value={f.bedType} onChangeText={set('bedType')} /></View>
          <View style={{ flex: 1 }}><Field label="Size (m²)" value={f.sizeM2} onChangeText={set('sizeM2')} keyboardType="numeric" /></View>
        </View>
        <Field label="Price per night" value={f.pricePerNight} onChangeText={set('pricePerNight')} keyboardType="numeric" />
        <Toggle label="Visible to guests" value={f.isActive} onChange={set('isActive')} />
      </Card>

      <Card style={{ padding: 16 }}>
        <AmenityPicker scope="room" value={f.amenities} onChange={set('amenities')} />
      </Card>

      {!id && (
        <Card style={{ padding: 16, gap: 12 }}>
          <SectionTitle>Rooms</SectionTitle>
          <View style={{ flexDirection: 'row', gap: 10 }}>
            <View style={{ flex: 1 }}><Field label="Number of rooms" value={f.quantity} onChangeText={set('quantity')} keyboardType="numeric" /></View>
            <View style={{ flex: 1 }}><Field label="First room number" value={f.startNumber} onChangeText={set('startNumber')} keyboardType="numeric" /></View>
          </View>
        </Card>
      )}

      <Button title="Save" loading={busy} onPress={save} />

      {id && (
        <>
          <Card style={{ padding: 16, gap: 12 }}>
            <SectionTitle>Add more rooms</SectionTitle>
            <View style={{ flexDirection: 'row', gap: 10 }}>
              <View style={{ flex: 1 }}><Field label="How many" value={add.quantity} onChangeText={(v) => setAdd({ ...add, quantity: v })} keyboardType="numeric" /></View>
              <View style={{ flex: 1 }}><Field label="First number" value={add.startNumber} onChangeText={(v) => setAdd({ ...add, startNumber: v })} keyboardType="numeric" /></View>
            </View>
            <Button title="Add rooms" icon="add" variant="secondary" onPress={addRooms} />
          </Card>
          <Button title="Photos" icon="images-outline" variant="secondary" onPress={() => router.push({ pathname: '/admin/photos', params: { kind: 'room-type', id } })} />
          <Button title="Delete room type" variant="danger" onPress={remove} />
        </>
      )}
    </ScrollView>
  );
}