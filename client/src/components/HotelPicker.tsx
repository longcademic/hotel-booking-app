import { useEffect, useState } from 'react';
import { ScrollView } from 'react-native';
import { api } from '../api';
import { Chip } from '../ui';

export default function HotelPicker({ value, onChange, allowAll = true }:
  { value?: string; onChange: (id?: string) => void; allowAll?: boolean }) {
  const [hotels, setHotels] = useState<{ _id: string; name: string }[]>([]);
  useEffect(() => { api.get('/admin/hotels').then((r) => setHotels(r.data)).catch(() => {}); }, []);

  return (
    <ScrollView horizontal showsHorizontalScrollIndicator={false}>
      {allowAll && <Chip label="All hotels" active={!value} onPress={() => onChange(undefined)} />}
              {hotels.map((h) => <Chip key={h._id} label={h.name} active={value === h._id} onPress={() => onChange(h._id)} />)}
    </ScrollView>
  );
}