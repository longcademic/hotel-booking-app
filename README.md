# Hotel Booking App

A mobile hotel booking application built with React Native and Expo. The application allows customers to browse hotels, check room availability, make reservations, and manage their bookings. Administrators can manage hotel information, rooms, users, and reservations.

## Features

### Customer
- Register and log in.
- Browse and search hotels.
- View hotel details, amenities, and reviews.
- Browse room types and check availability.
- Calculate booking prices before making a reservation.
- Create and manage bookings.
- Make mock payments.
- Cancel bookings and view refund information.
- Submit reviews after completed stays.

### Administrator
- View dashboard statistics and booking trends.
- Manage hotels and room types.
- Manage hotel amenities.
- Manage room availability and room status.
- View and manage reservations.
- Manage customer accounts and roles.
- Manage reviews.
- Upload hotel and room images.

## Technology Stack

| Component | Technology |
|---|---|
| Mobile application | React Native, Expo |
| Language | JavaScript / TypeScript |
| Backend | Node.js, Express |
| Database | MongoDB Atlas, Mongoose |
| Authentication | JWT |
| HTTP client | Axios |
| Secure token storage | Expo SecureStore |
| Image storage | Cloudinary |
| Charts | React Native SVG |

## Project Structure

```text
hotel-booking/
├── client/                 # Expo mobile application
│   ├── src/
│   ├── assets/
│   ├── package.json
│   └── .env.example
├── server/                 # Express backend
│   ├── src/
│   ├── package.json
│   └── .env.example
├── .gitignore
└── README.md
```

## Prerequisites

Install the following before running the project:

- Node.js and npm
- Git
- Expo Go on an Android or iOS device, or an Android emulator
- A MongoDB Atlas account
- A Cloudinary account if using image upload functionality

## Installation and Setup

### 1. Clone the repository

```bash
git clone YOUR_GITHUB_REPOSITORY_URL
cd hotel-booking
```

### 2. Configure the backend

```bash
cd server
npm install
```

Create your environment file:

```bash
copy .env.example .env
```

Configure the following variables in `server/.env`:

```env
PORT=4000
MONGO_URI=YOUR_MONGODB_CONNECTION_STRING
JWT_SECRET=YOUR_RANDOM_SECRET
JWT_EXPIRES_IN=7d
CLOUDINARY_URL=YOUR_CLOUDINARY_URL
```

Use your own credentials. Never commit your `.env` file.

### 3. Start the backend

From the `server` directory:

```bash
node src/server.js
```

The API should be available at:

```text
http://localhost:4000
```

Health check:

```text
http://localhost:4000/api/health
```

### 4. Configure the frontend

Open another terminal:

```bash
cd client
npm install
```

Create the frontend environment file:

```bash
copy .env.example .env
```

Configure your API URL:

```env
EXPO_PUBLIC_API_URL=http://YOUR_PC_LAN_IP:4000/api
```

Choose the appropriate address:

- Android emulator: `http://10.0.2.2:4000/api`
- Physical phone: `http://YOUR_PC_LAN_IP:4000/api`
- Web on the same PC: `http://localhost:4000/api`

For physical-device testing, connect the phone and computer to the same Wi-Fi network and allow the backend port through your firewall.

### 5. Start the Expo application

From the `client` directory:

```bash
npx expo start
```

Scan the QR code using Expo Go.

If environment variables have changed, restart with:

```bash
npx expo start -c
```

## Testing Checklist

### Authentication
- [ ] Register with valid information.
- [ ] Reject registration with an existing email.
- [ ] Reject invalid or incomplete registration data.
- [ ] Log in with valid credentials.
- [ ] Reject incorrect credentials.
- [ ] Preserve login state after restarting the app.
- [ ] Log out successfully.
- [ ] Prevent unauthenticated users from accessing protected endpoints.

### Hotel Browsing
- [ ] Display the hotel list.
- [ ] Search hotels by name or city.
- [ ] Apply available filters.
- [ ] Open a hotel's detail page.
- [ ] Display hotel images and amenities.
- [ ] Display ratings and reviews.
- [ ] Display the cancellation policy.

### Room Availability and Pricing
- [ ] Display room types belonging to a hotel.
- [ ] Display room capacity, beds, amenities, and prices.
- [ ] Calculate availability for valid dates.
- [ ] Reject invalid date ranges.
- [ ] Reject check-out dates earlier than or equal to check-in dates.
- [ ] Calculate the correct number of nights.
- [ ] Calculate the correct total booking price.
- [ ] Prevent reservations exceeding room availability.

### Booking Management
- [ ] Create a booking with valid information.
- [ ] Reject bookings with invalid guest counts.
- [ ] Display the booking in My Bookings.
- [ ] Open booking details.
- [ ] Complete a mock payment.
- [ ] Prevent payment of expired or already processed bookings.
- [ ] Cancel a pending booking.
- [ ] Cancel a confirmed booking and calculate the applicable refund.
- [ ] Display booking status correctly.

### Cancellation and Refunds
- [ ] Apply the normal hotel refund policy.
- [ ] Calculate refunds for unused nights.
- [ ] Prevent refunds when the policy disallows them.
- [ ] Allow an administrator to force-cancel a booking with a 100% refund override.
- [ ] Display the correct refund amount and cancellation reason.

### Reviews
- [ ] Display hotel reviews.
- [ ] Submit a review after a completed booking.
- [ ] Reject reviews for bookings that are not completed.
- [ ] Prevent duplicate reviews for the same booking.
- [ ] Display the updated rating and review count.

### Administrator Dashboard
- [ ] Restrict dashboard access to administrators.
- [ ] Display reservation statistics.
- [ ] Display revenue and pending booking information.
- [ ] Filter statistics by hotel.
- [ ] Change the reporting period.
- [ ] Display booking trends.
- [ ] Display most-booked hotels or room types.

### Hotel and Room Administration
- [ ] Create a hotel.
- [ ] Edit hotel information.
- [ ] Delete a hotel where permitted.
- [ ] Upload hotel images.
- [ ] Create and edit room types.
- [ ] Manage room images.
- [ ] Update room status.
- [ ] Verify that room availability reflects active bookings.

### User Administration
- [ ] Display registered users.
- [ ] Search users by name or email.
- [ ] Change a customer's role to administrator.
- [ ] Remove administrator privileges.
- [ ] Disable a user account.
- [ ] Re-enable a disabled account.
- [ ] Prevent administrators from modifying their own account through the user-management screen.

### Amenities and Reviews Administration
- [ ] Create an amenity.
- [ ] Edit an amenity.
- [ ] Delete an amenity where permitted.
- [ ] Display amenity icons correctly.
- [ ] View and manage submitted reviews.

### Error Handling and Security
- [ ] Display a useful message when the backend is unavailable.
- [ ] Reject requests with invalid IDs.
- [ ] Reject unauthorized administrator requests.
- [ ] Validate uploaded image types and file sizes.
- [ ] Verify that passwords are hashed.
- [ ] Verify that secrets are not exposed in the frontend.
- [ ] Verify that `.env` files are excluded from Git.

## Notes

- Payment functionality is simulated for educational purposes.
- The backend requires a valid MongoDB connection.
- Image upload functionality requires valid Cloudinary credentials.
- Each developer must configure their own environment variables.
- Never commit database credentials, JWT secrets, API keys, or private tokens.