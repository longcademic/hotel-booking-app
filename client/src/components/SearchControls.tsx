import { useState } from 'react';
import { View, Text, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useSearch } from '../SearchContext';
import { theme } from '../theme';
import { shortDate } from '../ui';
import DateRangeModal from './DateRangeModal';

export default function SearchControls() {
  const s = useSearch();
  const [open, setOpen] = useState(false);
  const pill = { flexDirection: 'row', alignItems: 'center', gap: 6, backgroundColor: '#fff', borderRadius: 12,
    borderWidth: 1, borderColor: theme.border, paddingHorizontal: 12, paddingVertical: 10 } as const;

  return (
    <View style={{ flexDirection: 'row', gap: 8 }}>
      <TouchableOpacity onPress={() => setOpen(true)} activeOpacity={0.8} style={[pill, { flex: 1 }]}>
        <Ionicons name="calendar-outline" size={18} color={theme.primary} />
        <Text style={{ fontWeight: '600', color: s.checkIn ? theme.text : theme.muted }}>
          {s.checkIn && s.checkOut ? `${shortDate(s.checkIn)} – ${shortDate(s.checkOut)}` : 'Add dates'}
        </Text>
      </TouchableOpacity>

      <View style={[pill, { paddingVertical: 4, paddingHorizontal: 6 }]}>
        <TouchableOpacity hitSlop={8} style={{ padding: 6 }} onPress={() => s.update({ guests: Math.max(1, s.guests - 1) })}>
          <Ionicons name="remove" size={18} color={theme.primary} />
        </TouchableOpacity>
        <Ionicons name="people-outline" size={16} color={theme.muted} />
        <Text style={{ fontWeight: '700', minWidth: 14, textAlign: 'center' }}>{s.guests}</Text>
        <TouchableOpacity hitSlop={8} style={{ padding: 6 }} onPress={() => s.update({ guests: Math.min(10, s.guests + 1) })}>
          <Ionicons name="add" size={18} color={theme.primary} />
        </TouchableOpacity>
      </View>

      <DateRangeModal visible={open} checkIn={s.checkIn} checkOut={s.checkOut}
        onClose={() => setOpen(false)} onApply={(a, b) => { s.update({ checkIn: a, checkOut: b }); setOpen(false); }} />
    </View>
  );
}