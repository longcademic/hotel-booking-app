import { useEffect, useState } from 'react';
import { ScrollView, View, Text, Image, TouchableOpacity } from 'react-native';
import { Stack, useLocalSearchParams, useRouter } from 'expo-router';
import { api } from '../../api';
import { useAuth } from '../../AuthContext';
import { useSearch } from '../../SearchContext';
import { Hotel, RoomType } from '../../types';
import { shadow, theme } from '../../theme';
import { AmenityTag, Button, EmptyState, InfoRow, Loader, Rating, SectionTitle, Spec,
  availabilityColor, availabilityText, money, policyText } from '../../ui';
import Gallery from '../../components/Gallery';
import SearchControls from '../../components/SearchControls';
import FilterModal, { Filters, defaultFilters, toParams } from '../../components/FilterModal';
import ReviewsSection from '../../components/ReviewsSection';

const SORTS = [
  { value: 'price_asc', label: 'Price: low to high' },
  { value: 'price_desc', label: 'Price: high to low' },
  { value: 'capacity', label: 'Capacity' },
];

export default function HotelDetail() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const search = useSearch();
  const { user } = useAuth();
  const [hotel, setHotel] = useState<Hotel | null>(null);
  const [types, setTypes] = useState<RoomType[]>([]);
  const [filters, setFilters] = useState<Filters>(defaultFilters('price_asc'));
  const [showFilter, setShowFilter] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    api.get(`/hotels/${id}`).then((r) => setHotel(r.data)).catch(() => setError('Hotel not found'));
  }, [id]);

  useEffect(() => {
    api.get(`/hotels/${id}/room-types`, {
      params: { ...toParams(filters), checkIn: search.checkIn, checkOut: search.checkOut, guests: search.guests },
    }).then((r) => setTypes(r.data)).catch(() => setError('Cannot load rooms'));
  }, [id, filters, search.checkIn, search.checkOut, search.guests]);

  if (error) return <EmptyState icon="alert-circle-outline" title={error} />;
  if (!hotel) return <Loader />;

  const nFilters = (filters.minPrice ? 1 : 0) + (filters.maxPrice ? 1 : 0) + filters.amenities.length + (filters.sort !== 'price_asc' ? 1 : 0);

  return (
    <ScrollView contentContainerStyle={{ paddingBottom: 32 }}>
      <Stack.Screen options={{ title: hotel.name }} />
      <Gallery images={hotel.images} />

      <View style={{ backgroundColor: theme.card, padding: 16, gap: 10 }}>
        <Text style={{ fontSize: 24, fontWeight: '800', color: theme.text }}>{hotel.name}</Text>
        <Rating avg={hotel.ratingAvg} count={hotel.reviewCount} />
        <InfoRow icon="location-outline">{hotel.address}, {hotel.city}</InfoRow>
        <InfoRow icon="time-outline">{hotel.openingHours} · Check-in {hotel.checkInTime} · Check-out {hotel.checkOutTime}</InfoRow>
        {hotel.phone ? <InfoRow icon="call-outline">{hotel.phone}</InfoRow> : null}
        <InfoRow icon="shield-checkmark-outline">
          {policyText({ allowRefund: hotel.allowRefund !== false, refundPercent: hotel.refundPercent ?? 50 })}
        </InfoRow>
        {user?.role === 'admin' && (
          <Button title="Edit photos" variant="secondary" small icon="images-outline" style={{ alignSelf: 'flex-start' }}
            onPress={() => router.push({ pathname: '/admin/photos', params: { kind: 'hotel', id } })} />
        )}
      </View>

      <View style={{ padding: 16, gap: 10 }}>
        {hotel.description ? (<><SectionTitle>About</SectionTitle><Text style={{ color: theme.text, lineHeight: 21 }}>{hotel.description}</Text></>) : null}
        {hotel.amenities.length > 0 && (
          <>
            <SectionTitle>Amenities</SectionTitle>
            <View style={{ flexDirection: 'row', flexWrap: 'wrap' }}>{hotel.amenities.map((a) => <AmenityTag key={a._id} a={a} />)}</View>
          </>
        )}
      </View>

      <View style={{ paddingHorizontal: 16, gap: 12 }}>
        <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
          <SectionTitle>Rooms</SectionTitle>
          <Button title={nFilters ? `Filters (${nFilters})` : 'Filters'} variant="secondary" small icon="options-outline"
            onPress={() => setShowFilter(true)} />
        </View>
        <SearchControls />

        {types.length === 0 && <EmptyState icon="bed-outline" title="No rooms match" subtitle="Try changing the filters or guest count." />}
        {types.map((t) => {
          const soldOut = t.availableRooms === 0;
          return (
            <TouchableOpacity key={t._id} activeOpacity={0.9} onPress={() => router.push({ pathname: '/room/[id]', params: { id: t._id } })}
              style={{ borderRadius: theme.radius, backgroundColor: theme.card, ...shadow }}>
              <View style={{ borderRadius: theme.radius, overflow: 'hidden', opacity: soldOut ? 0.65 : 1 }}>
                <View>
                  {t.images?.[0]
                    ? <Image source={{ uri: t.images[0] }} style={{ height: 140, backgroundColor: '#e5e7eb' }} />
                    : <View style={{ height: 140, backgroundColor: '#e5e7eb' }} />}
                  {soldOut && (
                    <Text style={{ position: 'absolute', top: 10, left: 10, color: '#fff', backgroundColor: '#111827cc', paddingHorizontal: 10,
                      paddingVertical: 4, borderRadius: 8, fontWeight: '700', overflow: 'hidden' }}>Sold out</Text>
                  )}
                </View>
                <View style={{ padding: 14, gap: 8 }}>
                  <Text style={{ fontSize: 17, fontWeight: '700', color: theme.text }}>{t.name}</Text>
                  <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 14 }}>
                    <Spec icon="people-outline" text={`${t.capacity} guest${t.capacity > 1 ? 's' : ''}`} />
                    <Spec icon="bed-outline" text={`${t.beds} × ${t.bedType}`} />
                    {t.sizeM2 ? <Spec icon="resize-outline" text={`${t.sizeM2} m²`} /> : null}
                  </View>
                  <View style={{ flexDirection: 'row', flexWrap: 'wrap' }}>
                    {t.amenities.slice(0, 3).map((a) => <AmenityTag key={a._id} a={a} />)}
                  </View>
                  <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-end', gap: 8 }}>
                    <Text style={{ flex: 1, fontWeight: '600', color: availabilityColor(t.availableRooms) }}>{availabilityText(t.availableRooms)}</Text>
                    <View style={{ alignItems: 'flex-end' }}>
                      <Text style={{ fontSize: 20, fontWeight: '800', color: theme.primary }}>
                        {money(t.pricePerNight)}<Text style={{ fontSize: 12, color: theme.muted, fontWeight: '500' }}> /night</Text>
                      </Text>
                      {t.totalPrice ? <Text style={{ color: theme.muted, fontSize: 12 }}>{money(t.totalPrice)} for {t.nights} night{t.nights! > 1 ? 's' : ''}</Text> : null}
                    </View>
                  </View>
                </View>
              </View>
            </TouchableOpacity>
          );
        })}
      </View>

      <ReviewsSection hotelId={String(id)} />

      <FilterModal visible={showFilter} scope="room" sorts={SORTS} value={filters}
        onClose={() => setShowFilter(false)} onApply={(f) => { setFilters(f); setShowFilter(false); }} />
    </ScrollView>
  );
}