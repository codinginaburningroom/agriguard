// backend/server.js
require('dotenv').config();
const express = require('express');
const cors    = require('cors');
const app     = express();

const origins = (process.env.ALLOWED_ORIGINS || '').split(',').map(s => s.trim());

app.use(cors({
  origin: (origin, cb) => {
    if (!origin || process.env.NODE_ENV === 'development' || origins.includes(origin)) cb(null, true);
    else cb(new Error('CORS'));
  },
  credentials: true,
}));

// ✅ FIX: บังคับ Content-Type charset=utf-8 ทุก response
app.use((req, res, next) => {
  res.setHeader('Content-Type', 'application/json; charset=utf-8');
  next();
});

app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

app.get('/health', (_, res) => res.json({ ok: true, time: new Date() }));

app.use('/api/auth',         require('./routes/auth'));
app.use('/api/admin',        require('./routes/admin'));
app.use('/api/farms',        require('./routes/farms'));
app.use('/api/plots',        require('./routes/plots'));
app.use('/api/crops',        require('./routes/crops'));
app.use('/api/targets',      require('./routes/targets'));
app.use('/api/products',     require('./routes/products'));
app.use('/api/moa',          require('./routes/moa'));
app.use('/api/applications', require('./routes/applications'));
app.use('/api/plot-crops',   require('./routes/plotCrops'));
app.use('/api/search',       require('./routes/search'));

app.use((_, res) => res.status(404).json({ success: false, error: 'Not found' }));
app.use((e, _, res, __) => res.status(500).json({ success: false, error: e.message }));

const PORT = process.env.PORT || 3000;

app.listen(PORT, () => {
  console.log(`🚀 AgriGuard API running on port ${PORT}`);
});