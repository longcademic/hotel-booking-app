import { useEffect, useState } from 'react';
import { View, Text } from 'react-native';
import { api } from '../api';
import { Amenity } from '../types';
import { Chip } from '../ui';

export default function AmenityPicker({ scope, value, onChange }:
  { scope: 'hotel' | 'room'; value: string[]; onChange: (ids: string[]) => void }) {
  const [all, setAll] = useState<Amenity[]>([]);
  useEffect(() => { api.get('/amenities', { params: { scope } }).then((r) => setAll(r.data)).catch(() => {}); }, [scope]);

  return (
    <View style={{ gap: 4 }}>
      <Text style={{ fontWeight: '600' }}>Amenities</Text>
      <View style={{ flexDirection: 'row', flexWrap: 'wrap' }}>
        {all.map((a) => (
          <Chip key={a._id} label={a.name} active={value.includes(a._id)}
            onPress={() => onChange(value.includes(a._id) ? value.filter((x) => x !== a._id) : [...value, a._id])} />
        ))}
      </View>
    </View>
  );
}