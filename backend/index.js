const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const { WebSocketServer } = require('ws');

// Initialize Express
const app = express();
app.use(cors());
app.use(express.json());

// MongoDB schema and model
const performanceSchema = new mongoose.Schema(
  {
    positive: { type: Number, default: 0 },
    negative: { type: Number, default: 0 },
    neutral: { type: Number, default: 0 },
  },
  { timestamps: true }
);
const Performance = mongoose.model('Performance', performanceSchema);

// Connect to MongoDB
mongoose
  .connect('mongodb+srv://manikantamannalliker:himaansh01@cluster0.8cdpsbn.mongodb.net/chart', {
    useNewUrlParser: true,
    useUnifiedTopology: true,
  })
  .then(() => console.log('Connected to MongoDB'))
  .catch((err) => console.error('MongoDB connection error:', err));

// REST API to fetch all or filtered data
app.get('/api/performance', async (req, res) => {
  try {
    const { minutes } = req.query;

    let filter = {};
    if (minutes) {
      const timeAgo = new Date(Date.now() - minutes * 60 * 1000);
      filter = { createdAt: { $gte: timeAgo } };
    }

    const data = await Performance.find(filter);
    res.json(data);
  } catch (error) {
    console.error('Error fetching performance data:', error);
    res.status(500).json({ error: 'Failed to fetch data' });
  }
});

// Start the HTTP server
const PORT = 5000;
const server = app.listen(PORT, () =>
  console.log(`Server running on http://localhost:${PORT}`)
);

// WebSocket Server
const wss = new WebSocketServer({ server });

// Broadcast Function to send data to all connected clients
const broadcast = (data) => {
  wss.clients.forEach((client) => {
    if (client.readyState === 1) {
      client.send(JSON.stringify(data));
    }
  });
};

// Handle WebSocket connections
wss.on('connection', (ws) => {
  console.log('New WebSocket connection');

  ws.on('message', async (message) => {
    try {
      const { action, minutes } = JSON.parse(message);

      if (action === 'filter') {
        const timeAgo = new Date(Date.now() - minutes * 60 * 1000);
        const filteredData = await Performance.find({ createdAt: { $gte: timeAgo } });

        ws.send(
          JSON.stringify({
            event: 'filtered-data',
            data: filteredData,
          })
        );
      }
    } catch (error) {
      console.error('Error handling WebSocket message:', error);
      ws.send(JSON.stringify({ event: 'error', message: 'Invalid message format or request' }));
    }
  });
});

// REST API to add new performance data
app.post('/api/performance', async (req, res) => {
  try {
    const { positive, negative, neutral } = req.body;

    if (
      typeof positive !== 'number' ||
      typeof negative !== 'number' ||
      typeof neutral !== 'number'
    ) {
      return res.status(400).json({ error: 'Invalid input data. All fields must be numbers.' });
    }

    const newPerformance = new Performance({ positive, negative, neutral });
    const savedData = await newPerformance.save();

    console.log('New performance data added:', savedData);

    // Broadcast the new data to all WebSocket clients
    broadcast({ event: 'new-data', data: savedData });

    res.status(201).json(savedData);
  } catch (error) {
    console.error('Error adding performance data:', error);
    res.status(500).json({ error: 'Failed to add performance data' });
  }
});
