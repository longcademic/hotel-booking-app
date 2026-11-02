import { useCallback, useEffect, useState } from 'react';
import { View, Text, FlatList, Alert } from 'react-native';
import { Stack } from 'expo-router';
import { api } from '../../api';
import { useRequireAuth } from '../../useRequireAuth';
import { theme } from '../../theme';
import { Button, Card, EmptyState, Input, errMsg } from '../../ui';

type U = { _id: string; name: string; email: string; role: 'customer' | 'admin'; isActive: boolean };

export default function AdminUsers() {
  const { user } = useRequireAuth();
  const [q, setQ] = useState('');
  const [items, setItems] = useState<U[]>([]);
  const [page, setPage] = useState(1);
  const [pages, setPages] = useState(1);

  const load = useCallback(async (p: number) => {
    try {
      const { data } = await api.get('/admin/users', { params: { q: q || undefined, page: p } });
      setItems((prev) => (p === 1 ? data.items : [...prev, ...data.items]));
      setPage(p); setPages(data.pages);
    } catch (e) { Alert.alert('Error', errMsg(e)); }
  }, [q]);

  useEffect(() => {
    if (user?.role !== 'admin') return;
    const t = setTimeout(() => load(1), 300);
    return () => clearTimeout(t);
  }, [load, user]);

  const update = async (u: U, body: object) => {
    try { await api.patch(`/admin/users/${u._id}`, body); load(1); }
    catch (e) { Alert.alert('Error', errMsg(e)); }
  };
  const changeRole = (u: U) => {
    const to = u.role === 'admin' ? 'customer' : 'admin';
    Alert.alert(
      to === 'admin' ? 'Make admin?' : 'Remove admin rights?',
      `${u.name} (${u.email}) will ${to === 'admin' ? 'get full admin access.' : 'lose admin access.'}`,
      [{ text: 'Cancel' }, { text: 'Confirm', onPress: () => update(u, { role: to }) }]
    );
  };
  const toggleActive = (u: U) =>
    u.isActive
      ? Alert.alert('Disable account?', `${u.name} will no longer be able to sign in.`,
          [{ text: 'Cancel' }, { text: 'Disable', style: 'destructive', onPress: () => update(u, { isActive: false }) }])
      : update(u, { isActive: true });

  if (user && user.role !== 'admin') return <EmptyState icon="lock-closed-outline" title="Admins only" />;
  return (
    <View style={{ flex: 1 }}>
      <Stack.Screen options={{ title: 'Users' }} />
      <View style={{ padding: 16, paddingBottom: 4 }}>
        <Input icon="search" placeholder="Search name or email" value={q} onChangeText={setQ} autoCapitalize="none" />
      </View>
      <FlatList data={items} keyExtractor={(u) => u._id} contentContainerStyle={{ padding: 16, gap: 12 }}
        ListEmptyComponent={<EmptyState icon="people-outline" title="No users found" />}
        ListFooterComponent={page < pages ? <Button title="Load more" variant="secondary" onPress={() => load(page + 1)} /> : null}
        renderItem={({ item: u }) => (
          <Card style={{ padding: 14, gap: 10, opacity: u.isActive ? 1 : 0.6 }}>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
              <View style={{ width: 44, height: 44, borderRadius: 22, backgroundColor: theme.primarySoft, alignItems: 'center', justifyContent: 'center' }}>
                <Text style={{ fontSize: 18, fontWeight: '800', color: theme.primaryDark }}>{u.name.charAt(0).toUpperCase()}</Text>
              </View>
              <View style={{ flex: 1 }}>
                <Text style={{ fontSize: 16, fontWeight: '700', color: theme.text }}>{u.name}</Text>
                <Text style={{ color: theme.muted }}>{u.email}</Text>
              </View>
              <View style={{ alignItems: 'flex-end', gap: 4 }}>
                <Text style={{ fontSize: 12, fontWeight: '700', paddingHorizontal: 8, paddingVertical: 2, borderRadius: 8, overflow: 'hidden',
                  color: u.role === 'admin' ? '#6d28d9' : '#374151', backgroundColor: u.role === 'admin' ? '#ede9fe' : '#f3f4f6' }}>
                  {u.role === 'admin' ? 'Admin' : 'Customer'}
                </Text>
                {!u.isActive && <Text style={{ fontSize: 12, color: theme.danger, fontWeight: '600' }}>Disabled</Text>}
              </View>
            </View>
            {u._id !== user?.id && (
              <View style={{ flexDirection: 'row', gap: 10 }}>
                <Button small title={u.isActive ? 'Disable' : 'Enable'} variant={u.isActive ? 'danger' : 'secondary'} onPress={() => toggleActive(u)} />
                <Button small variant="secondary" title={u.role === 'admin' ? 'Make customer' : 'Make admin'} onPress={() => changeRole(u)} />
              </View>
            )}
          </Card>
        )} />
    </View>
  );
}