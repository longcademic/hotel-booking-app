import { useCallback, useState } from 'react';
import { View, Text, FlatList, TouchableOpacity, Alert } from 'react-native';
import { Stack, useFocusEffect } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { api } from '../../api';
import { useRequireAuth } from '../../useRequireAuth';
import { Amenity } from '../../types';
import { theme } from '../../theme';
import { Button, Card, EmptyState, Input, Segment, errMsg, safeIcon } from '../../ui';

export default function AdminAmenities() {
  const { user } = useRequireAuth();
  const [scope, setScope] = useState<'hotel' | 'room'>('hotel');
  const [items, setItems] = useState<Amenity[]>([]);
  const [name, setName] = useState('');

  const load = useCallback(() => {
    if (user?.role === 'admin') api.get('/admin/amenities', { params: { scope } }).then((r) => setItems(r.data)).catch(() => {});
  }, [user, scope]);
  useFocusEffect(load);

  const add = async () => {
    if (!name.trim()) return;
    try { await api.post('/admin/amenities', { name: name.trim(), scope }); setName(''); load(); }
    catch (e) { Alert.alert('Cannot add', errMsg(e)); }
  };
  const remove = (a: Amenity) => Alert.alert(`Delete "${a.name}"?`, 'It is removed from every hotel and room type that uses it.',
    [{ text: 'Cancel' }, { text: 'Delete', style: 'destructive', onPress: async () => {
      try { await api.delete(`/admin/amenities/${a._id}`); load(); } catch (e) { Alert.alert('Error', errMsg(e)); }
    } }]);

  if (user && user.role !== 'admin') return <EmptyState icon="lock-closed-outline" title="Admins only" />;
  return (
    <View style={{ flex: 1 }}>
      <Stack.Screen options={{ title: 'Amenities' }} />
      <View style={{ padding: 16, gap: 12 }}>
        <Segment value={scope} onChange={(v) => setScope(v as 'hotel' | 'room')}
          options={[{ value: 'hotel', label: 'Hotel amenities' }, { value: 'room', label: 'Room amenities' }]} />
        <View style={{ flexDirection: 'row', gap: 8 }}>
          <Input placeholder={`New ${scope} amenity`} value={name} onChangeText={setName} onSubmitEditing={add}
            returnKeyType="done" box={{ flex: 1 }} />
          <Button title="Add" icon="add" disabled={!name.trim()} onPress={add} />
        </View>
      </View>
      <FlatList data={items} keyExtractor={(a) => a._id} contentContainerStyle={{ padding: 16, paddingTop: 0, gap: 10 }}
        ListEmptyComponent={<EmptyState icon="pricetags-outline" title="No amenities yet" />}
        renderItem={({ item: a }) => (
          <Card style={{ flexDirection: 'row', alignItems: 'center', padding: 12, gap: 12 }}>
            <View style={{ width: 36, height: 36, borderRadius: 18, backgroundColor: theme.primarySoft, alignItems: 'center', justifyContent: 'center' }}>
              <Ionicons name={safeIcon(a.icon)} size={18} color={theme.primaryDark} />
            </View>
            <Text style={{ flex: 1, fontSize: 16, color: theme.text }}>{a.name}</Text>
            <TouchableOpacity onPress={() => remove(a)} hitSlop={10}><Ionicons name="trash-outline" size={20} color={theme.danger} /></TouchableOpacity>
          </Card>
        )} />
    </View>
  );
}