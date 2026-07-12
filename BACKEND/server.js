require('dotenv').config();
const express = require('express');
const cors = require('cors');
const errorHandler = require('./middleware/errorHandler');

const patientRoutes = require('./routes/patients');
const appointmentRoutes = require('./routes/appointments');
const analyticsRoutes = require('./routes/analytics');
const settingsRoutes = require('./routes/settings');
const chatRoutes = require('./routes/chat');

const app = express();

const corsOrigins = process.env.FRONTEND_URL
    ? process.env.FRONTEND_URL.split(',').map((origin) => origin.trim())
    : ['http://localhost:5500', 'http://127.0.0.1:5500', 'http://localhost:3000'];

app.use(cors({
    origin: process.env.NODE_ENV === 'production' ? corsOrigins : true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'apikey']
}));

// Request body parser middleware
app.use(express.json());

// Logging middleware
app.use((req, res, next) => {
    console.log(`[HTTP] ${req.method} ${req.url}`);
    next();
});

// REST API Endpoints
app.use('/api/patients', patientRoutes);
app.use('/api/appointments', appointmentRoutes);
app.use('/api/analytics', analyticsRoutes);
app.use('/api', settingsRoutes);
app.use('/api', chatRoutes);

// Base route to verify server health
app.get('/', (req, res) => {
    res.json({
        status: "DentalAI OS Backend Running",
        version: "1.0.0",
        environment: process.env.NODE_ENV || 'development'
    });
});

app.get('/api/health', (req, res) => {
    res.json({
        status: 'ok',
        timestamp: new Date().toISOString(),
        uptime: process.uptime()
    });
});

// 404 Route handler
app.use((req, res) => {
    res.status(404).json({
        status: 'error',
        statusCode: 404,
        message: 'Endpoint not found'
    });
});

// Global central exception handler
app.use(errorHandler);

const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
    console.log(`===================================================`);
    console.log(`DentalAI OS Express Backend running on Port ${PORT}`);
    console.log(`Environment: ${process.env.NODE_ENV || 'development'}`);
    console.log(`===================================================`);
});