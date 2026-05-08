const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv');
const connectDB = require('./config/db');

dotenv.config();

const app = express();

// Routes imports
const auditRoutes = require('./routes/auditRoutes');
const quizRoutes = require('./routes/quizRoutes'); // ✅ FIXED (moved here)

// Connect to MongoDB
connectDB();

// Middleware
app.use(cors({
  origin: process.env.CLIENT_URL || 'http://localhost:3000',
  credentials: true,
}));

app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ limit: '50mb', extended: true }));

// ==================
// ROUTES
// ==================

app.use('/api/users', require('./routes/userRoutes'));
app.use('/api/tickets', require('./routes/ticketRoutes'));
app.use('/api/messages', require('./routes/messageRoutes'));
app.use('/api/resources', require('./routes/resourceRoutes'));
app.use('/api/transcripts', require('./routes/transcriptRoutes'));
app.use('/api/reports', require('./routes/reportRoutes'));
app.use('/api/mood', require('./routes/moodRoutes'));
app.use('/api/audit', auditRoutes);

app.use('/api/quiz', quizRoutes);

// =====================
// HEALTH CHECK
// =====================
app.get('/api/health', (req, res) =>
  res.json({ status: 'OK', message: 'Server running' })
);
app.get('/',(req,res)=>{
  res.send("Ventify API is running...");
});

// =====================
// 404 HANDLER
// =====================
app.use((req, res) =>
  res.status(404).json({ message: 'Route not found' })
);

// =====================
// ERROR HANDLER
// =====================
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ message: 'Server error', error: err.message });
});

// =====================
// START SERVER
// =====================
const PORT = process.env.PORT || 5000;
app.listen(PORT, () =>
  console.log(`🚀 Server running on port ${PORT}`)
);