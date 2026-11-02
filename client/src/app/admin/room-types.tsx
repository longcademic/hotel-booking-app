import { useCallback, useState } from 'react';
import { View, Text, FlatList, TouchableOpacity, Image } from 'react-native';
import { Stack, useFocusEffect, useLocalSearchParams, useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { api } from '../../api';
import { useRequireAuth } from '../../useRequireAuth';
import { RoomType } from '../../types';
import { shadow, theme } from '../../theme';
import { Button, EmptyState, Loader, money } from '../../ui';

export default function AdminRoomTypes() {
  const { user } = useRequireAuth();
  const { hotel } = useLocalSearchParams<{ hotel: string }>();
  const router = useRouter();
  const [types, setTypes] = useState<(RoomType & { isActive: boolean })[] | null>(null);
  const [counts, setCounts] = useState<Record<string, number>>({});

  useFocusEffect(useCallback(() => {
    if (user?.role !== 'admin') return;
    api.get('/admin/room-types', { params: { hotel } }).then((r) => setTypes(r.data)).catch(() => setTypes([]));
    api.get('/admin/rooms', { params: { hotel } }).then((r) => {
      const c: Record<string, number> = {};
      r.data.forEach((room: any) => { c[room.roomType?._id] = (c[room.roomType?._id] || 0) + 1; });
      setCounts(c);
    }).catch(() => {});
  }, [user, hotel]));

  if (user && user.role !== 'admin') return <EmptyState icon="lock-closed-outline" title="Admins only" />;
  if (!types) return <Loader />;

  return (
    <FlatList data={types} keyExtractor={(t) => t._id} contentContainerStyle={{ padding: 16, gap: 12 }}
      ListHeaderComponent={
        <View style={{ marginBottom: 4 }}>
          <Stack.Screen options={{ title: 'Room types' }} />
          <Button title="Add room type" icon="add" onPress={() => router.push({ pathname: '/admin/room-type-form', params: { hotel } })} />
        </View>}
      ListEmptyComponent={<EmptyState icon="bed-outline" title="No room types yet" subtitle="Add one and choose how many rooms it has." />}
      renderItem={({ item: t }) => (
        <TouchableOpacity activeOpacity={0.9}
          onPress={() => router.push({ pathname: '/admin/room-type-form', params: { hotel, id: t._id } })}
          style={{ flexDirection: 'row', gap: 12, backgroundColor: theme.card, borderRadius: theme.radius, padding: 12,
            opacity: t.isActive ? 1 : 0.6, ...shadow }}>
          {t.images?.[0]
            ? <Image source={{ uri: t.images[0] }} style={{ width: 70, height: 70, borderRadius: 12, backgroundColor: '#e5e7eb' }} />
            : <View style={{ width: 70, height: 70, borderRadius: 12, backgroundColor: '#e5e7eb' }} />}
          <View style={{ flex: 1, gap: 2 }}>
            <Text style={{ fontSize: 16, fontWeight: '700', color: theme.text }}>{t.name}</Text>
            <Text style={{ color: theme.muted }}>Up to {t.capacity} guests · {t.beds} × {t.bedType} · {counts[t._id] || 0} rooms</Text>
            <Text style={{ fontWeight: '800', color: theme.primary }}>{money(t.pricePerNight)} <Text style={{ fontWeight: '500', color: theme.muted }}>/ night</Text></Text>
            {!t.isActive && <Text style={{ color: theme.warning, fontWeight: '600' }}>Hidden from guests</Text>}
          </View>
          <Ionicons name="chevron-forward" size={18} color="#cbd5e1" style={{ alignSelf: 'center' }} />
        </TouchableOpacity>
      )} />
  );
}