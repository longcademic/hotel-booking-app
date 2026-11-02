import { useCallback, useEffect, useState } from 'react';
import { View, Text, FlatList, Alert, ScrollView } from 'react-native';
import { Stack, useLocalSearchParams } from 'expo-router';
import { api } from '../../api';
import { useRequireAuth } from '../../useRequireAuth';
import { AdminBooking } from '../../types';
import { theme } from '../../theme';
import { Button, Card, Chip, EmptyState, InfoRow, Input, StatusBadge, errMsg, money, shortDate } from '../../ui';
import HotelPicker from '../../components/HotelPicker';

const STATUSES = ['all', 'pending', 'confirmed', 'completed', 'cancelled', 'refunded'];

export default function AdminBookings() {
  const { user } = useRequireAuth();
  const params = useLocalSearchParams<{ hotel?: string }>();
  const [hotel, setHotel] = useState<string | undefined>(params.hotel);
  const [status, setStatus] = useState('all');
  const [q, setQ] = useState('');
  const [items, setItems] = useState<AdminBooking[]>([]);
  const [page, setPage] = useState(1);
  const [pages, setPages] = useState(1);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const load = useCallback(async (p: number) => {
    setLoading(true);
    setError('');
    try {
      const { data } = await api.get('/admin/bookings', {
        params: { hotel, status: status === 'all' ? undefined : status, q: q || undefined, page: p, limit: 15 },
      });
      setItems((prev) => (p === 1 ? data.items : [...prev, ...data.items]));
      setPage(p); setPages(data.pages); setTotal(data.total);
    } catch (e) { setError(errMsg(e)); }
    finally { setLoading(false); }
  }, [hotel, status, q]);

  useEffect(() => {
    if (user?.role !== 'admin') return;
    const t = setTimeout(() => load(1), 300);        // debounce search typing
    return () => clearTimeout(t);
  }, [load, user]);

  const cancel = (b: AdminBooking) =>
    Alert.alert('Cancel booking?',
      b.status === 'pending' ? 'Release this unpaid booking?'
        : `Cancelled by the hotel: the guest is refunded ${money(b.cancelInfo.refundAmount)} (100% of unused nights).`,
      [{ text: 'Keep' }, { text: 'Cancel booking', style: 'destructive', onPress: async () => {
        try { await api.post(`/admin/bookings/${b._id}/cancel`); load(1); }
        catch (e) { Alert.alert('Cannot cancel', errMsg(e)); }
      } }]);

  const move = (b: AdminBooking) =>
    Alert.alert('Move to another room?', `Room ${b.room?.roomNumber} → next free ${b.roomType?.name} for these dates.`,
      [{ text: 'Keep' }, { text: 'Move', onPress: async () => {
        try {
          const { data } = await api.post(`/admin/bookings/${b._id}/reassign`, {});
          Alert.alert('Moved', `Now in room ${data.room.roomNumber}.`);
          load(1);
        } catch (e) { Alert.alert('Cannot move', errMsg(e)); }
      } }]);

  if (user && user.role !== 'admin') return <EmptyState icon="lock-closed-outline" title="Admins only" />;

  return (
    <View style={{ flex: 1 }}>
      <Stack.Screen options={{ title: 'Bookings' }} />
      <View style={{ padding: 16, paddingBottom: 4, gap: 10 }}>
        <HotelPicker value={hotel} onChange={setHotel} />
        <Input icon="search" placeholder="Guest, email, room no. or booking ID" value={q} onChangeText={setQ} autoCapitalize="none" />
        <ScrollView horizontal showsHorizontalScrollIndicator={false}>
          {STATUSES.map((s) => <Chip key={s} label={s[0].toUpperCase() + s.slice(1)} active={status === s} onPress={() => setStatus(s)} />)}
        </ScrollView>
        <Text style={{ color: theme.muted }}>{total} booking{total === 1 ? '' : 's'}</Text>
      </View>

      {error ? <EmptyState icon="alert-circle-outline" title="Couldn't load bookings" subtitle={error} /> : (
        <FlatList data={items} keyExtractor={(b) => b._id} contentContainerStyle={{ padding: 16, gap: 12 }}
          refreshing={loading} onRefresh={() => load(1)}
          ListEmptyComponent={loading ? null : <EmptyState icon="receipt-outline" title="No bookings found" />}
          ListFooterComponent={page < pages ? <Button title={loading ? 'Loading…' : 'Load more'} variant="secondary" onPress={() => load(page + 1)} /> : null}
          renderItem={({ item: b }) => {
            const active = ['pending', 'confirmed'].includes(b.status);
            return (
              <Card style={{ padding: 14, gap: 8 }}>
                <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
                  <Text style={{ fontWeight: '800', color: theme.text }}>#{b._id.slice(-6).toUpperCase()}</Text>
                  <StatusBadge status={b.status} />
                </View>
                <View>
                  <Text style={{ fontSize: 16, fontWeight: '700', color: theme.text }}>{b.user?.name}</Text>
                  <Text style={{ color: theme.muted }}>{b.user?.email}{!hotel && b.hotel ? ` · ${b.hotel.name}` : ''}</Text>
                </View>
                <InfoRow icon="bed-outline">Room {b.room?.roomNumber} · {b.roomType?.name} · {b.guests} guest{b.guests > 1 ? 's' : ''}</InfoRow>
                <InfoRow icon="calendar-outline">{shortDate(b.checkIn)} – {shortDate(b.checkOut)} · {b.nights} night{b.nights > 1 ? 's' : ''}</InfoRow>
                {b.specialRequests ? <InfoRow icon="chatbubble-outline">{b.specialRequests}</InfoRow> : null}
                <Text style={{ fontWeight: '800', color: theme.text }}>
                  {money(b.totalPrice)}{b.refundAmount > 0 ? `  ·  refunded ${money(b.refundAmount)}` : ''}
                </Text>
                {b.cancelReason === 'expired' && <Text style={{ color: theme.muted }}>Auto-cancelled: not paid within 30 minutes</Text>}
                {b.cancelReason === 'admin' && <Text style={{ color: theme.muted }}>Cancelled by the hotel</Text>}
                {active && (
                  <View style={{ flexDirection: 'row', gap: 10 }}>
                    <Button title="Move room" icon="swap-horizontal-outline" variant="secondary" small onPress={() => move(b)} />
                    {b.cancelInfo.canCancel && <Button title="Cancel" variant="danger" small onPress={() => cancel(b)} />}
                  </View>
                )}
              </Card>
            );
          }} />
      )}
    </View>
  );
}