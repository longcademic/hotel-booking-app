import { useCallback, useState } from 'react';
import { ScrollView, View, Text, Image, Alert } from 'react-native';
import { Stack, useFocusEffect, useLocalSearchParams, useRouter } from 'expo-router';
import { api } from '../../api';
import { useRequireAuth } from '../../useRequireAuth';
import { Booking, Review } from '../../types';
import { theme } from '../../theme';
import { Button, Card, DateBox, EmptyState, InfoRow, Loader, PriceLine, Stars, StatusBadge, errMsg, money } from '../../ui';

export default function BookingDetail() {
  const { user } = useRequireAuth();
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const [b, setB] = useState<Booking | null>(null);
  const [review, setReview] = useState<Review | null>(null);
  const [error, setError] = useState('');

  const load = useCallback(() => {
    if (!user) return;
    setError('');
    api.get(`/bookings/${id}`).then((r) => {
      setB(r.data);
      if (r.data.status === 'completed')
        api.get(`/reviews/booking/${id}`).then((x) => setReview(x.data)).catch(() => setReview(null));
    }).catch((e) => setError(errMsg(e)));
  }, [id, user]);
  useFocusEffect(load);

  const doCancel = async () => {
    try {
      const { data } = await api.post(`/bookings/${id}/cancel`);
      Alert.alert('Booking cancelled', data.refundAmount > 0 ? `A refund of ${money(data.refundAmount)} has been issued.` : 'No refund applies to this cancellation.');
      load();
    } catch (e) { Alert.alert('Cannot cancel', errMsg(e)); }
  };

  const confirmCancel = () => {
    const c = b!.cancelInfo!;
    const text = b!.status === 'pending' ? 'Release this unpaid booking?'
      : !c.allowRefund ? 'This hotel does not refund cancellations, so you will not get any money back.'
      : `${c.spentNights} night(s) used, ${c.remainingNights} remaining.\nYou will be refunded ${money(c.refundAmount)} (${c.refundPercent}% of the remaining nights).`;
    Alert.alert('Cancel booking?', text, [{ text: 'Keep booking' }, { text: 'Cancel booking', style: 'destructive', onPress: doCancel }]);
  };

  if (error) return <EmptyState icon="alert-circle-outline" title="Can't load this booking" subtitle={error} />;
  if (!b) return <Loader />;

  return (
    <ScrollView contentContainerStyle={{ paddingBottom: 32 }}>
      <Stack.Screen options={{ title: 'Booking details' }} />
      {b.hotel.images?.[0] ? <Image source={{ uri: b.hotel.images[0] }} style={{ height: 170, backgroundColor: '#e5e7eb' }} /> : null}

      <View style={{ padding: 16, gap: 14 }}>
        <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
          <StatusBadge status={b.status} />
          <Text style={{ color: theme.muted }}>Ref #{b._id.slice(-6).toUpperCase()}</Text>
        </View>

        <View style={{ gap: 6 }}>
          <Text style={{ fontSize: 22, fontWeight: '800', color: theme.text }}>{b.hotel.name}</Text>
          <InfoRow icon="location-outline">{b.hotel.address}, {b.hotel.city}</InfoRow>
        </View>

        <Card style={{ padding: 16, gap: 12 }}>
          <View style={{ flexDirection: 'row', gap: 10 }}>
            <DateBox label="Check-in" date={b.checkIn} />
            <DateBox label="Check-out" date={b.checkOut} />
          </View>
          <InfoRow icon="bed-outline">{b.roomType.name}{b.room && b.status !== 'pending' ? ` · Room ${b.room.roomNumber}` : ''}</InfoRow>
          <InfoRow icon="people-outline">{b.guests} guest{b.guests > 1 ? 's' : ''} · {b.nights} night{b.nights > 1 ? 's' : ''}</InfoRow>
        </Card>

        <Card style={{ padding: 16, gap: 8 }}>
          <PriceLine label={`${money(b.pricePerNight)} × ${b.nights} night${b.nights > 1 ? 's' : ''}`} value={money(b.totalPrice)} />
          {b.refundAmount > 0 && <PriceLine label="Refunded" value={`−${money(b.refundAmount)}`} />}
        </Card>

        {b.specialRequests ? (
          <Card style={{ padding: 16, gap: 4 }}>
            <Text style={{ fontWeight: '700', color: theme.text }}>Your request</Text>
            <Text style={{ color: theme.muted }}>{b.specialRequests}</Text>
          </Card>
        ) : null}

        {b.status === 'completed' && (review ? (
          <Card style={{ padding: 16, gap: 6 }}>
            <Text style={{ fontWeight: '700', color: theme.text }}>Your review</Text>
            <Stars n={review.rating} size={20} />
            {review.comment ? <Text style={{ color: theme.muted }}>{review.comment}</Text> : null}
          </Card>
        ) : (
          <Button title="Rate your stay" icon="star-outline" onPress={() => router.push({ pathname: '/review/[bookingId]', params: { bookingId: id } })} />
        ))}

        {b.status === 'pending' && (b.secondsLeft ?? 0) > 0 && (
          <Button title="Pay now" icon="card-outline" onPress={() => router.push({ pathname: '/payment/[id]', params: { id } })} />
        )}
        {b.cancelInfo?.canCancel && <Button title="Cancel booking" variant="danger" onPress={confirmCancel} />}
      </View>
    </ScrollView>
  );
}