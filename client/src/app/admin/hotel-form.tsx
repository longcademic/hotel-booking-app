import { useEffect, useState } from 'react';
import { ScrollView, View, Alert } from 'react-native';
import { Stack, useLocalSearchParams, useRouter } from 'expo-router';
import { api } from '../../api';
import { useRequireAuth } from '../../useRequireAuth';
import { Button, Card, EmptyState, Loader, SectionTitle, errMsg } from '../../ui';
import { Field, Toggle } from '../../components/Field';
import AmenityPicker from '../../components/AmenityPicker';
import CityPicker from '../../components/CityPicker';

export default function HotelForm() {
  const { user } = useRequireAuth();
  const { id } = useLocalSearchParams<{ id?: string }>();
  const router = useRouter();
  const [ready, setReady] = useState(!id);
  const [busy, setBusy] = useState(false);
  const [f, setF] = useState({
    name: '', city: '', address: '', phone: '', description: '',
    openingHours: 'Reception open 24/7', checkInTime: '14:00', checkOutTime: '12:00',
    allowRefund: true, refundPercent: '50', isActive: true, amenities: [] as string[],
  });
  const set = (k: keyof typeof f) => (v: any) => setF((p) => ({ ...p, [k]: v }));

  useEffect(() => {
    if (!id || user?.role !== 'admin') return;
    api.get(`/admin/hotels/${id}`).then((r) => {
      const h = r.data;
      setF({ name: h.name, city: h.city, address: h.address, phone: h.phone ?? '', description: h.description ?? '',
        openingHours: h.openingHours, checkInTime: h.checkInTime, checkOutTime: h.checkOutTime,
        allowRefund: h.allowRefund !== false, refundPercent: String(h.refundPercent ?? 50),
        isActive: h.isActive !== false, amenities: h.amenities.map((a: any) => a._id) });
      setReady(true);
    }).catch((e) => Alert.alert('Error', errMsg(e)));
  }, [id, user]);

  const save = async () => {
    if (!f.name.trim() || !f.city.trim() || !f.address.trim()) return Alert.alert('Missing info', 'Name, city and address are required.');
    const pct = Number(f.refundPercent);
    if (isNaN(pct) || pct < 0 || pct > 100) return Alert.alert('Invalid', 'Refund percent must be 0–100.');
    setBusy(true);
    try {
      const body = { ...f, refundPercent: pct };
      if (id) { await api.patch(`/admin/hotels/${id}`, body); Alert.alert('Saved'); }
      else {
        const { data } = await api.post('/admin/hotels', body);
        router.replace({ pathname: '/admin/hotel-form', params: { id: data._id } });   // reopen in edit mode
      }
    } catch (e) { Alert.alert('Error', errMsg(e)); }
    finally { setBusy(false); }
  };

  const remove = () => Alert.alert('Delete hotel?', 'Its room types, rooms and photos are removed too. Hotels with bookings cannot be deleted, so hide them instead.',
    [{ text: 'Cancel' }, { text: 'Delete', style: 'destructive', onPress: async () => {
      try { await api.delete(`/admin/hotels/${id}`); router.replace('/admin/hotels'); }
      catch (e) { Alert.alert('Cannot delete', errMsg(e)); }
    } }]);

  if (user && user.role !== 'admin') return <EmptyState icon="lock-closed-outline" title="Admins only" />;
  if (!ready) return <Loader />;

  return (
    <ScrollView contentContainerStyle={{ padding: 16, gap: 16, paddingBottom: 32 }} keyboardShouldPersistTaps="handled">
      <Stack.Screen options={{ title: id ? 'Edit hotel' : 'New hotel' }} />

      <Card style={{ padding: 16, gap: 12 }}>
        <SectionTitle>Basics</SectionTitle>
        <Field label="Name" value={f.name} onChangeText={set('name')} />
        <CityPicker label="City" value={f.city} onChange={set('city')} />
        <Field label="Address" value={f.address} onChangeText={set('address')} />
        <Field label="Phone" value={f.phone} onChangeText={set('phone')} keyboardType="phone-pad" />
        <Field label="Description" value={f.description} onChangeText={set('description')} multiline />
      </Card>

      <Card style={{ padding: 16, gap: 12 }}>
        <SectionTitle>Hours and policy</SectionTitle>
        <Field label="Opening hours" value={f.openingHours} onChangeText={set('openingHours')} />
        <View style={{ flexDirection: 'row', gap: 10 }}>
          <View style={{ flex: 1 }}><Field label="Check-in time" value={f.checkInTime} onChangeText={set('checkInTime')} /></View>
          <View style={{ flex: 1 }}><Field label="Check-out time" value={f.checkOutTime} onChangeText={set('checkOutTime')} /></View>
        </View>
        <Toggle label="Allow refunds on cancellation" value={f.allowRefund} onChange={set('allowRefund')} />
        {f.allowRefund && <Field label="Refund % of unused nights" value={f.refundPercent} onChangeText={set('refundPercent')} keyboardType="numeric" />}
        <Toggle label="Visible to guests" value={f.isActive} onChange={set('isActive')} />
      </Card>

      <Card style={{ padding: 16 }}>
        <AmenityPicker scope="hotel" value={f.amenities} onChange={set('amenities')} />
      </Card>

      <Button title="Save" loading={busy} onPress={save} />

      {id && (
        <Card style={{ padding: 16, gap: 10 }}>
          <SectionTitle>Manage</SectionTitle>
          <Button title="Photos" icon="images-outline" variant="secondary" onPress={() => router.push({ pathname: '/admin/photos', params: { kind: 'hotel', id } })} />
          <Button title="Room types" icon="bed-outline" variant="secondary" onPress={() => router.push({ pathname: '/admin/room-types', params: { hotel: id } })} />
          <Button title="Rooms" icon="grid-outline" variant="secondary" onPress={() => router.push({ pathname: '/admin/rooms', params: { hotel: id } })} />
          <Button title="Delete hotel" variant="danger" onPress={remove} />
        </Card>
      )}
    </ScrollView>
  );
}
