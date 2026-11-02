export type Amenity = { _id: string; name: string; icon: string };

export type Hotel = {
  _id: string; name: string; city: string; address: string; description: string; phone?: string;
  openingHours: string; checkInTime: string; checkOutTime: string; images: string[];
  amenities: Amenity[]; ratingAvg: number; reviewCount: number; minPrice?: number; allowRefund?: boolean; refundPercent?: number;
};

export type RoomType = {
  _id: string; hotel: string | { _id: string; name: string; city: string; address: string };
  name: string; description: string; capacity: number; beds: number; bedType: string; sizeM2?: number;
  pricePerNight: number; images: string[]; amenities: Amenity[];
  availableRooms: number | null; nights?: number; totalPrice?: number;
};

export type Booking = {
  _id: string;
  status: 'pending' | 'confirmed' | 'completed' | 'cancelled' | 'refunded';
  hotel: { _id: string; name: string; city: string; address?: string; images?: string[] };
  roomType: { _id: string; name: string };
  room?: { roomNumber: string };
  guests: number; checkIn: string; checkOut: string; nights: number;
  pricePerNight: number; totalPrice: number; specialRequests: string; refundAmount: number;
  secondsLeft?: number;
  cancelInfo?: {
    canCancel: boolean; reason?: string; refundAmount: number;
    remainingNights?: number; spentNights?: number; allowRefund: boolean; refundPercent: number;
  };
};

export type Quote = {
  roomType: { _id: string; name: string; capacity: number };
  hotel: { _id: string; name: string; city: string };
  checkIn: string; checkOut: string; guests: number; nights: number;
  pricePerNight: number; total: number; availableRooms: number;
  refundPolicy: { allowRefund: boolean; refundPercent: number };
};
export type Review = {
  _id: string; rating: number; comment: string; createdAt: string;
  user?: { name: string }; roomType?: { name: string };
};
export type ReviewSummary = {
  ratingAvg: number; reviewCount: number; distribution: Record<string, number>;
};

export type AdminStats = {
  days: number;
  kpi: { reservations: number; revenue: number; completed: number; avgNights: number | null; pending: number; byStatus: Record<string, number> };
  trend: { date: string; confirmed: number; cancelled: number }[];
  mostBooked: { by: 'hotel' | 'roomType'; items: { _id: string; name: string; count: number }[] };
};

export type AdminBooking = {
  _id: string; status: Booking['status'];
  user: { name: string; email: string };
  hotel: { _id: string; name: string };
  roomType: { name: string };
  room: { roomNumber: string };
  guests: number; checkIn: string; checkOut: string; nights: number; totalPrice: number;
  specialRequests: string; refundAmount: number; cancelReason?: string; createdAt: string;
  cancelInfo: { canCancel: boolean; refundAmount: number; reason?: string };
};