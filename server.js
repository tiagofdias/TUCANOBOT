const express = require('express');
const session = require('express-session');
const cors = require('cors');
const path = require('path');

// Import routes
const authRoutes = require('./routes/auth');
const guildsRoutes = require('./routes/guilds');
const levelsRoutes = require('./routes/levels');
const birthdaysRoutes = require('./routes/birthdays');
const autoRoutes = require('./routes/auto');
const settingsRoutes = require('./routes/settings');

const app = express();

// Middleware
app.use(cors({
    origin: process.env.DASHBOARD_URL || true,
    credentials: true
}));
app.use(express.json());

// API Safe Mode Protection
app.use('/api', (req, res, next) => {
    // Exclude /api/status so dashboard can still check bot health
    if (req.path === '/status') return next();
    
    if (global.DATABASE_OFFLINE) {
        return res.status(503).json({ error: 'Database is currently unavailable. Bot is in Safe Mode.', status: 'SAFE_MODE' });
    }
    next();
});

app.get('/api/status', (req, res) => {
    res.json({ databaseStatus: !global.DATABASE_OFFLINE ? 'ONLINE' : 'OFFLINE', mode: global.DATABASE_OFFLINE ? 'SAFE_MODE' : 'NORMAL' });
});

// Trust Render's reverse proxy (required for secure cookies)
if (process.env.NODE_ENV === 'production') {
    app.set('trust proxy', 1);
}

app.use(session({
    secret: process.env.SESSION_SECRET || 'tucanobot-secret-key-change-in-production',
    resave: false,
    saveUninitialized: false,
    cookie: {
        secure: process.env.NODE_ENV === 'production',
        httpOnly: true,
        sameSite: process.env.NODE_ENV === 'production' ? 'none' : 'lax',
        maxAge: 7 * 24 * 60 * 60 * 1000 // 7 days
    }
}));

// Serve static dashboard files
app.use('/dashboard', express.static(path.join(__dirname, 'dashboard')));

// Health check
app.get('/', (req, res) => {
    res.send('ok');
});

app.get('/health', (req, res) => {
    res.send('ok');
});

// API Routes
app.use('/api/auth', authRoutes);
app.use('/api/guilds', guildsRoutes);
app.use('/api/guilds', levelsRoutes);
app.use('/api/guilds', birthdaysRoutes);
app.use('/api/guilds', autoRoutes);
app.use('/api/guilds', settingsRoutes);

// Dashboard SPA fallback - serve index.html for all dashboard routes
app.get('/dashboard/{*splat}', (req, res) => {
    res.sendFile(path.join(__dirname, 'dashboard', 'index.html'));
});

module.exports = app;
