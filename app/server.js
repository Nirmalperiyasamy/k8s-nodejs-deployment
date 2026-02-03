const express = require('express');
const os = require('os');
const app = express();
const PORT = process.env.PORT || 3000;

// Health check endpoint
app.get('/health', (req, res) => {
    res.status(200).json({ status: 'healthy', timestamp: new Date() });
});

// ping check endpoint
app.get('/ping', (req, res) => {
    res.status(200).json({ status: 'pong', timestamp: new Date() });
});

// Main endpoint - ADDED ConfigMap data
app.get('/', (req, res) => {
    res.json({
        message: process.env.WELCOME_MESSAGE || 'Hello from Kubernetes!',  // ✅ From ConfigMap
        hostname: os.hostname(),
        version: process.env.APP_VERSION || 'v1.0',  // ✅ From ConfigMap
        nodeVersion: process.version
    });
});

// API endpoint
app.get('/api/info', (req, res) => {
    res.json({
        app: process.env.APP_NAME || 'nodejs-k8s-demo',  // ✅ From ConfigMap
        environment: process.env.NODE_ENV || 'development',
        pod: os.hostname(),
        logLevel: process.env.LOG_LEVEL || 'info'  // ✅ From ConfigMap
    });
});

app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});