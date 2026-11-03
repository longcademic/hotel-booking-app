import { useEffect, useState } from 'react';
import { Modal, View, Text, ScrollView, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { api } from '../api';
import { Amenity } from '../types';
import { theme } from '../theme';
import { Button, Chip, Input } from '../ui';

export type Filters = { city: string; minPrice: string; maxPrice: string; sort: string; amenities: string[] };
export const defaultFilters = (sort: string): Filters => ({ city: '', minPrice: '', maxPrice: '', sort, amenities: [] });
export const toParams = (f: Filters) => ({
  city: f.city.trim() || undefined,
  minPrice: f.minPrice || undefined,
  maxPrice: f.maxPrice || undefined,
  sort: f.sort,
  amenities: f.amenities.length ? f.amenities.join(',') : undefined,
});

type Props = {
  visible: boolean; scope: 'hotel' | 'room';
  sorts: { value: string; label: string }[];
  value: Filters; onClose: () => void; onApply: (f: Filters) => void;
};

const Title = ({ children }: { children: string }) => (
  <Text style={{ fontSize: 16, fontWeight: '700', color: theme.text, marginTop: 20, marginBottom: 10 }}>{children}</Text>
);

export default function FilterModal({ visible, scope, sorts, value, onClose, onApply }: Props) {
  const insets = useSafeAreaInsets();
  const [draft, setDraft] = useState(value);
  const [all, setAll] = useState<Amenity[]>([]);
  const [cities, setCities] = useState<string[]>([]);

  useEffect(() => { if (visible) setDraft(value); }, [visible]);
  useEffect(() => {
    api.get('/amenities', { params: { scope } }).then((r) => setAll(r.data)).catch(() => {});
  }, [scope]);
  useEffect(() => {
    if (!visible || scope !== 'hotel') return;
    api.get<string[]>('/cities').then((r) => setCities(r.data)).catch(() => setCities([]));
  }, [scope, visible]);

  const toggle = (id: string) =>
    setDraft((d) => ({ ...d, amenities: d.amenities.includes(id) ? d.amenities.filter((x) => x !== id) : [...d.amenities, id] }));
  const digits = (t: string) => t.replace(/\D/g, '');

  return (
    <Modal visible={visible} animationType="slide" onRequestClose={onClose}>
      <View style={{ flex: 1, backgroundColor: theme.bg }}>
        <View style={{ paddingTop: insets.top + 12, paddingHorizontal: 20, paddingBottom: 12, backgroundColor: theme.card,
          flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
          <Text style={{ fontSize: 20, fontWeight: '800', color: theme.text }}>Filters</Text>
          <TouchableOpacity onPress={onClose} hitSlop={10}><Ionicons name="close" size={26} color={theme.text} /></TouchableOpacity>
        </View>

        <ScrollView contentContainerStyle={{ paddingHorizontal: 20, paddingBottom: 24 }}>
          <Title>Sort by</Title>
          <View style={{ flexDirection: 'row', flexWrap: 'wrap' }}>
            {sorts.map((s) => (
              <Chip key={s.value} label={s.label} active={draft.sort === s.value} onPress={() => setDraft({ ...draft, sort: s.value })} />
            ))}
          </View>

          {scope === 'hotel' && (
            <>
              <Title>City</Title>
              <View style={{ flexDirection: 'row', flexWrap: 'wrap' }}>
                <Chip label="Any city" active={!draft.city} onPress={() => setDraft((d) => ({ ...d, city: '' }))} />
                {cities.map((city) => (
                  <Chip key={city} label={city} active={draft.city === city}
                    onPress={() => setDraft((d) => ({ ...d, city: d.city === city ? '' : city }))} />
                ))}
              </View>
            </>
          )}

          <Title>Price per night</Title>
          <View style={{ flexDirection: 'row', gap: 10 }}>
            <Input icon="cash-outline" placeholder="Min" keyboardType="numeric" value={draft.minPrice}
              onChangeText={(t) => setDraft({ ...draft, minPrice: digits(t) })} box={{ flex: 1 }} />
            <Input icon="cash-outline" placeholder="Max" keyboardType="numeric" value={draft.maxPrice}
              onChangeText={(t) => setDraft({ ...draft, maxPrice: digits(t) })} box={{ flex: 1 }} />
          </View>

          <Title>Amenities</Title>
          <View style={{ flexDirection: 'row', flexWrap: 'wrap' }}>
            {all.map((a) => <Chip key={a._id} label={a.name} active={draft.amenities.includes(a._id)} onPress={() => toggle(a._id)} />)}
          </View>
        </ScrollView>

        <View style={{ flexDirection: 'row', gap: 10, padding: 16, paddingBottom: 16 + insets.bottom, backgroundColor: theme.card,
          borderTopWidth: 1, borderColor: theme.border }}>
          <Button title="Reset" variant="secondary" style={{ flex: 1 }} onPress={() => setDraft(defaultFilters(sorts[0].value))} />
          <Button title="Show results" style={{ flex: 2 }} onPress={() => onApply(draft)} />
        </View>
      </View>
    </Modal>
  );
}
