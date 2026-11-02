import { useCallback, useState } from 'react';
import { View, Text, FlatList, TouchableOpacity, Image } from 'react-native';
import { Stack, useFocusEffect, useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { api } from '../api';
import { useRequireAuth } from '../useRequireAuth';
import { Booking } from '../types';
import { shadow, theme } from '../theme';
import { Button, EmptyState, Loader, Segment, StatusBadge, money, shortDate } from '../ui';

export default function MyBookings() {
  const { user } = useRequireAuth();
  const router = useRouter();
  const [all, setAll] = useState<Booking[]>([]);
  const [tab, setTab] = useState('active');
  const [loading, setLoading] = useState(true);

  useFocusEffect(useCallback(() => {        // reload whenever we come back to this screen
    if (!user) return;
    api.get('/bookings/my').then((r) => setAll(r.data)).finally(() => setLoading(false));
  }, [user]));

  if (loading) return <Loader />;
  const list = all.filter((b) => (tab === 'active' ? ['pending', 'confirmed'].includes(b.status)
    : ['completed', 'cancelled', 'refunded'].includes(b.status)));

  return (
    <View style={{ flex: 1 }}>
      <Stack.Screen options={{ title: 'My bookings' }} />
      <View style={{ padding: 16, paddingBottom: 0 }}>
        <Segment value={tab} onChange={setTab} options={[{ value: 'active', label: 'Upcoming' }, { value: 'history', label: 'History' }]} />
      </View>
      <FlatList data={list} keyExtractor={(b) => b._id} contentContainerStyle={{ padding: 16, gap: 12 }}
        ListEmptyComponent={
          <EmptyState icon="receipt-outline" title={tab === 'active' ? 'No upcoming stays' : 'No past bookings yet'}
            subtitle={tab === 'active' ? 'Find a hotel and your next trip will show up here.' : undefined}
            action={tab === 'active' ? <Button title="Explore hotels" small onPress={() => router.replace('/')} /> : undefined} />}
        renderItem={({ item: b }) => (
          <TouchableOpacity activeOpacity={0.9} onPress={() => router.push({ pathname: '/booking/[id]', params: { id: b._id } })}
            style={{ flexDirection: 'row', gap: 12, backgroundColor: theme.card, borderRadius: theme.radius, padding: 12, ...shadow }}>
            {b.hotel?.images?.[0]
              ? <Image source={{ uri: b.hotel.images[0] }} style={{ width: 84, height: 84, borderRadius: 12, backgroundColor: '#e5e7eb' }} />
              : <View style={{ width: 84, height: 84, borderRadius: 12, backgroundColor: '#e5e7eb' }} />}
            <View style={{ flex: 1, gap: 3 }}>
              <StatusBadge status={b.status} />
              <Text style={{ fontSize: 16, fontWeight: '700', color: theme.text }} numberOfLines={1}>{b.hotel?.name}</Text>
              <Text style={{ color: theme.muted }} numberOfLines={1}>{b.roomType?.name}</Text>
              <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
                <Text style={{ color: theme.muted }}>{shortDate(b.checkIn)} – {shortDate(b.checkOut)}</Text>
                <Text style={{ fontWeight: '800', color: theme.text }}>{money(b.totalPrice)}</Text>
              </View>
            </View>
            <Ionicons name="chevron-forward" size={18} color="#cbd5e1" style={{ alignSelf: 'center' }} />
          </TouchableOpacity>
        )} />
    </View>
  );
}