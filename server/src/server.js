require('dotenv').config();
const express = require('express');
const cors = require('cors');
const connectDB = require('./config/db');

const app = express();
app.use(cors());
app.use(express.json());

app.get('/api/health', (_, res) => res.json({ ok: true }));
app.use('/api/auth', require('./routes/auth'));
app.use('/api/admin', require('./routes/admin'));
app.use('/api/bookings', require('./routes/bookings'));
app.use('/api/reviews', require('./routes/reviews'));  
app.use('/api', require('./routes/public'));          



app.use((err, req, res, next) => {
  if (err.status) return res.status(err.status).json({ message: err.message });   
  if (err.name === 'ValidationError') return res.status(400).json({ message: err.message });
  if (err.name === 'MulterError') return res.status(400).json({ message: err.message });
  if (err.name === 'CastError') return res.status(400).json({ message: 'Invalid id' });
  if (err.code === 11000) return res.status(409).json({ message: 'Duplicate value', keys: err.keyValue });
  console.error(err);
  res.status(500).json({ message: err.message });
});
const PORT = process.env.PORT || 4000;
connectDB()
  .then(() => app.listen(PORT, '0.0.0.0', () => console.log(`API on :${PORT}`)))
  .catch((e) => { console.error(e); process.exit(1); });