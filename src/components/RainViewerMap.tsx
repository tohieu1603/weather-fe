'use client';

import { useEffect, useRef, useState, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  CloudRain, Play, Pause, ChevronLeft, ChevronRight,
  Clock, Layers, MapPin, RefreshCw, Satellite,
  Menu, X, Eye, EyeOff
} from 'lucide-react';

// Leaflet types
declare global {
  interface Window {
    L: any;
  }
}

interface RainViewerMapProps {
  onStationClick?: (station: StationData) => void;
  stations?: StationData[];
}

interface StationData {
  id: string;
  name: string;
  lat: number;
  lon: number;
  riskLevel?: 'safe' | 'watch' | 'warning' | 'danger';
  value?: number;
  unit?: string;
}

interface RadarFrame {
  time: number;
  path: string;
}

interface WeatherMapsData {
  version: string;
  generated: number;
  host: string;
  radar: {
    past: RadarFrame[];
    nowcast: RadarFrame[];
  };
  satellite?: {
    infrared: RadarFrame[];
  };
}

// Color schemes for radar
const COLOR_SCHEMES = [
  { id: 0, name: 'Gốc', description: 'Black and White' },
  { id: 1, name: 'Toàn cầu', description: 'Universal Blue' },
  { id: 2, name: 'TITAN', description: 'TITAN' },
  { id: 3, name: 'TWC', description: 'The Weather Channel' },
  { id: 4, name: 'Meteored', description: 'Meteored' },
  { id: 5, name: 'NEXRAD III', description: 'NEXRAD Level III' },
  { id: 6, name: 'Rainbow', description: 'Rainbow @ SELEX-SI' },
  { id: 7, name: 'Dark Sky', description: 'Dark Sky' },
  { id: 8, name: 'Thời tiết', description: 'Weather Underground' },
];

// Risk level colors for station markers
const RISK_COLORS: Record<string, string> = {
  safe: '#22c55e',
  watch: '#eab308',
  warning: '#f97316',
  danger: '#ef4444',
};

// Vietnam center coordinates
const VIETNAM_CENTER = { lat: 16.0, lon: 108.0 };
const DEFAULT_ZOOM = 6;

