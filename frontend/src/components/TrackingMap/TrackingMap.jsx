import React, { useState, useEffect } from 'react';
import './TrackingMap.css';
import ApiService from '../../services/apiService';

/**
 * TrackingMap Component
 * Hiển thị bản đồ vị trí đơn hàng
 * Sử dụng Leaflet library
 */
const TrackingMap = ({ orderId }) => {
  const [map, setMap] = useState(null);
  const [locations, setLocations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [markers, setMarkers] = useState([]);

  const apiService = new ApiService();

  useEffect(() => {
    // Initialize Leaflet map
    initializeMap();
    
    // Fetch location history
    fetchLocationHistory();
    
    // Polling for updates every 30 seconds
    const interval = setInterval(fetchLocationHistory, 30000);
    return () => clearInterval(interval);
  }, [orderId]);

  const initializeMap = () => {
    // Dynamically import Leaflet
    import('leaflet').then(L => {
      const mapContainer = document.getElementById('tracking-map');
      if (!mapContainer) return;

      // Default center (Hanoi)
      const defaultCenter = [21.0285, 105.8542];
      
      const leafletMap = L.map('tracking-map').setView(defaultCenter, 12);

      // Add tile layer
      L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '© OpenStreetMap contributors',
        maxZoom: 19
      }).addTo(leafletMap);

      setMap({ L, leafletMap, markers: [] });
    }).catch(err => {
      console.error('Failed to load Leaflet:', err);
      setError('Failed to load map library. Using address list instead.');
    });
  };

  const fetchLocationHistory = async () => {
    try {
      setLoading(true);
      const data = await apiService.getOrderLocationHistory(orderId);
      
      if (data && data.locations) {
        setLocations(data.locations);
        
        if (map) {
          updateMapMarkers(data.locations);
        }
      }
    } catch (err) {
      console.error('Error fetching location history:', err);
      setError('Failed to load location history');
    } finally {
      setLoading(false);
    }
  };

  const updateMapMarkers = (locationsList) => {
    if (!map || !map.leafletMap) return;

    const { L, leafletMap } = map;

    // Clear existing markers
    markers.forEach(marker => marker.remove());
    setMarkers([]);

    if (locationsList.length === 0) return;

    const newMarkers = [];
    const coordinates = [];

    locationsList.forEach((location, index) => {
      const { latitude, longitude, address, timestamp, status } = location;
      
      if (latitude && longitude) {
        // Create marker
        const isLatest = index === 0;
        const markerColor = isLatest ? 'red' : (status === 'DELIVERED' ? 'green' : 'blue');
        const markerHTML = `<div style="background-color: ${markerColor}; width: 20px; height: 20px; border-radius: 50%; border: 2px solid white;"></div>`;
        
        const marker = L.marker([latitude, longitude], {
          title: `${isLatest ? 'Latest: ' : ''}${address || 'Unknown location'}`
        }).bindPopup(`
          <div style="width: 200px;">
            <p><strong>${isLatest ? '📍 Latest Location' : '📌 Previous Location'}</strong></p>
            <p><strong>Address:</strong> ${address || 'N/A'}</p>
            <p><strong>Status:</strong> ${status || 'N/A'}</p>
            <p><strong>Time:</strong> ${new Date(timestamp).toLocaleString('vi-VN')}</p>
          </div>
        `).addTo(leafletMap);

        newMarkers.push(marker);
        coordinates.push([latitude, longitude]);
      }
    });

    // Draw route if multiple locations
    if (coordinates.length > 1) {
      const { L } = map;
      const polyline = L.polyline(coordinates, {
        color: 'blue',
        weight: 2,
        opacity: 0.7,
        dashArray: '5, 10'
      }).addTo(leafletMap);

      // Fit map to route
      leafletMap.fitBounds(polyline.getBounds());
    } else if (coordinates.length === 1) {
      // Center on single location
      map.leafletMap.setView(coordinates[0], 14);
    }

    setMarkers(newMarkers);
  };

  return (
    <div className="tracking-map-container">
      <div className="map-header">
        <h2>📍 Order Location Tracking</h2>
        <p className="order-id">Order ID: {orderId}</p>
      </div>

      {error && (
        <div className="error-message">
          {error}
        </div>
      )}

      {/* Map Container */}
      <div id="tracking-map" className="map-container"></div>

      {/* Location History List */}
      <div className="location-list">
        <h3>📍 Location History ({locations.length})</h3>
        
        {loading && <p className="loading">Loading...</p>}
        
        {locations.length === 0 && !loading && (
          <p className="no-data">No location history found</p>
        )}

        {locations.length > 0 && (
          <div className="history-items">
            {locations.map((location, index) => (
              <div key={index} className="history-item">
                <div className="history-status">
                  {index === 0 && <span className="badge latest">Latest</span>}
                  <span className={`badge status-${location.status?.toLowerCase()}`}>
                    {location.status || 'Unknown'}
                  </span>
                </div>
                
                <div className="history-content">
                  <p className="address">
                    <strong>📍</strong> {location.address || 'Unknown location'}
                  </p>
                  <p className="coordinates">
                    {location.latitude.toFixed(4)}, {location.longitude.toFixed(4)}
                  </p>
                  <p className="timestamp">
                    {new Date(location.timestamp).toLocaleString('vi-VN')}
                  </p>
                  
                  {location.details && Object.keys(location.details).length > 0 && (
                    <div className="details">
                      {location.details.temperature && (
                        <span>🌡️ {location.details.temperature}°C</span>
                      )}
                      {location.details.humidity && (
                        <span>💧 {location.details.humidity}%</span>
                      )}
                      {location.details.speed && (
                        <span>🚚 {location.details.speed} km/h</span>
                      )}
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default TrackingMap;
