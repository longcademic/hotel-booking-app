import { useEffect, useState } from 'react';
import { View, Text } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { api } from '../api';
import { Review, ReviewSummary } from '../types';
import { theme } from '../theme';
import { Button, Card, SectionTitle, Stars, prettyDate } from '../ui';

export default function ReviewsSection({ hotelId }: { hotelId: string }) {
  const [summary, setSummary] = useState<ReviewSummary | null>(null);
  const [items, setItems] = useState<Review[]>([]);
  const [page, setPage] = useState(1);
  const [pages, setPages] = useState(1);

  useEffect(() => {
    api.get(`/hotels/${hotelId}/reviews`, { params: { page, limit: 5 } }).then((r) => {
      setSummary(r.data.summary);
      setPages(r.data.pages);
      setItems((prev) => (page === 1 ? r.data.items : [...prev, ...r.data.items]));
    }).catch(() => {});
  }, [hotelId, page]);

  if (!summary) return null;
  return (
    <View style={{ padding: 16, gap: 12 }}>
      <SectionTitle>Guest reviews</SectionTitle>
      {summary.reviewCount === 0 ? <Text style={{ color: theme.muted }}>No reviews yet. Be the first after your stay.</Text> : (
        <>
          <Card style={{ padding: 16, flexDirection: 'row', gap: 16, alignItems: 'center' }}>
            <View style={{ alignItems: 'center' }}>
              <Text style={{ fontSize: 34, fontWeight: '800', color: theme.text }}>{summary.ratingAvg.toFixed(1)}</Text>
              <Ionicons name="star" size={18} color={theme.star} />
              <Text style={{ color: theme.muted, fontSize: 12 }}>{summary.reviewCount} review{summary.reviewCount > 1 ? 's' : ''}</Text>
            </View>
            <View style={{ flex: 1, gap: 4 }}>
              {[5, 4, 3, 2, 1].map((s) => (
                <View key={s} style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                  <Text style={{ width: 12, color: theme.muted }}>{s}</Text>
                  <View style={{ flex: 1, height: 6, backgroundColor: '#eef2f6', borderRadius: 3 }}>
                    <View style={{ width: `${(summary.distribution[s] / summary.reviewCount) * 100}%`, height: 6, backgroundColor: theme.star, borderRadius: 3 }} />
                  </View>
                </View>
              ))}
            </View>
          </Card>

          {items.map((r) => (
            <Card key={r._id} style={{ padding: 14, gap: 4 }}>
              <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
                <Text style={{ fontWeight: '700', color: theme.text }}>{r.user?.name ?? 'Guest'}</Text>
                <Text style={{ color: theme.muted, fontSize: 12 }}>{prettyDate(r.createdAt)}</Text>
              </View>
              <Stars n={r.rating} />
              {r.roomType ? <Text style={{ color: theme.muted, fontSize: 12 }}>Stayed in {r.roomType.name}</Text> : null}
              {r.comment ? <Text style={{ color: theme.text, lineHeight: 20, marginTop: 2 }}>{r.comment}</Text> : null}
            </Card>
          ))}
          {page < pages && <Button title="Show more reviews" variant="secondary" onPress={() => setPage(page + 1)} />}
        </>
      )}
    </View>
  );
}