export default function RainViewerMap({
  onStationClick,
  stations = [],
}: RainViewerMapProps) {
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<any>(null);
  const radarLayerRef = useRef<any>(null);
  const satelliteLayerRef = useRef<any>(null);
  const markersRef = useRef<any[]>([]);
  const animationTimerRef = useRef<NodeJS.Timeout | null>(null);
  const initializingRef = useRef(false);

  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [weatherData, setWeatherData] = useState<WeatherMapsData | null>(null);
  const [allFrames, setAllFrames] = useState<RadarFrame[]>([]);
  const [currentFrameIndex, setCurrentFrameIndex] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);

  const [showMenu, setShowMenu] = useState(false);
  const [colorScheme, setColorScheme] = useState(6); // Rainbow default
  const [smoothData, setSmoothData] = useState(1);
  const [showSnow, setShowSnow] = useState(1);
  const [opacity, setOpacity] = useState(0.7);

  const [showRadar, setShowRadar] = useState(true);
  const [showSatellite, setShowSatellite] = useState(false);

  const [clickedLocation, setClickedLocation] = useState<{lat: number; lon: number} | null>(null);

  // Fetch weather maps data from RainViewer API
  const fetchWeatherData = useCallback(async () => {
    try {
      const response = await fetch('https://api.rainviewer.com/public/weather-maps.json');
      const data: WeatherMapsData = await response.json();
      setWeatherData(data);

      // Combine past + nowcast frames
      const frames = [...data.radar.past, ...data.radar.nowcast];
      setAllFrames(frames);

      // Set to latest past frame (current time)
      const pastLength = data.radar.past.length;
      setCurrentFrameIndex(pastLength > 0 ? pastLength - 1 : 0);

      return data;
    } catch (err) {
      console.error('Failed to fetch RainViewer data:', err);
      setError('Không thể tải dữ liệu radar');
      return null;
    }
  }, []);

  // Build tile URL
  const buildTileUrl = useCallback((frame: RadarFrame, host: string) => {
    // Format: {host}{path}/{size}/{z}/{x}/{y}/{color}/{smooth}_{snow}.png
    return `${host}${frame.path}/256/{z}/{x}/{y}/${colorScheme}/${smoothData}_${showSnow}.png`;
  }, [colorScheme, smoothData, showSnow]);

  // Update radar layer
  const updateRadarLayer = useCallback(() => {
    if (!mapRef.current || !weatherData || allFrames.length === 0) return;
    if (!showRadar) {
      if (radarLayerRef.current) {
        mapRef.current.removeLayer(radarLayerRef.current);
        radarLayerRef.current = null;
      }
      return;
    }

    const frame = allFrames[currentFrameIndex];
    if (!frame) return;

    const tileUrl = buildTileUrl(frame, weatherData.host);

    // Remove old layer
    if (radarLayerRef.current) {
      mapRef.current.removeLayer(radarLayerRef.current);
    }

    // Add new layer
    radarLayerRef.current = window.L.tileLayer(tileUrl, {
      opacity: opacity,
      zIndex: 100,
    }).addTo(mapRef.current);
  }, [weatherData, allFrames, currentFrameIndex, showRadar, opacity, buildTileUrl]);

  // Update satellite layer
  const updateSatelliteLayer = useCallback(() => {
    if (!mapRef.current || !weatherData) return;
    if (!showSatellite || !weatherData.satellite?.infrared?.length) {
      if (satelliteLayerRef.current) {
        mapRef.current.removeLayer(satelliteLayerRef.current);
        satelliteLayerRef.current = null;
      }
      return;
    }

    const frame = weatherData.satellite.infrared[weatherData.satellite.infrared.length - 1];
    if (!frame) return;

    const tileUrl = `${weatherData.host}${frame.path}/256/{z}/{x}/{y}/0/0_0.png`;

    if (satelliteLayerRef.current) {
      mapRef.current.removeLayer(satelliteLayerRef.current);
    }

    satelliteLayerRef.current = window.L.tileLayer(tileUrl, {
      opacity: 0.5,
      zIndex: 50,
    }).addTo(mapRef.current);
  }, [weatherData, showSatellite]);

  // Animation control
  const playAnimation = useCallback(() => {
    if (animationTimerRef.current) {
      clearInterval(animationTimerRef.current);
    }

    animationTimerRef.current = setInterval(() => {
      setCurrentFrameIndex(prev => {
        const next = prev + 1;
        return next >= allFrames.length ? 0 : next;
      });
    }, 500); // 500ms per frame
  }, [allFrames.length]);

  const stopAnimation = useCallback(() => {
    if (animationTimerRef.current) {
      clearInterval(animationTimerRef.current);
      animationTimerRef.current = null;
    }
  }, []);

  const handlePlayPause = () => {
    if (isPlaying) {
      stopAnimation();
    } else {
      playAnimation();
    }
    setIsPlaying(!isPlaying);
  };

  const handlePrevFrame = () => {
    stopAnimation();
    setIsPlaying(false);
    setCurrentFrameIndex(prev => (prev > 0 ? prev - 1 : allFrames.length - 1));
  };

  const handleNextFrame = () => {
    stopAnimation();
    setIsPlaying(false);
    setCurrentFrameIndex(prev => (prev < allFrames.length - 1 ? prev + 1 : 0));
  };

  // Add station markers
  const addStationMarkers = useCallback((map: any) => {
    if (!window.L || !stations.length) return;

    // Clear existing markers
    markersRef.current.forEach(marker => {
      try { marker.remove(); } catch (e) { /* ignore */ }
    });
    markersRef.current = [];

    stations.forEach(station => {
      const color = RISK_COLORS[station.riskLevel || 'safe'];

      const icon = window.L.divIcon({
        className: 'custom-station-marker',
        html: `
          <div style="
            width: 16px;
            height: 16px;
            background: ${color};
            border: 2px solid white;
            border-radius: 50%;
            box-shadow: 0 2px 4px rgba(0,0,0,0.3);
          "></div>
        `,
        iconSize: [16, 16],
        iconAnchor: [8, 8],
      });

      const marker = window.L.marker([station.lat, station.lon], { icon })
        .addTo(map)
        .bindPopup(`
          <div style="min-width: 100px;">
            <strong>${station.name}</strong>
            ${station.value !== undefined ? `<br/>Giá trị: ${station.value} ${station.unit || ''}` : ''}
          </div>
        `);

      marker.on('click', () => {
        if (onStationClick) onStationClick(station);
      });

      markersRef.current.push(marker);
    });
  }, [stations, onStationClick]);

  // Initialize map - runs once on mount
  useEffect(() => {
    if (typeof window === 'undefined') return;

    let mounted = true;

    const initMap = async () => {
      // Prevent double init
      if (mapRef.current) return;
      if (initializingRef.current) return;
      initializingRef.current = true;

      try {
        // Load Leaflet CSS
        if (!document.querySelector('link[href*="leaflet"]')) {
          const css = document.createElement('link');
          css.rel = 'stylesheet';
          css.href = 'https://unpkg.com/leaflet@1.9.4/dist/leaflet.css';
          document.head.appendChild(css);
        }

        // Load Leaflet JS
        if (typeof window.L === 'undefined') {
          await new Promise<void>((resolve, reject) => {
            const existing = document.querySelector('script[src*="leaflet"]');
            if (existing) {
              // Wait for existing script
              const check = setInterval(() => {
                if (window.L) {
                  clearInterval(check);
                  resolve();
                }
              }, 50);
              setTimeout(() => {
                clearInterval(check);
                reject(new Error('Leaflet load timeout'));
              }, 5000);
              return;
            }
            const script = document.createElement('script');
            script.src = 'https://unpkg.com/leaflet@1.9.4/dist/leaflet.js';
            script.onload = () => resolve();
            script.onerror = () => reject(new Error('Failed to load Leaflet'));
            document.head.appendChild(script);
          });
        }

        if (!mounted) return;

        // Wait for container to be ready
        await new Promise(resolve => setTimeout(resolve, 50));

        if (!mapContainerRef.current || !mounted) return;

        // Check if container already has a map
        if ((mapContainerRef.current as any)._leaflet_id) {
          setIsLoading(false);
          return;
        }

        // Create map
        const map = window.L.map(mapContainerRef.current, {
          center: [VIETNAM_CENTER.lat, VIETNAM_CENTER.lon],
          zoom: DEFAULT_ZOOM,
          zoomControl: true,
        });

        // Add base tile layer (OpenStreetMap)
        window.L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
          attribution: '&copy; OpenStreetMap',
          maxZoom: 19,
        }).addTo(map);

        // Map click handler
        map.on('click', (e: any) => {
          setClickedLocation({ lat: e.latlng.lat, lon: e.latlng.lng });
        });

        mapRef.current = map;

        // Fetch weather data
        const response = await fetch('https://api.rainviewer.com/public/weather-maps.json');
        const data: WeatherMapsData = await response.json();

        if (!mounted) return;

        setWeatherData(data);
        const frames = [...data.radar.past, ...data.radar.nowcast];
        setAllFrames(frames);
        setCurrentFrameIndex(data.radar.past.length > 0 ? data.radar.past.length - 1 : 0);

        setIsLoading(false);
      } catch (err) {
        console.error('Map init error:', err);
        if (mounted) {
          setError('Lỗi khởi tạo bản đồ: ' + (err as Error).message);
          setIsLoading(false);
        }
      }
    };

    initMap();

    return () => {
      mounted = false;
      if (animationTimerRef.current) {
        clearInterval(animationTimerRef.current);
      }
      if (mapRef.current) {
        mapRef.current.remove();
        mapRef.current = null;
      }
      initializingRef.current = false;
    };
  }, []); // Empty deps - run once

  // Update radar layer when frame or settings change
  useEffect(() => {
    updateRadarLayer();
  }, [updateRadarLayer]);

  // Update satellite layer
  useEffect(() => {
    updateSatelliteLayer();
  }, [updateSatelliteLayer]);

  // Update markers when stations change
  useEffect(() => {
    if (mapRef.current) {
      addStationMarkers(mapRef.current);
    }
  }, [stations, addStationMarkers]);

  // Refresh data periodically (every 5 minutes)
  useEffect(() => {
    const interval = setInterval(fetchWeatherData, 5 * 60 * 1000);
    return () => clearInterval(interval);
  }, [fetchWeatherData]);

  // Format timestamp
  const formatTime = (timestamp: number) => {
    const date = new Date(timestamp * 1000);
    return date.toLocaleString('vi-VN', {
      weekday: 'short',
      day: '2-digit',
      month: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  // Current frame info
  const currentFrame = allFrames[currentFrameIndex];
  const isPastFrame = weatherData ? currentFrameIndex < weatherData.radar.past.length : true;

  if (error) {
    return (
      <div className="w-full h-full bg-gray-900 flex items-center justify-center">
        <div className="text-center text-red-400">
          <CloudRain className="w-12 h-12 mx-auto mb-4" />
          <p>{error}</p>
          <button
            onClick={() => window.location.reload()}
            className="mt-4 px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
          >
            Tải lại
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="relative w-full h-full bg-gray-900">
      {/* Map Container */}
      <div
        ref={mapContainerRef}
        className="w-full h-full"
        style={{ minHeight: '400px' }}
      />

      {/* Loading Overlay */}
      {isLoading && (
        <div className="absolute inset-0 bg-gray-900/80 flex items-center justify-center z-[2000]">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500 mx-auto mb-4"></div>
            <p className="text-white">Đang tải RainViewer...</p>
          </div>
        </div>
      )}

      {/* Top Left - Layer Info */}
      {!isLoading && (
        <div className="absolute top-4 left-4 z-[1000] bg-black/70 backdrop-blur-sm rounded-lg px-4 py-2">
          <div className="flex items-center gap-3">
            <CloudRain className="w-5 h-5 text-blue-400" />
            <div>
              <p className="text-white font-medium">Radar Mưa</p>
              <p className="text-gray-400 text-xs">
                {isPastFrame ? 'Quá khứ' : 'Dự báo'} • {COLOR_SCHEMES[colorScheme].name}
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Top Right - Menu Toggle */}
      {!isLoading && (
        <motion.button
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          onClick={() => setShowMenu(!showMenu)}
          className="absolute top-4 right-4 z-[1001] bg-black/70 backdrop-blur-sm rounded-lg p-3 hover:bg-black/90 transition-colors"
        >
          {showMenu ? (
            <X className="w-5 h-5 text-white" />
          ) : (
            <Menu className="w-5 h-5 text-white" />
          )}
        </motion.button>
      )}

      {/* Settings Menu */}
      <AnimatePresence>
        {showMenu && (
          <motion.div
            initial={{ x: 320, opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            exit={{ x: 320, opacity: 0 }}
            transition={{ type: 'spring', damping: 25, stiffness: 200 }}
            className="absolute top-0 right-0 bottom-0 w-80 bg-gray-900/95 backdrop-blur-md z-[1000] overflow-y-auto shadow-2xl"
          >
            {/* Header */}
            <div className="p-4 border-b border-gray-700">
              <h2 className="text-lg font-bold text-white flex items-center gap-2">
                <Layers className="w-5 h-5" />
                Cài đặt Radar
              </h2>
            </div>

            {/* Layers Toggle */}
            <div className="p-4 border-b border-gray-700">
              <h3 className="text-xs font-medium text-gray-500 mb-3 uppercase">Lớp bản đồ</h3>
              <div className="space-y-2">
                <button
                  onClick={() => setShowRadar(!showRadar)}
                  className={`w-full flex items-center justify-between p-2 rounded-lg transition-colors ${
                    showRadar ? 'bg-blue-600/20 border border-blue-500' : 'bg-gray-800'
                  }`}
                >
                  <div className="flex items-center gap-2">
                    <CloudRain className="w-4 h-4" />
                    <span className="text-white text-sm">Radar Mưa</span>
                  </div>
                  {showRadar ? <Eye className="w-4 h-4 text-blue-400" /> : <EyeOff className="w-4 h-4 text-gray-500" />}
                </button>

                <button
                  onClick={() => setShowSatellite(!showSatellite)}
                  className={`w-full flex items-center justify-between p-2 rounded-lg transition-colors ${
                    showSatellite ? 'bg-purple-600/20 border border-purple-500' : 'bg-gray-800'
                  }`}
                >
                  <div className="flex items-center gap-2">
                    <Satellite className="w-4 h-4" />
                    <span className="text-white text-sm">Vệ tinh hồng ngoại</span>
                  </div>
                  {showSatellite ? <Eye className="w-4 h-4 text-purple-400" /> : <EyeOff className="w-4 h-4 text-gray-500" />}
                </button>
              </div>
            </div>

            {/* Color Scheme */}
            <div className="p-4 border-b border-gray-700">
              <h3 className="text-xs font-medium text-gray-500 mb-3 uppercase">Bảng màu</h3>
              <div className="grid grid-cols-3 gap-1">
                {COLOR_SCHEMES.map(scheme => (
                  <button
                    key={scheme.id}
                    onClick={() => setColorScheme(scheme.id)}
                    className={`px-2 py-1.5 rounded text-xs transition-colors ${
                      colorScheme === scheme.id
                        ? 'bg-blue-600 text-white'
                        : 'bg-gray-800 text-gray-300 hover:bg-gray-700'
                    }`}
                    title={scheme.description}
                  >
                    {scheme.name}
                  </button>
                ))}
              </div>
            </div>

            {/* Opacity */}
            <div className="p-4 border-b border-gray-700">
              <h3 className="text-xs font-medium text-gray-500 mb-3 uppercase">Độ trong suốt: {Math.round(opacity * 100)}%</h3>
              <input
                type="range"
                min="0.1"
                max="1"
                step="0.1"
                value={opacity}
                onChange={(e) => setOpacity(parseFloat(e.target.value))}
                className="w-full"
              />
            </div>

            {/* Options */}
            <div className="p-4">
              <h3 className="text-xs font-medium text-gray-500 mb-3 uppercase">Tùy chọn</h3>
              <div className="space-y-2">
                <label className="flex items-center gap-2 text-white text-sm">
                  <input
                    type="checkbox"
                    checked={smoothData === 1}
                    onChange={(e) => setSmoothData(e.target.checked ? 1 : 0)}
                    className="rounded"
                  />
                  Làm mịn dữ liệu
                </label>
                <label className="flex items-center gap-2 text-white text-sm">
                  <input
                    type="checkbox"
                    checked={showSnow === 1}
                    onChange={(e) => setShowSnow(e.target.checked ? 1 : 0)}
                    className="rounded"
                  />
                  Hiển thị tuyết
                </label>
              </div>
            </div>

            {/* Refresh Button */}
            <div className="p-4">
              <button
                onClick={fetchWeatherData}
                className="w-full flex items-center justify-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
              >
                <RefreshCw className="w-4 h-4" />
                Làm mới dữ liệu
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Bottom - Timeline Controls */}
      {!isLoading && allFrames.length > 0 && (
        <div className="absolute bottom-4 left-1/2 -translate-x-1/2 z-[1000] bg-black/70 backdrop-blur-sm rounded-lg px-4 py-3">
          <div className="flex items-center gap-4">
            {/* Playback controls */}
            <button
              onClick={handlePrevFrame}
              className="p-2 hover:bg-white/10 rounded transition-colors"
              title="Frame trước"
            >
              <ChevronLeft className="w-5 h-5 text-white" />
            </button>

            <button
              onClick={handlePlayPause}
              className="p-2 bg-blue-600 hover:bg-blue-700 rounded transition-colors"
              title={isPlaying ? 'Dừng' : 'Phát'}
            >
              {isPlaying ? (
                <Pause className="w-5 h-5 text-white" />
              ) : (
                <Play className="w-5 h-5 text-white" />
              )}
            </button>

            <button
              onClick={handleNextFrame}
              className="p-2 hover:bg-white/10 rounded transition-colors"
              title="Frame sau"
            >
              <ChevronRight className="w-5 h-5 text-white" />
            </button>

            {/* Timeline info */}
            <div className="flex items-center gap-2 text-white text-sm border-l border-gray-600 pl-4">
              <Clock className="w-4 h-4 text-gray-400" />
              <span>
                {currentFrame ? formatTime(currentFrame.time) : '--'}
              </span>
              <span className={`px-2 py-0.5 rounded text-xs ${
                isPastFrame ? 'bg-gray-600' : 'bg-green-600'
              }`}>
                {isPastFrame ? 'Quá khứ' : 'Dự báo'}
              </span>
            </div>

            {/* Progress bar */}
            <div className="w-32 h-1 bg-gray-700 rounded-full overflow-hidden">
              <div
                className="h-full bg-blue-500 transition-all duration-200"
                style={{ width: `${(currentFrameIndex / (allFrames.length - 1)) * 100}%` }}
              />
            </div>
          </div>
        </div>
      )}

      {/* Clicked Location Info */}
      <AnimatePresence>
        {clickedLocation && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 20 }}
            className="absolute bottom-24 left-1/2 -translate-x-1/2 z-[1000] bg-black/80 backdrop-blur-sm rounded-lg p-3"
          >
            <div className="flex items-center gap-2 text-white text-sm">
              <MapPin className="w-4 h-4 text-blue-400" />
              <span>
                {clickedLocation.lat.toFixed(4)}°, {clickedLocation.lon.toFixed(4)}°
              </span>
              <button
                onClick={() => setClickedLocation(null)}
                className="ml-2 p-1 hover:bg-white/10 rounded"
              >
                <X className="w-3 h-3" />
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Attribution */}
      {!isLoading && (
        <div className="absolute bottom-4 right-4 z-[1000] bg-black/50 rounded px-2 py-1">
          <a
            href="https://www.rainviewer.com"
            target="_blank"
            rel="noopener noreferrer"
            className="text-xs text-gray-400 hover:text-white"
          >
            Radar by RainViewer
          </a>
        </div>
      )}
    </div>
  );
}
