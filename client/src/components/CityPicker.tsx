import { useEffect, useMemo, useState } from 'react';
import { Modal, ScrollView, Text, TouchableOpacity, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { api } from '../api';
import { theme } from '../theme';
import { Chip } from '../ui';

const CITY_NAMES = [
  'Ho Chi Minh City', 'Da Lat', 'Nha Trang', 'Da Nang', 'Hanoi', 'Hoi An', 'Hue',
  'Phu Quoc', 'Vung Tau', 'Can Tho', 'Quy Nhon', 'Sa Pa', 'Hai Phong', 'Ninh Binh',
];

type Props = {
  value: string;
  onChange: (city: string) => void;
  label?: string;
  placeholder?: string;
  allowAny?: boolean;
  variant?: 'field' | 'inline';
};

export default function CityPicker({ value, onChange, label, placeholder = 'Select a city', allowAny = false, variant = 'field' }: Props) {
  const insets = useSafeAreaInsets();
  const [open, setOpen] = useState(false);
  const [serverCities, setServerCities] = useState<string[]>([]);

  useEffect(() => {
    api.get<string[]>('/cities').then((r) => setServerCities(r.data)).catch(() => {});
  }, []);

  const cities = useMemo(() => {
    const seen = new Set<string>();
    return [...CITY_NAMES, ...serverCities, value]
      .map((city) => city.trim())
      .filter((city) => {
        const key = city.toLocaleLowerCase();
        if (!city || seen.has(key)) return false;
        seen.add(key);
        return true;
      });
  }, [serverCities, value]);

  const select = (city: string) => {
    onChange(city);
    setOpen(false);
  };

  if (variant === 'inline') {
    return (
      <View style={{ flexDirection: 'row', flexWrap: 'wrap' }}>
        {allowAny && <Chip label="Any city" active={!value} onPress={() => onChange('')} />}
        {cities.map((city) => (
          <Chip key={city} label={city} active={value === city} onPress={() => onChange(value === city ? '' : city)} />
        ))}
      </View>
    );
  }

  return (
    <View style={{ gap: 6 }}>
      {label ? <Text style={{ fontWeight: '600', color: theme.text }}>{label}</Text> : null}
      <TouchableOpacity onPress={() => setOpen(true)} activeOpacity={0.8}
        style={{ flexDirection: 'row', alignItems: 'center', gap: 8, backgroundColor: '#fff', borderWidth: 1,
          borderColor: theme.border, borderRadius: 12, paddingHorizontal: 12, paddingVertical: 13 }}>
        <Ionicons name="location-outline" size={18} color={theme.muted} />
        <Text style={{ flex: 1, fontSize: 15, color: value ? theme.text : '#9ca3af' }}>{value || placeholder}</Text>
        <Ionicons name="chevron-down" size={18} color={theme.muted} />
      </TouchableOpacity>

      <Modal visible={open} animationType="slide" onRequestClose={() => setOpen(false)}>
        <View style={{ flex: 1, backgroundColor: theme.bg }}>
          <View style={{ paddingTop: insets.top + 12, paddingHorizontal: 20, paddingBottom: 12, backgroundColor: theme.card,
            flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
            <Text style={{ fontSize: 20, fontWeight: '800', color: theme.text }}>Select a city</Text>
            <TouchableOpacity onPress={() => setOpen(false)} hitSlop={10}>
              <Ionicons name="close" size={26} color={theme.text} />
            </TouchableOpacity>
          </View>
          <ScrollView contentContainerStyle={{ padding: 16, paddingBottom: 24 }}>
            {allowAny && <CityOption label="Any city" selected={!value} onPress={() => select('')} />}
            {cities.map((city) => <CityOption key={city} label={city} selected={value === city} onPress={() => select(city)} />)}
          </ScrollView>
        </View>
      </Modal>
    </View>
  );
}

function CityOption({ label, selected, onPress }: { label: string; selected: boolean; onPress: () => void }) {
  return (
    <TouchableOpacity onPress={onPress} activeOpacity={0.75}
      style={{ minHeight: 52, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
        paddingHorizontal: 14, marginBottom: 8, borderRadius: 12, backgroundColor: theme.card,
        borderWidth: 1, borderColor: selected ? theme.primary : theme.border }}>
      <Text style={{ fontSize: 15, fontWeight: selected ? '700' : '500', color: selected ? theme.primaryDark : theme.text }}>{label}</Text>
      {selected ? <Ionicons name="checkmark-circle" size={20} color={theme.primary} /> : null}
    </TouchableOpacity>
  );
}
