import { useEffect, useState } from 'react';
import { ScrollView, View, Text } from 'react-native';
import { Stack, useLocalSearchParams, useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { api } from '../../api';
import { useAuth } from '../../AuthContext';
import { useSearch } from '../../SearchContext';
import { RoomType } from '../../types';
import { theme } from '../../theme';
import { AmenityTag, Button, Card, IconName, Loader, PriceLine, SectionTitle, availabilityColor, availabilityText, money } from '../../ui';
import Gallery from '../../components/Gallery';
import SearchControls from '../../components/SearchControls';

const Tile = ({ icon, value, label }: { icon: IconName; value: string; label: string }) => (
  <View style={{ flex: 1, backgroundColor: theme.card, borderRadius: 12, padding: 12, alignItems: 'center', gap: 2 }}>
    <Ionicons name={icon} size={22} color={theme.primary} />
    <Text style={{ fontWeight: '700', color: theme.text }}>{value}</Text>
    <Text style={{ color: theme.muted, fontSize: 12 }}>{label}</Text>
  </View>
);

export default function RoomDetail() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { user } = useAuth();
  const search = useSearch();
  const [room, setRoom] = useState<RoomType | null>(null);

  useEffect(() => {
    api.get(`/room-types/${id}`, { params: { checkIn: search.checkIn, checkOut: search.checkOut } })
      .then((r) => setRoom(r.data)).catch(() => {});
  }, [id, search.checkIn, search.checkOut]);

  if (!room) return <Loader />;
  const hotel = typeof room.hotel === 'string' ? null : room.hotel;
  const hasDates = !!search.checkIn && !!search.checkOut;
  const soldOut = room.availableRooms === 0;
  const canBook = hasDates && !soldOut;

  const onBook = () => {
    if (!user) return router.push('/login');
    router.push({ pathname: '/checkout', params: { roomTypeId: room._id } });
  };

  return (
    <View style={{ flex: 1 }}>
      <Stack.Screen options={{ title: room.name }} />
      <ScrollView contentContainerStyle={{ paddingBottom: 24 }}>
        <Gallery images={room.images} />
        <View style={{ padding: 16, gap: 14 }}>
          <View style={{ gap: 2 }}>
            <Text style={{ fontSize: 24, fontWeight: '800', color: theme.text }}>{room.name}</Text>
            {hotel && <Text style={{ color: theme.muted }}>{hotel.name} · {hotel.city}</Text>}
          </View>

          <View style={{ flexDirection: 'row', gap: 10 }}>
            <Tile icon="people-outline" value={String(room.capacity)} label="Guests" />
            <Tile icon="bed-outline" value={`${room.beds} × ${room.bedType}`} label="Beds" />
            {room.sizeM2 ? <Tile icon="resize-outline" value={`${room.sizeM2} m²`} label="Size" /> : null}
          </View>

          {room.description ? <Text style={{ color: theme.text, lineHeight: 21 }}>{room.description}</Text> : null}
          {room.amenities.length > 0 && (
            <>
              <SectionTitle>Room features</SectionTitle>
              <View style={{ flexDirection: 'row', flexWrap: 'wrap' }}>{room.amenities.map((a) => <AmenityTag key={a._id} a={a} />)}</View>
            </>
          )}

          <SectionTitle>Your stay</SectionTitle>
          <SearchControls />
          <Card style={{ padding: 16, gap: 8 }}>
            <PriceLine label="Price per night" value={money(room.pricePerNight)} />
            {room.totalPrice ? (
              <>
                <PriceLine label={`${room.nights} night${room.nights! > 1 ? 's' : ''}`} value={money(room.totalPrice)} />
                <PriceLine label="Total" value={money(room.totalPrice)} bold />
              </>
            ) : null}
            <Text style={{ fontWeight: '600', color: availabilityColor(room.availableRooms) }}>{availabilityText(room.availableRooms)}</Text>
          </Card>

          {user?.role === 'admin' && (
            <Button title="Edit photos" variant="secondary" small icon="images-outline" style={{ alignSelf: 'flex-start' }}
              onPress={() => router.push({ pathname: '/admin/photos', params: { kind: 'room-type', id: room._id } })} />
          )}
        </View>
      </ScrollView>

      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12, padding: 16, paddingBottom: 16 + insets.bottom,
        backgroundColor: theme.card, borderTopWidth: 1, borderColor: theme.border }}>
        <View style={{ flex: 1 }}>
          <Text style={{ fontSize: 20, fontWeight: '800', color: theme.text }}>{money(room.totalPrice ?? room.pricePerNight)}</Text>
          <Text style={{ color: theme.muted }}>{room.totalPrice ? `${room.nights} night${room.nights! > 1 ? 's' : ''}` : 'per night'}</Text>
        </View>
        <Button style={{ flex: 1 }} onPress={onBook} disabled={!!user && !canBook}
          title={!user ? 'Sign in to book' : soldOut ? 'Sold out' : hasDates ? 'Book now' : 'Select dates'} />
      </View>
    </View>
  );
}