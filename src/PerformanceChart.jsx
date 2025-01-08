import React, { useState, useEffect } from 'react';
import { Chart as ChartJS, LinearScale, CategoryScale, BarElement, PointElement, Tooltip, Legend } from 'chart.js';
import { Bar } from 'react-chartjs-2';
import axios from 'axios';


ChartJS.register(LinearScale, CategoryScale, BarElement, PointElement, Tooltip, Legend);

const PerformanceChart = () => {
  const [chartData, setChartData] = useState({
    labels: [],
    datasets: [],
  });

  const [last20MinData, setLast20MinData] = useState({
    labels: [],
    datasets: [],
  });

  
  const fetchAllData = async () => {
    try {
      const response = await axios.get('http://localhost:5000/api/performance');
      const data = response.data;

      
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
      console.error('Error fetching all data:', error);
    }
  };

  
  const fetchLast20MinData = async () => {
    try {
      const response = await axios.get('http://localhost:5000/api/performance/last-20-min');
      const data = response.data;

      const labels = data.map((_, index) => `Entry ${index + 1}`);
      const positives = data.map(item => item.positive);
      const negatives = data.map(item => item.negative);
      const neutrals = data.map(item => item.neutral);

      setLast20MinData({
        labels,
        datasets: [
          {
            label: 'Positive',
            data: positives,
            backgroundColor: 'rgba(75, 192, 192, 0.5)',
          },
          {
            label: 'Negative',
            data: negatives,
            backgroundColor: 'rgba(255, 99, 132, 0.5)',
          },
          {
            label: 'Neutral',
            data: neutrals,
            backgroundColor: 'rgba(255, 206, 86, 0.5)',
          },
        ],
      });
    } catch (error) {
      console.error('Error fetching last 20 minutes data:', error);
    }
  };

  useEffect(() => {
    fetchAllData();
  }, []);

  return (
    <div>
      <h2>Overall Performance</h2>
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
      <button onClick={fetchLast20MinData} style={{ marginTop: '20px', padding: '10px 20px' }}>
        Show Last 20 Min Data
      </button>

      {last20MinData.labels.length > 0 && (
        <>
          <h2>Performance (Last 20 Minutes)</h2>
          <Bar
            data={last20MinData}
            options={{
              responsive: true,
              plugins: {
                legend: { position: 'top' },
                tooltip: { enabled: true },
              },
            }}
          />
        </>
      )}
    </div>
  );
};

export default PerformanceChart;
