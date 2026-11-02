import { useEffect, useState } from 'react';
import { Dimensions, ScrollView, Text, TouchableOpacity, View } from 'react-native';
import { Stack, useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { api } from '../../api';
import { useRequireAuth } from '../../useRequireAuth';
import { AdminStats } from '../../types';
import { theme } from '../../theme';
import { Button, Card, EmptyState, IconName, Loader, SectionTitle, Segment, errMsg, money } from '../../ui';
import HotelPicker from '../../components/HotelPicker';
import { PieChart, TrendChart } from '../../components/charts';

const MENU: [string, string, IconName][] = [
  ['Bookings', '/admin/bookings', 'receipt-outline'],
  ['Hotels', '/admin/hotels', 'business-outline'],
  ['Rooms', '/admin/rooms', 'bed-outline'],
  ['Amenities', '/admin/amenities', 'pricetags-outline'],
  ['Users', '/admin/users', 'people-outline'],
  ['Reviews', '/admin/reviews', 'chatbubble-ellipses-outline'],
];

const Kpi = ({ label, value, sub }: { label: string; value: string | number; sub?: string }) => (
  <Card style={{ width: '48%', padding: 14, gap: 2 }}>
    <Text style={{ color: theme.muted }}>{label}</Text>
    <Text style={{ fontSize: 24, fontWeight: '800', color: theme.text }}>{value}</Text>
    {sub ? <Text style={{ color: theme.muted, fontSize: 12 }}>{sub}</Text> : null}
  </Card>
);

export default function AdminDashboard() {
  const { user } = useRequireAuth();
  const router = useRouter();
  const [hotel, setHotel] = useState<string | undefined>();
  const [days, setDays] = useState(30);
  const [stats, setStats] = useState<AdminStats | null>(null);
  const [error, setError] = useState('');
  const W = Dimensions.get('window').width;

  useEffect(() => {
    if (user?.role !== 'admin') return;
    setError('');
    api.get('/admin/stats', { params: { hotel, days } }).then((r) => setStats(r.data)).catch((e) => setError(errMsg(e)));
  }, [user, hotel, days]);

  if (user && user.role !== 'admin') return <EmptyState icon="lock-closed-outline" title="Admins only" />;
  const k = stats?.kpi;
  const tile = (W - 32 - 20) / 3;

  return (
    <ScrollView contentContainerStyle={{ padding: 16, gap: 16, paddingBottom: 32 }}>
      <Stack.Screen options={{ title: 'Admin' }} />

      <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 10 }}>
        {MENU.map(([label, href, icon]) => (
          <TouchableOpacity key={label} activeOpacity={0.8} onPress={() => router.push(href as any)}
            style={{ width: tile, backgroundColor: theme.card, borderRadius: 14, paddingVertical: 14, alignItems: 'center', gap: 6 }}>
            <Ionicons name={icon} size={24} color={theme.primary} />
            <Text style={{ fontWeight: '600', color: theme.text, fontSize: 13 }}>{label}</Text>
          </TouchableOpacity>
        ))}
      </View>

      <View style={{ gap: 10 }}>
        <HotelPicker value={hotel} onChange={setHotel} />
        <Segment value={String(days)} onChange={(v) => setDays(+v)}
          options={[{ value: '7', label: '7 days' }, { value: '30', label: '30 days' }, { value: '90', label: '90 days' }]} />
      </View>

      {error ? <EmptyState icon="alert-circle-outline" title="Couldn't load statistics" subtitle={error} />
        : !stats || !k ? <Loader /> : (
        <>
          <View style={{ flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'space-between', rowGap: 10 }}>
            <Kpi label="Reservations" value={k.reservations} sub="paid bookings" />
            <Kpi label="Average stay" value={k.avgNights === null ? '—' : `${k.avgNights} nights`} sub={`${k.completed} completed`} />
            <Kpi label="Net revenue" value={money(k.revenue)} sub="paid minus refunds" />
            <Kpi label="Unpaid holds" value={k.pending} sub="awaiting payment" />
          </View>
          <Text style={{ color: theme.muted }}>
            {Object.entries(k.byStatus).map(([s, n]) => `${s} ${n}`).join(' · ') || 'No bookings in this period'}
          </Text>

          <Card style={{ padding: 16, gap: 10 }}>
            <SectionTitle>Reservation trend</SectionTitle>
            <TrendChart data={stats.trend} width={W - 64} />
          </Card>

          <Card style={{ padding: 16, gap: 10 }}>
            <SectionTitle>Most booked {stats.mostBooked.by === 'hotel' ? 'hotels' : 'room types'}</SectionTitle>
            <PieChart data={stats.mostBooked.items.map((i) => ({ label: i.name, value: i.count }))} />
          </Card>

          <Button title="View bookings" icon="receipt-outline"
            onPress={() => router.push({ pathname: '/admin/bookings', params: hotel ? { hotel } : {} })} />
        </>
      )}
    </ScrollView>
  );
}