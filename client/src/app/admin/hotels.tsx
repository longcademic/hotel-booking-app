import { useCallback, useState } from 'react';
import { View, Text, FlatList, TouchableOpacity, Image } from 'react-native';
import { Stack, useFocusEffect, useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { api } from '../../api';
import { useRequireAuth } from '../../useRequireAuth';
import { Hotel } from '../../types';
import { shadow, theme } from '../../theme';
import { Button, EmptyState, Loader, Rating } from '../../ui';

export default function AdminHotels() {
  const { user } = useRequireAuth();
  const router = useRouter();
  const [items, setItems] = useState<(Hotel & { isActive: boolean })[] | null>(null);

  useFocusEffect(useCallback(() => {
    if (user?.role === 'admin') api.get('/admin/hotels').then((r) => setItems(r.data)).catch(() => setItems([]));
  }, [user]));

  if (user && user.role !== 'admin') return <EmptyState icon="lock-closed-outline" title="Admins only" />;
  if (!items) return <Loader />;

  return (
    <FlatList data={items} keyExtractor={(h) => h._id} contentContainerStyle={{ padding: 16, gap: 12 }}
      ListHeaderComponent={
        <View style={{ marginBottom: 4 }}>
          <Stack.Screen options={{ title: 'Hotels' }} />
          <Button title="Add hotel" icon="add" onPress={() => router.push('/admin/hotel-form')} />
        </View>}
      ListEmptyComponent={<EmptyState icon="business-outline" title="No hotels yet" />}
      renderItem={({ item: h }) => (
        <TouchableOpacity activeOpacity={0.9} onPress={() => router.push({ pathname: '/admin/hotel-form', params: { id: h._id } })}
          style={{ flexDirection: 'row', gap: 12, backgroundColor: theme.card, borderRadius: theme.radius, padding: 12,
            opacity: h.isActive ? 1 : 0.6, ...shadow }}>
          {h.images?.[0]
            ? <Image source={{ uri: h.images[0] }} style={{ width: 70, height: 70, borderRadius: 12, backgroundColor: '#e5e7eb' }} />
            : <View style={{ width: 70, height: 70, borderRadius: 12, backgroundColor: '#e5e7eb' }} />}
          <View style={{ flex: 1, gap: 2 }}>
            <Text style={{ fontSize: 16, fontWeight: '700', color: theme.text }} numberOfLines={1}>{h.name}</Text>
            <Text style={{ color: theme.muted }} numberOfLines={1}>{h.city} · {h.address}</Text>
            <Rating avg={h.ratingAvg} count={h.reviewCount} />
            {!h.isActive && <Text style={{ color: theme.warning, fontWeight: '600' }}>Hidden from guests</Text>}
          </View>
          <Ionicons name="chevron-forward" size={18} color="#cbd5e1" style={{ alignSelf: 'center' }} />
        </TouchableOpacity>
      )} />
  );
}