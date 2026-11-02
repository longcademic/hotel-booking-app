import * as ImagePicker from 'expo-image-picker';
import { api } from './api';

// Pick one photo from the gallery, upload it through our server, return its URL (null if cancelled)
export async function pickAndUpload(): Promise<string | null> {
  const res = await ImagePicker.launchImageLibraryAsync({ mediaTypes: ['images'], quality: 0.8 });
  if (res.canceled) return null;

  const asset = res.assets[0];
  const form = new FormData();
  form.append('image', {
    uri: asset.uri,
    name: asset.fileName ?? 'photo.jpg',
    type: asset.mimeType ?? 'image/jpeg',
  } as any);

  const { data } = await api.post('/admin/uploads', form, {
    headers: { 'Content-Type': 'multipart/form-data' },
    timeout: 60000,
  });
  return data.url;
}