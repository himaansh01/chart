const express = require('express');
const cors = require('cors');
const { WebSocketServer } = require('ws');
const sqlite3 = require('sqlite3').verbose();

const app = express();
app.use(cors());
app.use(express.json());

// Initialize SQLite database
const db = new sqlite3.Database('./performance.db', (err) => {
  if (err) {
    console.error('Error connecting to SQLite database:', err);
  } else {
    console.log('Connected to SQLite database.');

    // Create the Performance table if it doesn't exist
    db.run(
      `CREATE TABLE IF NOT EXISTS performance (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        positive INTEGER DEFAULT 0,
        negative INTEGER DEFAULT 0,
        neutral INTEGER DEFAULT 0,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP
      )`,
      (err) => {
        if (err) {
          console.error('Error creating table:', err);
        } else {
          console.log('Performance table is ready.');
        }
      }
    );
  }
});

// REST API to fetch performance data with optional time filtering
app.get('/api/performance', (req, res) => {
  const minutes = req.query.minutes;

  let query = `SELECT * FROM performance`;
  const params = [];

  if (minutes) {
    query += ` WHERE created_at >= DATETIME('now', ?)`;
    params.push(`-${minutes} minutes`);
  }

  db.all(query, params, (err, rows) => {
    if (err) {
      console.error('Error fetching performance data:', err);
      res.status(500).json({ error: 'Failed to fetch data' });
    } else {
      res.json(rows);
    }
  });
});

// REST API to add new performance data
app.post('/api/performance', (req, res) => {
  const { positive, negative, neutral } = req.body;

  if (
    typeof positive !== 'number' ||
    typeof negative !== 'number' ||
    typeof neutral !== 'number'
  ) {
    return res.status(400).json({ error: 'Invalid input data. All fields must be numbers.' });
  }

  const query = `INSERT INTO performance (positive, negative, neutral) VALUES (?, ?, ?)`;
  db.run(query, [positive, negative, neutral], function (err) {
    if (err) {
      console.error('Error inserting performance data:', err);
      res.status(500).json({ error: 'Failed to add performance data' });
    } else {
      console.log('New performance data added:', { id: this.lastID, positive, negative, neutral });

      // Broadcast the new data via WebSocket
      const newData = {
        id: this.lastID,
        positive,
        negative,
        neutral,
        created_at: new Date().toISOString(),
      };
      broadcast({ event: 'new-data', data: newData });

      res.status(201).json(newData);
    }
  });
});
app.post('/api/performance', (req, res) => {
  const { positive, negative, neutral } = req.body;

  // Make sure the data is valid
  if (typeof positive !== 'number' || typeof negative !== 'number' || typeof neutral !== 'number') {
    return res.status(400).json({ error: 'Invalid input data. All fields must be numbers.' });
  }

  // SQL query to insert data into the performance table
  const query = "INSERT INTO performance (positive, negative, neutral) VALUES (?, ?, ?)";
  const values = [positive, negative, neutral];

  // Insert data into SQLite
  db.run(query, values, function(err) {
    if (err) {
      console.error('Error inserting data:', err);
      return res.status(500).json({ error: 'Failed to insert data' });
    }
    // Send the response with the inserted data
    res.status(201).json({ id: this.lastID, positive, negative, neutral });
  });
});


// WebSocket Server
const server = app.listen(5000, () => console.log('Server running on http://localhost:5000'));
const wss = new WebSocketServer({ server });

wss.on('connection', (ws) => {
  console.log('New WebSocket connection');

  ws.on('message', (message) => {
    console.log(`Received: ${message}`);
  });
});

const broadcast = (data) => {
  wss.clients.forEach((client) => {
    if (client.readyState === 1) {
      client.send(JSON.stringify(data));
    }
  });
};

// Graceful shutdown
process.on('SIGINT', () => {
  console.log('Closing SQLite database.');
  db.close();
  process.exit(0);
});
