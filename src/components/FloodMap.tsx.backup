'use client';

import { useEffect, useState, useRef } from 'react';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';

// Fix for default marker icons in Next.js
if (typeof window !== 'undefined') {
  delete (L.Icon.Default.prototype as any)._getIconUrl;
  L.Icon.Default.mergeOptions({
    iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon-2x.png',
    iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon.png',
    shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-shadow.png',
  });
}

interface Station {
  id: number;
  name: string;
  latitude: number;
  longitude: number;
  basin_id: number;
  basin_name?: string;
  basin_code?: string;
}

interface StationData {
  station_id: number;
  current_rainfall: number;
  risk_level: string;
}

interface FloodMapProps {
  onStationClick?: (station: Station) => void;
  selectedStation?: Station | null;
}

// Simple marker icons
const createMarkerIcon = (riskLevel: string) => {
  const colors: Record<string, string> = {
    'safe': '#10b981',
    'watch': '#eab308',
    'warning': '#f97316',
    'danger': '#ef4444',
  };

  const color = colors[riskLevel.toLowerCase()] || '#6b7280';

  return L.divIcon({
    className: 'custom-marker',
    html: `<div style="background-color: ${color}; width: 20px; height: 20px; border-radius: 50%; border: 2px solid white; box-shadow: 0 2px 4px rgba(0,0,0,0.3);"></div>`,
    iconSize: [20, 20],
    iconAnchor: [10, 10],
    popupAnchor: [0, -10],
  });
};

function MapComponent({ onStationClick, selectedStation }: FloodMapProps) {
  const mapRef = useRef<L.Map | null>(null);
  const markersRef = useRef<L.Marker[]>([]);
  const [stations, setStations] = useState<Station[]>([]);
  const [stationData, setStationData] = useState<Record<number, StationData>>({});
  const [loading, setLoading] = useState(true);

  // Fetch stations data
  useEffect(() => {
    const fetchData = async () => {
      try {
        // Fetch stations from backend API
        const response = await fetch('http://localhost:8000/api/stations');
        if (!response.ok) {
          throw new Error('Failed to fetch stations');
        }
        const data = await response.json();

        // Map API response to Station[]
        const stationsList: Station[] = data.stations.map((s: any) => ({
          id: s.station_id,
          name: s.station_name,
          latitude: s.latitude,
          longitude: s.longitude,
          basin_id: s.basin_id,
          basin_name: s.basin_name,
          basin_code: s.basin_code,
        }));

        // Map station data
        const dataMap: Record<number, StationData> = {};
        data.stations.forEach((s: any) => {
          dataMap[s.station_id] = {
            station_id: s.station_id,
            current_rainfall: s.current_rainfall || 0,
            risk_level: s.risk_level || 'safe',
          };
        });

        setStations(stationsList);
        setStationData(dataMap);
        setLoading(false);
      } catch (error) {
        console.error('Error fetching stations:', error);
        setLoading(false);
      }
    };

    fetchData();
    const interval = setInterval(fetchData, 5 * 60 * 1000); // 5 min
    return () => clearInterval(interval);
  }, []);

  // Initialize map
  useEffect(() => {
    if (typeof window === 'undefined' || mapRef.current || loading) return;

    // Wait for container to be ready
    const initMap = () => {
      const container = document.getElementById('map-container');
      if (!container) {
        console.error('Map container not found, retrying...');
        setTimeout(initMap, 100);
        return;
      }

      console.log('Initializing map, container size:', container.offsetWidth, 'x', container.offsetHeight);

      // Clear any existing map
      if ((container as any)._leaflet_id) {
        (container as any)._leaflet_id = undefined;
        container.innerHTML = '';
      }

      try {
        const map = L.map('map-container', {
          center: [16.0, 106.0],
          zoom: 6,
          zoomControl: true,
        });

        const tileLayer = L.tileLayer('https://server.arcgisonline.com/ArcGIS/rest/services/World_Street_Map/MapServer/tile/{z}/{y}/{x}', {
          attribution: 'Tiles © Esri',
          maxZoom: 19,
        });

        tileLayer.on('loading', () => console.log('Tiles loading...'));
        tileLayer.on('load', () => console.log('Tiles loaded!'));
        tileLayer.on('tileerror', (e) => console.error('Tile error:', e));

        tileLayer.addTo(map);

        mapRef.current = map;

        console.log('Map initialized successfully');

        // Force resize after a moment
        setTimeout(() => {
          map.invalidateSize();
          console.log('Map resized');
        }, 250);
      } catch (error) {
        console.error('Map init error:', error);
      }
    };

    initMap();

    return () => {
      if (mapRef.current) {
        mapRef.current.remove();
        mapRef.current = null;
      }
    };
  }, [loading]);

  // Add markers when stations load
  useEffect(() => {
    if (!mapRef.current || stations.length === 0) return;

    // Clear old markers
    markersRef.current.forEach(marker => marker.remove());
    markersRef.current = [];

    // Add new markers
    stations.forEach((station) => {
      const data = stationData[station.id];
      const risk = data?.risk_level || 'safe';

      const marker = L.marker([station.latitude, station.longitude], {
        icon: createMarkerIcon(risk),
      }).addTo(mapRef.current!);

      marker.bindPopup(`
        <div style="padding: 6px;">
          <div style="font-weight: bold; margin-bottom: 4px;">${station.name}</div>
          <div style="font-size: 12px; color: #9ca3af;">
            ${station.basin_name || 'N/A'}<br/>
            Mưa: ${data?.current_rainfall?.toFixed(1) || '0'} mm
          </div>
        </div>
      `);

      marker.on('click', () => {
        if (onStationClick) onStationClick(station);
      });

      markersRef.current.push(marker);
    });
  }, [stations, stationData, onStationClick]);

  // Handle selected station
  useEffect(() => {
    if (mapRef.current && selectedStation) {
      mapRef.current.setView([selectedStation.latitude, selectedStation.longitude], 10);
    }
  }, [selectedStation]);

  if (loading) {
    return (
      <div className="w-full h-full flex items-center justify-center bg-gray-900">
        <div className="text-gray-400">Đang tải bản đồ...</div>
      </div>
    );
  }

  return <div id="map-container" className="w-full h-full" />;
}

export default MapComponent;
