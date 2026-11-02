import { useEffect, useState } from 'react';
import { Modal, View, Text, TouchableOpacity } from 'react-native';
import { Calendar, DateData } from 'react-native-calendars';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { theme as app } from '../theme';
import { Button, prettyDate } from '../ui';

const DAY = 86400000;
const iso = (t: number) => new Date(t).toISOString().slice(0, 10);
const utc = (d: string) => new Date(`${d}T00:00:00Z`).getTime();
const localToday = () => new Date(Date.now() - new Date().getTimezoneOffset() * 60000).toISOString().slice(0, 10);

type Props = {
  visible: boolean; checkIn?: string; checkOut?: string;
  onClose: () => void; onApply: (a?: string, b?: string) => void;
};

const Slot = ({ label, date }: { label: string; date?: string }) => (
  <View style={{ flex: 1, backgroundColor: app.card, borderRadius: 12, padding: 12, borderWidth: 1, borderColor: app.border }}>
    <Text style={{ color: app.muted, fontSize: 12 }}>{label}</Text>
    <Text style={{ fontWeight: '700', fontSize: 15, color: date ? app.text : app.muted }}>{date ? prettyDate(date) : 'Select'}</Text>
  </View>
);

export default function DateRangeModal({ visible, checkIn, checkOut, onClose, onApply }: Props) {
  const insets = useSafeAreaInsets();
  const [start, setStart] = useState(checkIn);
  const [end, setEnd] = useState(checkOut);
  useEffect(() => { if (visible) { setStart(checkIn); setEnd(checkOut); } }, [visible]);

  const onDay = (d: DateData) => {
    if (!start || end) { setStart(d.dateString); setEnd(undefined); }
    else if (d.dateString > start) setEnd(d.dateString);
    else setStart(d.dateString);
  };

  const marked: Record<string, any> = {};
  if (start) marked[start] = { startingDay: true, endingDay: !end, color: app.primary, textColor: '#fff' };
  if (start && end) {
    for (let t = utc(start) + DAY; t < utc(end); t += DAY) marked[iso(t)] = { color: app.primarySoft, textColor: app.primaryDark };
    marked[end] = { endingDay: true, color: app.primary, textColor: '#fff' };
  }
  const nights = start && end ? Math.round((utc(end) - utc(start)) / DAY) : 0;

  return (
    <Modal visible={visible} animationType="slide" onRequestClose={onClose}>
      <View style={{ flex: 1, backgroundColor: app.bg }}>
        <View style={{ paddingTop: insets.top + 12, paddingHorizontal: 20, paddingBottom: 12, backgroundColor: app.card,
          flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
          <Text style={{ fontSize: 20, fontWeight: '800', color: app.text }}>Select dates</Text>
          <TouchableOpacity onPress={onClose} hitSlop={10}><Ionicons name="close" size={26} color={app.text} /></TouchableOpacity>
        </View>

        <View style={{ padding: 16, gap: 14 }}>
          <View style={{ flexDirection: 'row', gap: 10 }}>
            <Slot label="Check-in" date={start} />
            <Slot label="Check-out" date={end} />
          </View>
          <View style={{ backgroundColor: app.card, borderRadius: app.radius, overflow: 'hidden' }}>
            <Calendar minDate={localToday()} markingType="period" markedDates={marked} onDayPress={onDay}
              theme={{ todayTextColor: app.primary, arrowColor: app.primary, textDayFontWeight: '500', textMonthFontWeight: '700' }} />
          </View>
          <Text style={{ textAlign: 'center', color: app.muted }}>
            {start && end ? `${nights} night${nights > 1 ? 's' : ''}` : 'Tap your check-in day, then your check-out day'}
          </Text>
        </View>

        <View style={{ flexDirection: 'row', gap: 10, padding: 16, paddingBottom: 16 + insets.bottom, marginTop: 'auto',
          backgroundColor: app.card, borderTopWidth: 1, borderColor: app.border }}>
          <Button title="Clear" variant="secondary" style={{ flex: 1 }} onPress={() => onApply(undefined, undefined)} />
          <Button title="Apply" style={{ flex: 2 }} disabled={!(start && end)} onPress={() => onApply(start, end)} />
        </View>
      </View>
    </Modal>
  );
}