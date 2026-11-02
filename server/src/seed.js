require('dotenv').config();
const mongoose = require('mongoose');
const connectDB = require('./config/db');
const User = require('./models/User');
const Amenity = require('./models/Amenity');
const Hotel = require('./models/Hotel');
const RoomType = require('./models/RoomType');
const { addRooms } = require('./utils/rooms');

const img = (seed) => `https://picsum.photos/seed/${seed}/800/500`;

const hotelAmenities = [
  ['Free Wi-Fi', 'wifi'], ['Free Parking', 'car'], ['Breakfast Included', 'cafe'],
  ['Lunch Included', 'restaurant'], ['Dinner Included', 'restaurant'], ['Spa', 'flower'],
  ['Indoor Pool', 'water'], ['Outdoor Pool', 'water'], ['Gym', 'barbell'],
  ['24h Front Desk', 'time'], ['Airport Shuttle', 'bus'], ['Restaurant', 'restaurant'],
  ['Bar', 'wine'], ['Pet Friendly', 'paw'], ['Laundry Service', 'shirt'],
  ['Kids Club', 'people'], ['EV Charging', 'flash'], ['Meeting Rooms', 'business'],
  ['Wheelchair Accessible', 'accessibility'], ['Private Beach', 'sunny'],
];
const roomAmenities = [
  ['Air Conditioning', 'snow'], ['Free Wi-Fi', 'wifi'], ['Free Cleaning Service', 'sparkles'],
  ['Extra Large', 'resize'], ['Balcony', 'sunny'], ['Sea View', 'water'], ['City View', 'business'],
  ['Mini Bar', 'wine'], ['Bathtub', 'water'], ['Smart TV', 'tv'], ['Work Desk', 'desktop'],
  ['Kitchenette', 'restaurant'], ['Non-Smoking', 'ban'], ['Safe Box', 'lock-closed'],
  ['Coffee Machine', 'cafe'], ['Hair Dryer', 'flash'], ['Extra Bed Available', 'bed'],
];

const hotels = [
  {
    name: 'Saigon Riverside Hotel', city: 'Ho Chi Minh City',
    address: '12 Nguyen Hue, District 1', phone: '+84 28 1234 5678',
    description: 'Modern hotel in the heart of the city, a short walk from the river.',
    amenities: ['Free Wi-Fi', 'Breakfast Included', '24h Front Desk', 'Gym', 'Outdoor Pool', 'Restaurant'],
    types: [
      { name: 'Standard Single', capacity: 1, beds: 1, bedType: 'Single', sizeM2: 18, pricePerNight: 35, quantity: 5, startNumber: 101, amenities: ['Air Conditioning', 'Free Wi-Fi', 'Smart TV'] },
      { name: 'Deluxe Double', capacity: 2, beds: 1, bedType: 'Queen', sizeM2: 28, pricePerNight: 60, quantity: 8, startNumber: 201, amenities: ['Air Conditioning', 'Free Wi-Fi', 'City View', 'Mini Bar', 'Free Cleaning Service'] },
      { name: 'Family Suite', capacity: 4, beds: 2, bedType: '2 Queen', sizeM2: 48, pricePerNight: 120, quantity: 3, startNumber: 301, amenities: ['Air Conditioning', 'Extra Large', 'Bathtub', 'Kitchenette', 'Balcony'] },
    ],
  },
  {
    name: 'Da Nang Beach Resort', city: 'Da Nang',
    address: '88 Vo Nguyen Giap, My Khe Beach', phone: '+84 236 123 4567',
    description: 'Beachfront resort with pools, spa and a kids club.',
    amenities: ['Free Wi-Fi', 'Free Parking', 'Breakfast Included', 'Dinner Included', 'Spa', 'Indoor Pool', 'Outdoor Pool', 'Private Beach', 'Kids Club', 'Airport Shuttle'],
    types: [
      { name: 'Garden Room', capacity: 2, beds: 1, bedType: 'King', sizeM2: 32, pricePerNight: 85, quantity: 10, startNumber: 101, amenities: ['Air Conditioning', 'Free Wi-Fi', 'Balcony', 'Coffee Machine'] },
      { name: 'Ocean View Room', capacity: 2, beds: 1, bedType: 'King', sizeM2: 36, pricePerNight: 130, quantity: 6, startNumber: 201, amenities: ['Air Conditioning', 'Sea View', 'Balcony', 'Bathtub', 'Mini Bar'] },
      { name: 'Beach Villa', capacity: 5, beds: 3, bedType: '1 King + 2 Single', sizeM2: 90, pricePerNight: 280, quantity: 2, startNumber: 901, amenities: ['Air Conditioning', 'Sea View', 'Extra Large', 'Kitchenette', 'Bathtub', 'Free Cleaning Service'] },
    ],
  },
  {
    name: 'Dalat Pine Lodge', city: 'Da Lat',
    address: '5 Tran Hung Dao', phone: '+84 263 123 4567',
    description: 'Cozy lodge surrounded by pine forest, ideal for a quiet getaway.',
    amenities: ['Free Wi-Fi', 'Free Parking', 'Breakfast Included', 'Pet Friendly', 'Restaurant'],
    types: [
      { name: 'Cozy Single', capacity: 1, beds: 1, bedType: 'Single', sizeM2: 16, pricePerNight: 28, quantity: 4, startNumber: 101, amenities: ['Free Wi-Fi', 'Work Desk'] },
      { name: 'Pine View Double', capacity: 2, beds: 1, bedType: 'Double', sizeM2: 26, pricePerNight: 55, quantity: 6, startNumber: 201, amenities: ['Free Wi-Fi', 'Balcony', 'Coffee Machine', 'Free Cleaning Service'] },
    ],
  },
];

(async () => {
  await connectDB();
  await Promise.all([Amenity.deleteMany(), Hotel.deleteMany(), RoomType.deleteMany(),
    mongoose.connection.collection('rooms').deleteMany({})]);

  if (!(await User.findOne({ email: 'admin@hotel.com' })))
    await User.create({ name: 'Admin', email: 'admin@hotel.com', password: 'admin123', role: 'admin' });

  const amenities = await Amenity.insertMany([
    ...hotelAmenities.map(([name, icon]) => ({ name, icon, scope: 'hotel' })),
    ...roomAmenities.map(([name, icon]) => ({ name, icon, scope: 'room' })),
  ]);
  const ids = (names, scope) =>
    names.map((n) => amenities.find((a) => a.name === n && a.scope === scope)._id);

  for (const h of hotels) {
    const hotel = await Hotel.create({
      name: h.name, city: h.city, address: h.address, phone: h.phone, description: h.description,
      images: [img(h.name), img(h.name + '-2')],
      amenities: ids(h.amenities, 'hotel'),
    });
    for (const t of h.types) {
      const { quantity, startNumber, amenities: am, ...fields } = t;
      const rt = await RoomType.create({
        ...fields, hotel: hotel._id, amenities: ids(am, 'room'),
        images: [img(`${h.name}-${t.name}`)],   // similar images are fine for now
      });
      await addRooms(hotel._id, rt._id, quantity, startNumber);
    }
  }
  console.log('Seeded');
  process.exit(0);
})();