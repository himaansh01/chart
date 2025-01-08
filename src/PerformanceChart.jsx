import React, { useState, useEffect } from 'react';
import {
  Chart as ChartJS,
  LinearScale,
  CategoryScale,
  BarElement,
  PointElement,
  Tooltip,
  Legend,
} from 'chart.js';
import { Bar } from 'react-chartjs-2';

ChartJS.register(LinearScale, CategoryScale, BarElement, PointElement, Tooltip, Legend);

const PerformanceChart = () => {
  const [chartData, setChartData] = useState({
    labels: [],
    datasets: [],
  });

  const [timeFilter, setTimeFilter] = useState(''); // Default: no filter
  const [ws, setWs] = useState(null); // WebSocket connection

  const fetchData = async (minutes) => {
    try {
      const url = minutes
        ? `http://localhost:5000/api/performance?minutes=${minutes}`
        : 'http://localhost:5000/api/performance';

      const response = await fetch(url);
      const data = await response.json();

      const positive = data.reduce((sum, item) => sum + item.positive, 0);
      const negative = data.reduce((sum, item) => sum + item.negative, 0);
      const neutral = data.reduce((sum, item) => sum + item.neutral, 0);

      setChartData({
        labels: ['Positive', 'Negative', 'Neutral'],
        datasets: [
          {
            label: 'Performance',
            data: [positive, negative, neutral],
            backgroundColor: ['rgba(75, 192, 192, 0.5)', 'rgba(255, 99, 132, 0.5)', 'rgba(255, 206, 86, 0.5)'],
          },
        ],
      });
    } catch (error) {
      console.error('Error fetching filtered data:', error);
    }
  };

  const handleFilterChange = (event) => {
    const minutes = event.target.value;
    setTimeFilter(minutes);
    fetchData(minutes);
  };

  useEffect(() => {
    // Initial data fetch
    fetchData(timeFilter);

    // Establish WebSocket connection
    const websocket = new WebSocket('ws://localhost:5000');
    setWs(websocket);

    // WebSocket message handler
    websocket.onmessage = (event) => {
      const message = JSON.parse(event.data);

      if (message.event === 'new-data') {
        console.log('New data received via WebSocket:', message.data);
        // Refetch data with the current filter applied
        fetchData(timeFilter);
      }
    };

    websocket.onclose = () => {
      console.log('WebSocket connection closed.');
    };

    return () => {
      // Clean up WebSocket connection
      if (websocket) websocket.close();
    };
  }, [timeFilter]); // Reconnect WebSocket on filter change

  return (
    <div>
      <h2>Overall Performance</h2>

      <div style={{ marginBottom: '20px' }}>
        <label htmlFor="time-filter" style={{ marginRight: '10px' }}>
          Filter by Time:
        </label>
        <select
          id="time-filter"
          value={timeFilter}
          onChange={handleFilterChange}
          style={{ padding: '5px', fontSize: '16px' }}
        >
          <option value="">All Time</option>
          <option value="5">Last 5 Minutes</option>
          <option value="10">Last 10 Minutes</option>
          <option value="15">Last 15 Minutes</option>
        </select>
      </div>

      <Bar
        data={chartData}
        options={{
          responsive: true,
          plugins: {
            legend: { position: 'top' },
            tooltip: { enabled: true },
          },
        }}
      />
    </div>
  );
};

export default PerformanceChart;
