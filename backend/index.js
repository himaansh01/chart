const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');

const app = express();
app.use(cors());
app.use(express.json());

// MongoDB schema with timestamps
const performanceSchema = new mongoose.Schema(
  {
    positive: { type: Number, default: 0 },
    negative: { type: Number, default: 0 },
    neutral: { type: Number, default: 0 },
  },
  { timestamps: true } // Automatically adds createdAt and updatedAt fields
);
const Performance = mongoose.model('Performance', performanceSchema);

// Connect to MongoDB
mongoose
  .connect('mongodb+srv://manikantamannalliker:himaansh01@cluster0.8cdpsbn.mongodb.net/chart')
  .then(() => console.log('Connected to MongoDB'))
  .catch((err) => console.error('MongoDB connection error:', err));

// API endpoint to get all performance data
app.get('/api/performance', async (req, res) => {
  try {
    const data = await Performance.find();
    res.json(data);
  } catch (error) {
    console.error('Error fetching performance data:', error);
    res.status(500).json({ error: 'Failed to fetch data' });
  }
});

// API endpoint to add performance data
app.post('/api/performance', async (req, res) => {
  try {
    const { positive, negative, neutral } = req.body;

    // Validate input data
    if (
      typeof positive !== 'number' ||
      typeof negative !== 'number' ||
      typeof neutral !== 'number'
    ) {
      return res.status(400).json({ error: 'Invalid input data. All fields must be numbers.' });
    }

    // Create a new document
    const newPerformance = new Performance({ positive, negative, neutral });
    const savedData = await newPerformance.save();

    // Log success
    console.log('New performance data added:', savedData);

    res.status(201).json(savedData);
  } catch (error) {
    console.error('Error adding performance data:', error);
    res.status(500).json({ error: 'Failed to add performance data' });
  }
});

// API endpoint to fetch data from the last 20 minutes
app.get('/api/performance/last-20-min', async (req, res) => {
  try {
    const twentyMinutesAgo = new Date(Date.now() - 20 * 60 * 1000); // Current time minus 20 minutes
    const data = await Performance.find({ createdAt: { $gte: twentyMinutesAgo } });
    res.json(data);
  } catch (error) {
    console.error('Error fetching data:', error);
    res.status(500).json({ error: 'Failed to fetch data for the last 20 minutes' });
  }
});

// Start the server
const PORT = 5000;
app.listen(PORT, () => console.log(`Server running on http://localhost:${PORT}`));
