import { useEffect, useState } from 'react';
import { ScrollView, Text, Alert, View } from 'react-native';
import { Stack, useLocalSearchParams, useRouter } from 'expo-router';
import { api } from '../api';
import { useSearch } from '../SearchContext';
import { useRequireAuth } from '../useRequireAuth';
import { Quote } from '../types';
import { theme } from '../theme';
import { Button, Card, DateBox, EmptyState, InfoRow, Input, Loader, PriceLine, SectionTitle, errMsg, money, policyText } from '../ui';

export default function Checkout() {
  useRequireAuth();
  const { roomTypeId } = useLocalSearchParams<{ roomTypeId: string }>();
  const router = useRouter();
  const search = useSearch();
  const [quote, setQuote] = useState<Quote | null>(null);
  const [error, setError] = useState('');
  const [requests, setRequests] = useState('');
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    api.post('/bookings/quote', { roomTypeId, checkIn: search.checkIn, checkOut: search.checkOut, guests: search.guests })
      .then((r) => setQuote(r.data)).catch((e) => setError(errMsg(e)));
  }, [roomTypeId]);

  const proceed = async () => {
    setBusy(true);
    try {
      const { data } = await api.post('/bookings', {
        roomTypeId, checkIn: search.checkIn, checkOut: search.checkOut, guests: search.guests, specialRequests: requests,
      });
      router.replace({ pathname: '/payment/[id]', params: { id: data._id } });
    } catch (e) { Alert.alert('Cannot book', errMsg(e)); }
    finally { setBusy(false); }
  };

  if (error) return <EmptyState icon="alert-circle-outline" title="Can't prepare your booking" subtitle={error} />;
  if (!quote) return <Loader />;

  return (
    <ScrollView contentContainerStyle={{ padding: 16, gap: 14 }} keyboardShouldPersistTaps="handled">
      <Stack.Screen options={{ title: 'Review & book' }} />

      <Card style={{ padding: 16, gap: 12 }}>
        <View>
          <Text style={{ fontSize: 20, fontWeight: '800', color: theme.text }}>{quote.hotel.name}</Text>
          <Text style={{ color: theme.muted }}>{quote.roomType.name}</Text>
        </View>
        <View style={{ flexDirection: 'row', gap: 10 }}>
          <DateBox label="Check-in" date={quote.checkIn} />
          <DateBox label="Check-out" date={quote.checkOut} />
        </View>
        <InfoRow icon="people-outline">{quote.guests} guest{quote.guests > 1 ? 's' : ''} · {quote.nights} night{quote.nights > 1 ? 's' : ''}</InfoRow>
      </Card>

      <Card style={{ padding: 16, gap: 8 }}>
        <PriceLine label={`${money(quote.pricePerNight)} × ${quote.nights} night${quote.nights > 1 ? 's' : ''}`} value={money(quote.total)} />
        <View style={{ height: 1, backgroundColor: theme.border, marginVertical: 4 }} />
        <PriceLine label="Total" value={money(quote.total)} bold />
      </Card>

      <View style={{ gap: 8 }}>
        <SectionTitle>Special requests</SectionTitle>
        <Input multiline maxLength={500} value={requests} onChangeText={setRequests} placeholder="Add a note for the hotel (optional)" />
      </View>

      <InfoRow icon="shield-checkmark-outline">{policyText(quote.refundPolicy)}</InfoRow>
      <InfoRow icon="time-outline">Your room is held for 30 minutes while you complete payment.</InfoRow>
      {quote.availableRooms === 0 && <Text style={{ color: theme.danger, fontWeight: '600' }}>Sold out for these dates.</Text>}

      <Button title="Continue to payment" icon="card-outline" loading={busy} disabled={quote.availableRooms === 0} onPress={proceed} />
    </ScrollView>
  );
}