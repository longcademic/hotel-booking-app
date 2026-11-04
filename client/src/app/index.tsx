import { useCallback, useEffect, useState } from 'react';
import { View, Text, FlatList, Image, TouchableOpacity } from 'react-native';
import { Stack, useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { api } from '../api';
import { useAuth } from '../AuthContext';
import { useSearch } from '../SearchContext';
import { Hotel } from '../types';
import { shadow, theme } from '../theme';
import { AmenityTag, Button, EmptyState, IconName, Input, Rating, errMsg, money } from '../ui';
import SearchControls from '../components/SearchControls';
import FilterModal, { Filters, defaultFilters, toParams } from '../components/FilterModal';

const SORTS = [
  { value: 'rating', label: 'Top rated' },
  { value: 'price_asc', label: 'Price: low to high' },
  { value: 'price_desc', label: 'Price: high to low' },
  { value: 'reviews', label: 'Most reviewed' },
];

const HeaderIcon = ({ name, onPress }: { name: IconName; onPress: () => void }) => (
  <TouchableOpacity onPress={onPress} activeOpacity={0.7}
    style={{ width: 40, height: 40, borderRadius: 20, backgroundColor: theme.primarySoft, alignItems: 'center', justifyContent: 'center' }}>
    <Ionicons name={name} size={20} color={theme.primaryDark} />
  </TouchableOpacity>
);

function HotelCard({ h, onPress }: { h: Hotel; onPress: () => void }) {
  const cover = h.images?.[0];
  return (
    <TouchableOpacity activeOpacity={0.9} onPress={onPress}
      style={{ borderRadius: theme.radius, backgroundColor: theme.card, ...shadow }}>
      <View style={{ borderRadius: theme.radius, overflow: 'hidden' }}>
        {cover
          ? <Image source={{ uri: cover }} style={{ height: 170, backgroundColor: '#e5e7eb' }} />
          : <View style={{ height: 170, backgroundColor: '#e5e7eb', alignItems: 'center', justifyContent: 'center' }}>
              <Ionicons name="image-outline" size={36} color="#9ca3af" />
            </View>}
        <View style={{ padding: 14, gap: 6 }}>
          <Text style={{ fontSize: 18, fontWeight: '700', color: theme.text }} numberOfLines={1}>{h.name}</Text>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
            <Ionicons name="location-outline" size={15} color={theme.muted} />
            <Text style={{ color: theme.muted }} numberOfLines={1}>{h.city}</Text>
          </View>
          <Rating avg={h.ratingAvg} count={h.reviewCount} />
          <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-end', marginTop: 4 }}>
            <View style={{ flex: 1, flexDirection: 'row', flexWrap: 'wrap', marginRight: 8 }}>
              {h.amenities.slice(0, 3).map((a) => <AmenityTag key={a._id} a={a} />)}
            </View>
            <View style={{ alignItems: 'flex-end' }}>
              <Text style={{ fontSize: 11, color: theme.muted }}>from</Text>
              <Text style={{ fontSize: 20, fontWeight: '800', color: theme.primary }}>
                {money(h.minPrice ?? 0)}<Text style={{ fontSize: 12, color: theme.muted, fontWeight: '500' }}> /night</Text>
              </Text>
            </View>
          </View>
        </View>
      </View>
    </TouchableOpacity>
  );
}

export default function Home() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { user } = useAuth();
  const search = useSearch();
  const [q, setQ] = useState('');
  const [filters, setFilters] = useState<Filters>(defaultFilters('rating'));
  const [showFilter, setShowFilter] = useState(false);
  const [items, setItems] = useState<Hotel[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const load = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const { data } = await api.get('/hotels', {
        params: { q: q || undefined, ...toParams(filters), checkIn: search.checkIn, checkOut: search.checkOut, guests: search.guests, limit: 50 },
      });
      setItems(data.items);
    } catch (e) { setError(errMsg(e)); }
    finally { setLoading(false); }
  }, [q, filters, search.checkIn, search.checkOut, search.guests]);

  useEffect(() => { const t = setTimeout(load, 300); return () => clearTimeout(t); }, [load]); // debounce typing

  const activeFilters = (filters.city.trim() ? 1 : 0) + (filters.minPrice ? 1 : 0) + (filters.maxPrice ? 1 : 0)
    + filters.amenities.length + (filters.sort !== 'rating' ? 1 : 0);
  return (
    <View style={{ flex: 1 }}>
      <Stack.Screen options={{ headerShown: false }} />

      <View style={{ backgroundColor: theme.card, paddingTop: insets.top + 8, paddingHorizontal: 16, paddingBottom: 16,
        gap: 12, borderBottomLeftRadius: 24, borderBottomRightRadius: 24, ...shadow }}>
        <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
            {user
              ? <HeaderIcon name="person-circle-outline" onPress={() => router.push('/profile' as any)} />
              : <Button title="Sign in" small onPress={() => router.push('/login')} />}
            <Text style={{ fontSize: 24, fontWeight: '800', color: theme.text }}>Find your stay</Text>
          </View>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
            {user && <HeaderIcon name="receipt-outline" onPress={() => router.push('/bookings')} />}
            {user?.role === 'admin' && <HeaderIcon name="shield-checkmark-outline" onPress={() => router.push('/admin')} />}
          </View>
        </View>

        <View style={{ flexDirection: 'row', gap: 8 }}>
          <Input icon="search" placeholder="Search hotel name" value={q} onChangeText={setQ}
            returnKeyType="search" box={{ flex: 1, backgroundColor: theme.bg, borderColor: 'transparent' }} />
          <TouchableOpacity onPress={() => setShowFilter(true)} activeOpacity={0.8}
            style={{ width: 48, borderRadius: 12, backgroundColor: theme.primary, alignItems: 'center', justifyContent: 'center' }}>
            <Ionicons name="options-outline" size={22} color="#fff" />
            {activeFilters > 0 && (
              <View style={{ position: 'absolute', top: -4, right: -4, minWidth: 18, height: 18, borderRadius: 9,
                backgroundColor: theme.danger, alignItems: 'center', justifyContent: 'center' }}>
                <Text style={{ color: '#fff', fontSize: 11, fontWeight: '700' }}>{activeFilters}</Text>
              </View>
            )}
          </TouchableOpacity>
        </View>
        <SearchControls />
      </View>

      <FlatList data={items} keyExtractor={(h) => h._id} contentContainerStyle={{ padding: 16, gap: 16, paddingBottom: 32 }}
        refreshing={loading} onRefresh={load}
        ListHeaderComponent={!error && !loading && items.length > 0
          ? <Text style={{ color: theme.muted }}>{items.length} stay{items.length === 1 ? '' : 's'} found</Text> : null}
        ListEmptyComponent={loading ? null : error
          ? <EmptyState icon="cloud-offline-outline" title="Can't reach the server" subtitle={error}
              action={<Button title="Try again" small onPress={load} />} />
          : <EmptyState icon="search-outline" title="No stays found" subtitle="Try different dates, fewer filters or another destination." />}
        renderItem={({ item }) => (
          <HotelCard h={item} onPress={() => router.push({ pathname: '/hotel/[id]', params: { id: item._id } })} />
        )} />

      <FilterModal visible={showFilter} scope="hotel" sorts={SORTS} value={filters}
        onClose={() => setShowFilter(false)} onApply={(f) => { setFilters(f); setShowFilter(false); }} />
    </View>
  );
}
