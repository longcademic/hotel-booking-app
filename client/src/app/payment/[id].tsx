import { useEffect, useState } from 'react';
import { ScrollView, View, Text, TouchableOpacity, Alert } from 'react-native';
import { Stack, useLocalSearchParams, useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { api } from '../../api';
import { useRequireAuth } from '../../useRequireAuth';
import { Booking } from '../../types';
import { theme } from '../../theme';
import { Button, Card, EmptyState, Input, Loader, PriceLine, errMsg, money, prettyDate } from '../../ui';

const fmtCard = (v: string) => v.replace(/\D/g, '').slice(0, 16).replace(/(.{4})/g, '$1 ').trim();
const fmtExp = (v: string) => { const d = v.replace(/\D/g, '').slice(0, 4); return d.length > 2 ? `${d.slice(0, 2)}/${d.slice(2)}` : d; };

export default function Payment() {
  useRequireAuth();
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const [b, setB] = useState<Booking | null>(null);
  const [left, setLeft] = useState(0);
  const [busy, setBusy] = useState(false);
  const [card, setCard] = useState('');
  const [exp, setExp] = useState('');
  const [cvc, setCvc] = useState('');

  useEffect(() => {
    api.get(`/bookings/${id}`).then((r) => { setB(r.data); setLeft(r.data.secondsLeft ?? 0); }).catch(() => {});
  }, [id]);

  useEffect(() => {
    const t = setInterval(() => setLeft((s) => Math.max(0, s - 1)), 1000);
    return () => clearInterval(t);
  }, []);

  const pay = async (simulateFailure = false) => {
    setBusy(true);
    try {
      await api.post(`/bookings/${id}/pay`, { simulateFailure });   // card fields are never sent anywhere
      router.replace({ pathname: '/booking/[id]', params: { id } });
    } catch (e) { Alert.alert('Payment failed', errMsg(e)); }
    finally { setBusy(false); }
  };

  if (!b) return <Loader />;
  const expired = b.status !== 'pending' || left === 0;
  if (expired) return (
    <EmptyState icon="timer-outline" title="This booking is no longer held"
      subtitle="The 30-minute payment window has ended. Please start a new booking."
      action={<Button title="My bookings" small onPress={() => router.replace('/bookings')} />} />
  );

  const valid = card.replace(/\s/g, '').length >= 12 && exp.length === 5 && cvc.length >= 3;
  const mm = String(Math.floor(left / 60)).padStart(2, '0');
  const ss = String(left % 60).padStart(2, '0');
  const urgent = left < 120;

  return (
    <ScrollView contentContainerStyle={{ padding: 16, gap: 14 }} keyboardShouldPersistTaps="handled">
      <Stack.Screen options={{ title: 'Payment' }} />

      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, padding: 12, borderRadius: 12,
        backgroundColor: urgent ? '#fee2e2' : '#fef3c7' }}>
        <Ionicons name="time-outline" size={20} color={urgent ? theme.danger : '#b45309'} />
        <Text style={{ fontWeight: '700', color: urgent ? theme.danger : '#b45309' }}>Your room is held for {mm}:{ss}</Text>
      </View>

      <Card style={{ padding: 16, gap: 8 }}>
        <Text style={{ fontSize: 18, fontWeight: '800', color: theme.text }}>{b.hotel.name}</Text>
        <Text style={{ color: theme.muted }}>{b.roomType.name} · {prettyDate(b.checkIn)} → {prettyDate(b.checkOut)}</Text>
        <View style={{ height: 1, backgroundColor: theme.border, marginVertical: 4 }} />
        <PriceLine label="Total to pay" value={money(b.totalPrice)} bold />
      </Card>

      <Card style={{ padding: 16, gap: 12 }}>
        <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
          <Text style={{ fontSize: 16, fontWeight: '700', color: theme.text }}>Card details</Text>
          <Text style={{ fontSize: 11, fontWeight: '700', color: theme.primaryDark, backgroundColor: theme.primarySoft,
            paddingHorizontal: 8, paddingVertical: 3, borderRadius: 8, overflow: 'hidden' }}>TEST MODE</Text>
        </View>
        <Input icon="card-outline" placeholder="Card number" keyboardType="number-pad" value={card} onChangeText={(v) => setCard(fmtCard(v))} />
        <View style={{ flexDirection: 'row', gap: 10 }}>
          <Input placeholder="MM/YY" keyboardType="number-pad" value={exp} onChangeText={(v) => setExp(fmtExp(v))} box={{ flex: 1 }} />
          <Input placeholder="CVC" keyboardType="number-pad" secureTextEntry maxLength={4} value={cvc} onChangeText={setCvc} box={{ flex: 1 }} />
        </View>
      </Card>

      <Button title={`Pay ${money(b.totalPrice)}`} icon="lock-closed-outline" loading={busy} disabled={!valid} onPress={() => pay()} />
      <TouchableOpacity onPress={() => router.replace('/bookings')} style={{ alignItems: 'center', padding: 6 }}>
        <Text style={{ color: theme.muted }}>Pay later · go to my bookings</Text>
      </TouchableOpacity>

      {__DEV__ && (
        <View style={{ flexDirection: 'row', justifyContent: 'center', gap: 20 }}>
          <TouchableOpacity onPress={() => { setCard('4242 4242 4242 4242'); setExp('12/30'); setCvc('123'); }}>
            <Text style={{ color: theme.muted, fontSize: 12 }}>Fill test card</Text>
          </TouchableOpacity>
          <TouchableOpacity disabled={busy || !valid} onPress={() => pay(true)}>
            <Text style={{ color: theme.muted, fontSize: 12 }}>Simulate decline</Text>
          </TouchableOpacity>
        </View>
      )}
    </ScrollView>
  );
}