import React, { useEffect, useState } from 'react';
import io from 'socket.io-client';
import 'bootstrap/dist/css/bootstrap.min.css';

const socket = io('http://localhost:4000');

const App = () => {
  const [latitude, setLatitude] = useState(null);
  const [longitude, setLongitude] = useState(null);
  
  const [connected, setConnected] = useState(false);
  const [temperature, setTemperature] = useState(false);
  const [timeAgo, setTimeAgo] = useState('');
  const [status, setStatus] = useState('');
  const [recentTemperatures, setRecentTemperatures] = useState(false);

  useEffect(() => {
    socket.on('connect', () => {
      setConnected(true);
    });

    socket.on('disconnect', () => {
      setConnected(false);
    });

    socket.on('temperatureUpdate', (data) => {
      setTemperature(data.temperature);
      calculateTimeAgo(data.timestamp);
      setStatus(data.status);
    });

    socket.on('recentTemperatures', (data) => {
      console.log(data);
      setRecentTemperatures(data);
    });

    return () => {
      // socket.disconnect();
    };
  }, []);

  useEffect(() => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition((position) => {
        setLatitude(position.coords.latitude);
        setLongitude(position.coords.longitude);
      });
    } else {
      alert('Geolocation is not supported by this browser.');
    }
  }, []);

  useEffect(() => {
    if (latitude && longitude) {
      fetchCityName(latitude, longitude);
    }
  }, [latitude, longitude]);

  const fetchCityName = async (lat, lon) => {
    try {
      const response = await fetch(`https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lon}`);
      const data = await response.json();
      const c = data.address.city || data.address.town || data.address.village;
      
      socket.emit('getTemperature', c);
      socket.emit('getRecentTemperatures', c);
    } catch (error) {
      console.error('Error fetching city name:', error);
    }
  };

  const calculateTimeAgo = (timestamp) => {
    const differenceInMinutes = getTimeAgo(timestamp);
    setTimeAgo(`${differenceInMinutes} minutes ago`);
  };

  const getTimeAgo = (timestamp) => {
    const now = new Date();
    const then = new Date(timestamp);
    const differenceInMinutes = Math.floor((now - then) / 60000);
    return differenceInMinutes;
  };

  return (
    <div className="container mt-5">
      
      <div className="card">
        <div className="card-header d-flex justify-content-between align-items-center">
          <h4>Temperature Monitor</h4>
          {connected && <span className="badge bg-success">Connected</span>}
          {!connected && <span className="badge bg-danger">Connected</span>}
        </div>
        <div className="card-body d-flex justify-content-center align-items-center flex-column">
          <h5 className="card-title">Current Temperature</h5>
          <h1 className="display-1">{temperature}°C</h1>
          <p className="text-success">{status} • Last updated: {timeAgo}</p>
        </div>
      </div>
      <div className="mt-4">
        <h5>Recent Readings</h5>
        <ul className="list-group">
        {recentTemperatures && recentTemperatures.map((temp, index) => (
          <li key={index} className="list-group-item d-flex justify-content-between align-items-center">
            <small className="text-muted">
              <strong>{temp.temperature}</strong><br/>
              {getTimeAgo(temp.timestamp)} minutes ago
            </small>
            <span className={`badge ${temp.status === 'NORMAL' ? 'bg-success' : 'bg-warning'}`}>
              {temp.status}
            </span>
          </li>
        ))}

        </ul>
      </div>
    </div>
  );
};

export default App;