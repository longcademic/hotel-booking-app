import { useState } from 'react';
import { View, Text, Image, ScrollView, TouchableOpacity, Alert } from 'react-native';
import { pickAndUpload } from '../upload';

const MAX = 8;

export default function ImageEditor({ urls, onChange }: { urls: string[]; onChange: (u: string[]) => void }) {
  const [busy, setBusy] = useState(false);

  const add = async () => {
    setBusy(true);
    try {
      const url = await pickAndUpload();
      if (url) onChange([...urls, url]);
    } catch (e: any) {
      Alert.alert('Upload failed', e?.response?.data?.message ?? e?.message ?? 'Network error');
    } finally { setBusy(false); }
  };

  return (
    <View style={{ gap: 8 }}>
      <Text style={{ color: '#666' }}>The first photo is the cover. Max {MAX}.</Text>
      <ScrollView horizontal>
        {urls.map((u, i) => (
          <View key={u} style={{ marginRight: 10 }}>
            <Image source={{ uri: u }} style={{ width: 120, height: 90, borderRadius: 8 }} />
            <Text style={{ position: 'absolute', left: 4, top: 4, color: '#fff', backgroundColor: '#0008', paddingHorizontal: 5, borderRadius: 4 }}>
              {i === 0 ? 'Cover' : i + 1}
            </Text>
            <TouchableOpacity onPress={() => onChange(urls.filter((x) => x !== u))}
              style={{ position: 'absolute', right: 4, top: 4, backgroundColor: '#c62828', borderRadius: 10, width: 20, height: 20, alignItems: 'center' }}>
              <Text style={{ color: '#fff' }}>✕</Text>
            </TouchableOpacity>
          </View>
        ))}
        {urls.length < MAX && (
          <TouchableOpacity onPress={add} disabled={busy}
            style={{ width: 120, height: 90, borderRadius: 8, borderWidth: 1, borderStyle: 'dashed', borderColor: '#999', alignItems: 'center', justifyContent: 'center' }}>
            <Text>{busy ? 'Uploading…' : '+ Add photo'}</Text>
          </TouchableOpacity>
        )}
      </ScrollView>
    </View>
  );
}