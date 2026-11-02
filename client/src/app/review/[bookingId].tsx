import { useState } from 'react';
import { ScrollView, View, Text, TouchableOpacity, Alert } from 'react-native';
import { Stack, useLocalSearchParams, useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { api } from '../../api';
import { useRequireAuth } from '../../useRequireAuth';
import { theme } from '../../theme';
import { Button, Input, errMsg } from '../../ui';

const LABELS = ['', 'Poor', 'Fair', 'Good', 'Very good', 'Excellent'];

export default function WriteReview() {
  useRequireAuth();
  const { bookingId } = useLocalSearchParams<{ bookingId: string }>();
  const router = useRouter();
  const [rating, setRating] = useState(0);
  const [comment, setComment] = useState('');
  const [busy, setBusy] = useState(false);

  const submit = async () => {
    setBusy(true);
    try {
      await api.post('/reviews', { bookingId, rating, comment });
      Alert.alert('Thank you!', 'Your review was posted.', [{ text: 'OK', onPress: () => router.back() }]);
    } catch (e) { Alert.alert('Cannot post review', errMsg(e)); }
    finally { setBusy(false); }
  };

  return (
    <ScrollView contentContainerStyle={{ padding: 16, gap: 16 }} keyboardShouldPersistTaps="handled">
      <Stack.Screen options={{ title: 'Rate your stay' }} />
      <View style={{ alignItems: 'center', gap: 8, paddingVertical: 12 }}>
        <Text style={{ fontSize: 20, fontWeight: '800', color: theme.text }}>How was your stay?</Text>
        <View style={{ flexDirection: 'row', gap: 4 }}>
          {[1, 2, 3, 4, 5].map((n) => (
            <TouchableOpacity key={n} onPress={() => setRating(n)} hitSlop={6}>
              <Ionicons name={n <= rating ? 'star' : 'star-outline'} size={42} color={theme.star} />
            </TouchableOpacity>
          ))}
        </View>
        <Text style={{ height: 20, fontWeight: '600', color: theme.muted }}>{LABELS[rating]}</Text>
      </View>
      <Input multiline maxLength={1000} value={comment} onChangeText={setComment} placeholder="Share more about your experience (optional)" />
      <Text style={{ color: theme.muted, textAlign: 'center' }}>Reviews can't be edited after posting.</Text>
      <Button title="Post review" loading={busy} disabled={rating === 0} onPress={submit} />
    </ScrollView>
  );
}