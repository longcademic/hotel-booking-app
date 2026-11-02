import { useCallback, useEffect, useState } from 'react';
import { View, Text, FlatList, Alert, Modal, TouchableOpacity } from 'react-native';
import { Stack, useLocalSearchParams } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { api } from '../../api';
import { useRequireAuth } from '../../useRequireAuth';
import { theme } from '../../theme';
import { Button, Card, EmptyState, InfoRow, Input, Loader, StatusBadge, errMsg, shortDate } from '../../ui';
import HotelPicker from '../../components/HotelPicker';

type Slim = { _id: string; guest?: string; status: string; checkIn: string; checkOut: string };
type BoardRoom = {
  _id: string; roomNumber: string; roomType?: string; status: 'available' | 'maintenance';
  state: 'available' | 'occupied' | 'pending' | 'maintenance'; current?: Slim; next?: Slim;
};
const todayLocal = () => new Date(Date.now() - new Date().getTimezoneOffset() * 60000).toISOString().slice(0, 10);
const addDays = (d: string, n: number) => new Date(new Date(`${d}T00:00:00Z`).getTime() + n * 86400000).toISOString().slice(0, 10);

const NavBtn = ({ icon, onPress }: { icon: 'chevron-back' | 'chevron-forward'; onPress: () => void }) => (
  <TouchableOpacity onPress={onPress} hitSlop={8}
    style={{ width: 40, height: 40, borderRadius: 20, backgroundColor: theme.primarySoft, alignItems: 'center', justifyContent: 'center' }}>
    <Ionicons name={icon} size={20} color={theme.primaryDark} />
  </TouchableOpacity>
);

export default function AdminRooms() {
  const { user } = useRequireAuth();
  const params = useLocalSearchParams<{ hotel?: string }>();
  const [hotel, setHotel] = useState<string | undefined>(params.hotel);
  const [date, setDate] = useState(todayLocal());
  const [rooms, setRooms] = useState<BoardRoom[] | null>(null);
  const [rename, setRename] = useState<{ id: string; value: string } | null>(null);

  const load = useCallback(() => {
    if (!hotel) { setRooms(null); return; }
    api.get('/admin/room-board', { params: { hotel, date } })
      .then((r) => setRooms(r.data.rooms)).catch((e) => Alert.alert('Error', errMsg(e)));
  }, [hotel, date]);
  useEffect(() => { if (user?.role === 'admin') load(); }, [user, load]);

  const patch = async (id: string, body: object) => {
    try { await api.patch(`/admin/rooms/${id}`, body); load(); }
    catch (e: any) {
      if (e?.response?.data?.needsForce)
        Alert.alert('Room has bookings', `${e.response.data.message}. They stay assigned to this room until you move them from the booking list.`,
          [{ text: 'Cancel' }, { text: 'Set maintenance anyway', style: 'destructive', onPress: () => patch(id, { ...body, force: true }) }]);
      else Alert.alert('Error', errMsg(e));
    }
  };

  if (user && user.role !== 'admin') return <EmptyState icon="lock-closed-outline" title="Admins only" />;
  const count = (s: string) => (rooms ?? []).filter((r) => r.state === s).length;

  return (
    <View style={{ flex: 1 }}>
      <Stack.Screen options={{ title: 'Rooms' }} />
      <View style={{ padding: 16, paddingBottom: 4, gap: 10 }}>
        <HotelPicker value={hotel} onChange={setHotel} allowAll={false} />
        <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
          <NavBtn icon="chevron-back" onPress={() => setDate(addDays(date, -1))} />
          <Text style={{ fontWeight: '700', fontSize: 16, color: theme.text }}>{date}{date === todayLocal() ? '  ·  today' : ''}</Text>
          <NavBtn icon="chevron-forward" onPress={() => setDate(addDays(date, 1))} />
        </View>
        {rooms && (
          <Text style={{ color: theme.muted }}>
            {count('available')} available · {count('occupied')} occupied · {count('pending')} awaiting payment · {count('maintenance')} maintenance
          </Text>
        )}
      </View>

      {!hotel ? <EmptyState icon="business-outline" title="Select a hotel" subtitle="Pick a hotel above to see its rooms." />
        : !rooms ? <Loader /> : (
        <FlatList data={rooms} keyExtractor={(r) => r._id} contentContainerStyle={{ padding: 16, gap: 12 }}
          ListEmptyComponent={<EmptyState icon="bed-outline" title="No rooms yet" subtitle="Add a room type to create rooms." />}
          renderItem={({ item: r }) => (
            <Card style={{ padding: 14, gap: 8 }}>
              <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
                <Text style={{ fontSize: 17, fontWeight: '800', color: theme.text }}>Room {r.roomNumber}</Text>
                <StatusBadge status={r.state} />
              </View>
              <Text style={{ color: theme.muted }}>{r.roomType}</Text>
              {r.current && <InfoRow icon="person-outline">{r.current.guest} · {shortDate(r.current.checkIn)} – {shortDate(r.current.checkOut)}</InfoRow>}
              {r.next && <InfoRow icon="arrow-forward-circle-outline">Next: {r.next.guest} · {shortDate(r.next.checkIn)} – {shortDate(r.next.checkOut)}</InfoRow>}
              <View style={{ flexDirection: 'row', gap: 10 }}>
                <Button small variant={r.status === 'maintenance' ? 'primary' : 'secondary'}
                  title={r.status === 'maintenance' ? 'Back in service' : 'Set maintenance'} icon="construct-outline"
                  onPress={() => patch(r._id, { status: r.status === 'maintenance' ? 'available' : 'maintenance' })} />
                <Button small variant="ghost" title="Rename" icon="create-outline" onPress={() => setRename({ id: r._id, value: r.roomNumber })} />
              </View>
            </Card>
          )} />
      )}

      <Modal visible={!!rename} transparent animationType="fade" onRequestClose={() => setRename(null)}>
        <View style={{ flex: 1, backgroundColor: '#0008', justifyContent: 'center', padding: 24 }}>
          <View style={{ backgroundColor: theme.card, borderRadius: theme.radius, padding: 18, gap: 12 }}>
            <Text style={{ fontSize: 17, fontWeight: '800', color: theme.text }}>Room number</Text>
            <Input autoFocus value={rename?.value ?? ''} onChangeText={(v) => setRename((x) => x && { ...x, value: v })} />
            <View style={{ flexDirection: 'row', gap: 10 }}>
              <Button title="Cancel" variant="secondary" style={{ flex: 1 }} onPress={() => setRename(null)} />
              <Button title="Save" style={{ flex: 1 }}
                onPress={() => { const x = rename!; setRename(null); if (x.value.trim()) patch(x.id, { roomNumber: x.value.trim() }); }} />
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
}