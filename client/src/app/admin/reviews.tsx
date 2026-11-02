import { useCallback, useState } from 'react';
import { View, Text, FlatList, Alert } from 'react-native';
import { Stack, useFocusEffect } from 'expo-router';
import { api } from '../../api';
import { useRequireAuth } from '../../useRequireAuth';
import { theme } from '../../theme';
import { Button, Card, EmptyState, Stars, errMsg, prettyDate } from '../../ui';
import HotelPicker from '../../components/HotelPicker';

type R = {
  _id: string; rating: number; comment: string; createdAt: string;
  user?: { name: string; email: string }; hotel?: { name: string }; roomType?: { name: string };
};

export default function AdminReviews() {
  const { user } = useRequireAuth();
  const [hotel, setHotel] = useState<string | undefined>();
  const [items, setItems] = useState<R[]>([]);

  const load = useCallback(() => {
    if (user?.role === 'admin') api.get('/admin/reviews', { params: { hotel } }).then((r) => setItems(r.data)).catch(() => {});
  }, [user, hotel]);
  useFocusEffect(load);

  const remove = (r: R) => Alert.alert('Delete review?', "The hotel's rating is recalculated.",
    [{ text: 'Cancel' }, { text: 'Delete', style: 'destructive', onPress: async () => {
      try { await api.delete(`/admin/reviews/${r._id}`); load(); } catch (e) { Alert.alert('Error', errMsg(e)); }
    } }]);

  if (user && user.role !== 'admin') return <EmptyState icon="lock-closed-outline" title="Admins only" />;
  return (
    <View style={{ flex: 1 }}>
      <Stack.Screen options={{ title: 'Reviews' }} />
      <View style={{ padding: 16, paddingBottom: 4 }}><HotelPicker value={hotel} onChange={setHotel} /></View>
      <FlatList data={items} keyExtractor={(r) => r._id} contentContainerStyle={{ padding: 16, gap: 12 }}
        ListEmptyComponent={<EmptyState icon="chatbubble-ellipses-outline" title="No reviews yet" />}
        renderItem={({ item: r }) => (
          <Card style={{ padding: 14, gap: 4 }}>
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
              <Stars n={r.rating} />
              <Text style={{ color: theme.muted, fontSize: 12 }}>{prettyDate(r.createdAt)}</Text>
            </View>
            <Text style={{ fontWeight: '700', color: theme.text }}>{r.user?.name}</Text>
            <Text style={{ color: theme.muted }}>{r.hotel?.name}{r.roomType ? ` · ${r.roomType.name}` : ''}</Text>
            {r.comment ? <Text style={{ color: theme.text, lineHeight: 20, marginTop: 2 }}>{r.comment}</Text> : null}
            <Button title="Delete review" small variant="danger" style={{ alignSelf: 'flex-start', marginTop: 6 }} onPress={() => remove(r)} />
          </Card>
        )} />
    </View>
  );
}