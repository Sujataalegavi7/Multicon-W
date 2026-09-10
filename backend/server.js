require('dotenv').config();
const express = require('express');
const mongoose = require('mongoose');
const helmet = require('helmet');
const cors = require('cors');
const rateLimit = require('express-rate-limit');
const morgan = require('morgan');
const path = require('path');
const fs = require('fs');

const authRoutes = require('./routes/authRoutes');
const paperRoutes = require('./routes/paperRoutes');
const contributorRoutes = require('./routes/contributorRoutes');
const adminRoutes = require('./routes/adminRoutes');
const seoRoutes = require('./routes/seoRoutes');
const errorHandler = require('./middleware/errorHandler');
const { optionalAuth } = require('./middleware/auth');
const Paper = require('./models/Paper');
const User = require('./models/User');

const app = express();

// ─── Security & Middleware ─────────────────────────────────────────────────

// Helmet Security Headers
app.use(
  helmet({
    crossOriginResourcePolicy: { policy: 'cross-origin' },
    crossOriginEmbedderPolicy: false,
    contentSecurityPolicy: false, // Disabled for PDF browser embedding
    frameguard: { action: 'sameorigin' }, // Protect against Clickjacking attacks
  })
);

// Whitelisted CORS Configuration
const allowedOrigins = [
  'http://localhost:5173',
  'http://127.0.0.1:5173',
  'http://localhost:3000',
  'http://127.0.0.1:3000',
  'http://localhost:80',
  'http://localhost',
];

if (process.env.CLIENT_URL) {
  process.env.CLIENT_URL.split(',').forEach((url) => {
    const trimmed = url.trim().replace(/\/$/, '');
    if (trimmed && !allowedOrigins.includes(trimmed)) {
      allowedOrigins.push(trimmed);
    }
  });
}

app.use(
  cors({
    origin: (origin, callback) => {
      // Allow requests with no origin (e.g. mobile apps, curl, server-side SSR)
      if (!origin) return callback(null, true);

      const isAllowed =
        allowedOrigins.includes(origin) ||
        (process.env.NODE_ENV !== 'production' && (
          origin.startsWith('http://localhost:') ||
          origin.startsWith('http://127.0.0.1:') ||
          origin.endsWith('.ngrok-free.app') ||
          origin.endsWith('.loca.lt')
        ));

      if (isAllowed) {
        return callback(null, true);
      }
      return callback(new Error(`Origin ${origin} not allowed by CORS policy`));
    },
    credentials: true,
  })
);

// Global API Rate Limiter (300 requests per 15 minutes)
const globalLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 300,
  standardHeaders: true,
  legacyHeaders: false,
  message: { success: false, message: 'Too many requests. Please try again later.' },
});
app.use('/api', globalLimiter);

// Strict Authentication Rate Limiter (15 attempts per 15 minutes to prevent brute-force)
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 15,
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    success: false,
    message: 'Too many authentication attempts. Please try again in 15 minutes.',
  },
});
app.use('/api/auth/login', authLimiter);
app.use('/api/auth/register', authLimiter);

if (process.env.NODE_ENV !== 'test') {
  app.use(morgan('dev'));
}

app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// ─── Static & Upload Access Controls ───────────────────────────────────────

// 1. Thumbnails (public images)
app.use(
  '/uploads/thumbnails',
  (req, res, next) => {
    res.setHeader('Cross-Origin-Resource-Policy', 'cross-origin');
    next();
  },
  express.static(path.join(__dirname, 'uploads', 'thumbnails'))
);

// 2. Protected PDF Access (Author/Admin or Approved Papers Only)
app.get('/uploads/pdfs/:filename', optionalAuth, async (req, res, next) => {
  try {
    const filename = path.basename(req.params.filename);
    const relativePath = `uploads/pdfs/${filename}`;
    const filePath = path.join(__dirname, 'uploads', 'pdfs', filename);

    if (!fs.existsSync(filePath)) {
      return res.status(404).json({ success: false, message: 'PDF document not found on server.' });
    }

    const paper = await Paper.findOne({
      $or: [
        { pdfPath: relativePath },
        { pdfPath: relativePath.replace(/\//g, '\\') },
      ],
    });

    if (!paper) {
      return res.status(404).json({ success: false, message: 'Paper record not found.' });
    }

    const isOwner = req.user && paper.uploadedBy?.toString() === req.user._id?.toString();
    const isAdmin = req.user && req.user.role === 'admin';

    // Disallow public access to pending/rejected/changes_requested papers
    if (paper.status !== 'approved' && !isOwner && !isAdmin) {
      return res.status(403).json({
        success: false,
        message: 'This document is pending approval and cannot be accessed publicly.',
      });
    }

    res.setHeader('Cross-Origin-Resource-Policy', 'cross-origin');
    res.setHeader('Content-Type', 'application/pdf');
    return res.sendFile(filePath);
  } catch (err) {
    next(err);
  }
});

// ─── SEO (Dynamic Sitemap & Robots) ───────────────────────────────────────
app.use('/', seoRoutes);
app.use('/api', seoRoutes);

// ─── Routes ───────────────────────────────────────────────────────────────
app.use('/api/auth', authRoutes);
app.use('/api/papers', paperRoutes);
app.use('/api/contributor', contributorRoutes);
app.use('/api/admin', adminRoutes);

// Health check
app.get('/api/health', (req, res) => {
  res.status(200).json({ success: true, message: 'CRR API is running.' });
});

// 404
app.use((req, res) => {
  res.status(404).json({ success: false, message: 'Route not found.' });
});

// ─── Global Error Handler ─────────────────────────────────────────────────
app.use(errorHandler);

// ─── Database & Server ────────────────────────────────────────────────────
const PORT = process.env.PORT || 5000;

const bootstrapAdmin = async () => {
  try {
    const isUsingDefault = !process.env.ADMIN_CODE || !process.env.ADMIN_LOGIN_ID;
    if (isUsingDefault && process.env.NODE_ENV === 'production') {
      console.warn('⚠️  SECURITY WARNING: Using default ADMIN credentials in production! Please set ADMIN_LOGIN_ID and ADMIN_CODE in .env');
    }

    const loginId = process.env.ADMIN_LOGIN_ID || 'crr_admin';
    const code = process.env.ADMIN_CODE || 'Admin@CRR2026';
    const existing = await User.findOne({ role: 'admin' });
    if (!existing) {
      await User.create({
        name: 'CRR Administrator',
        email: `${loginId}@tcetmumbai.in`,
        loginId,
        password: code,
        role: 'admin',
        tokenVersion: 0,
      });
      console.log(`👑  Initial Admin created (Login ID: ${loginId})`);
    }
  } catch (e) {
    console.warn('⚠️  Admin bootstrap check skipped:', e.message);
  }
};

mongoose
  .connect(process.env.MONGO_URI)
  .then(async () => {
    console.log('✅  MongoDB connected');
    await bootstrapAdmin();
    app.listen(PORT, '0.0.0.0', () => {
      console.log(`🚀  Server running on http://localhost:${PORT}`);
    });
  })
  .catch((err) => {
    console.error('❌  MongoDB connection failed:', err.message);
    process.exit(1);
  });
