import { useState } from 'react';
import { Dimensions, Image, ScrollView, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

export default function Gallery({ images, height = 260 }: { images?: string[]; height?: number }) {
  const W = Dimensions.get('window').width;
  const [page, setPage] = useState(0);

  if (!images?.length)
    return (
      <View style={{ height, backgroundColor: '#e5e7eb', alignItems: 'center', justifyContent: 'center' }}>
        <Ionicons name="image-outline" size={44} color="#9ca3af" />
      </View>
    );

  return (
    <View>
      <ScrollView horizontal pagingEnabled showsHorizontalScrollIndicator={false} scrollEventThrottle={16}
        onScroll={(e) => setPage(Math.round(e.nativeEvent.contentOffset.x / W))}>
        {images.map((u, i) => <Image key={`${u}-${i}`} source={{ uri: u }} style={{ width: W, height, backgroundColor: '#e5e7eb' }} />)}
      </ScrollView>
      {images.length > 1 && (
        <View style={{ position: 'absolute', bottom: 12, alignSelf: 'center', flexDirection: 'row', gap: 6 }}>
          {images.map((_, i) => (
            <View key={i} style={{ width: i === page ? 18 : 6, height: 6, borderRadius: 3, backgroundColor: i === page ? '#fff' : '#ffffff99' }} />
          ))}
        </View>
      )}
    </View>
  );
}