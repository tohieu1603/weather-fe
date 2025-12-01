'use client';

import { useEffect, useRef, useState, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Wind, Thermometer, Cloud, Waves,
  Menu, X, Satellite, CloudRain, Gauge,
  Clock, Play, Pause, ChevronLeft, ChevronRight,
  Layers, MapPin, AlertTriangle
} from 'lucide-react';

// Windy API types
declare global {
  interface Window {
    windyInit: (options: WindyInitOptions, callback: (api: WindyAPI) => void) => void;
    W: any;
    L: any;
  }
}

interface WindyInitOptions {
  key: string;
  lat: number;
  lon: number;
  zoom: number;
  verbose?: boolean;
}

interface WindyAPI {
  map: any;
  store: WindyStore;
  picker: WindyPicker;
  utils: any;
  broadcast: WindyBroadcast;
  overlays: Record<string, any>;
}

interface WindyStore {
  get: (key: string) => any;
  set: (key: string, value: any) => void;
  on: (key: string, callback: (value: any) => void) => void;
  getAllowed: (key: string) => string[];
}

interface WindyPicker {
  open: (options: { lat: number; lon: number }) => void;
  close: () => void;
  on: (event: string, callback: (data: any) => void) => void;
}

interface WindyBroadcast {
  on: (event: string, callback: (...args: any[]) => void) => void;
  once: (event: string, callback: (...args: any[]) => void) => void;
  fire: (event: string, ...args: any[]) => void;
}

interface WindyMapProps {
  onStationClick?: (station: any) => void;
  selectedStation?: any | null;
  stations?: StationData[];
  apiKey?: string;
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

interface PickerData {
  lat: number;
  lon: number;
  values: Record<string, number>;
  overlay: string;
}

// Weather layer configurations - Full API layers
const LAYER_CATEGORIES = [
  {
    category: 'Radar & Satellite',
    icon: Satellite,
    items: [
      { id: 'radar', label: 'Radar', description: 'Radar mưa thực tế' },
      { id: 'satellite', label: 'Vệ tinh', description: 'Ảnh mây vệ tinh' },
    ]
  },
  {
    category: 'Mưa & Giông',
    icon: CloudRain,
    items: [
      { id: 'rain', label: 'Mưa', description: 'Lượng mưa dự báo' },
      { id: 'rainAccu', label: 'Mưa tích lũy', description: 'Tổng lượng mưa' },
      { id: 'thunder', label: 'Giông sét', description: 'Xác suất giông' },
      { id: 'clouds', label: 'Mây', description: 'Độ che phủ mây' },
    ]
  },
  {
    category: 'Gió',
    icon: Wind,
    items: [
      { id: 'wind', label: 'Gió bề mặt', description: 'Gió 10m' },
      { id: 'gust', label: 'Gió giật', description: 'Cường độ gió giật' },
    ]
  },
  {
    category: 'Nhiệt độ',
    icon: Thermometer,
    items: [
      { id: 'temp', label: 'Nhiệt độ', description: 'Nhiệt độ 2m' },
      { id: 'dewpoint', label: 'Điểm sương', description: 'Nhiệt độ điểm sương' },
      { id: 'rh', label: 'Độ ẩm', description: 'Độ ẩm tương đối' },
    ]
  },
  {
    category: 'Áp suất & Tầm nhìn',
    icon: Gauge,
    items: [
      { id: 'pressure', label: 'Áp suất', description: 'Khí áp mực biển' },
      { id: 'visibility', label: 'Tầm nhìn', description: 'Tầm nhìn xa' },
    ]
  },
  {
    category: 'Sóng & Biển',
    icon: Waves,
    items: [
      { id: 'waves', label: 'Sóng', description: 'Độ cao sóng' },
      { id: 'swell1', label: 'Sóng lừng', description: 'Sóng lừng chính' },
      { id: 'currents', label: 'Dòng chảy', description: 'Dòng hải lưu' },
    ]
  },
  {
    category: 'Chất lượng không khí',
    icon: Cloud,
    items: [
      { id: 'pm2p5', label: 'PM2.5', description: 'Bụi mịn PM2.5' },
      { id: 'no2', label: 'NO2', description: 'Nitrogen dioxide' },
      { id: 'cosc', label: 'CO', description: 'Carbon monoxide' },
    ]
  }
];

// Weather models
const WEATHER_MODELS = [
  { id: 'ecmwf', label: 'ECMWF', description: 'Châu Âu - Chính xác nhất' },
  { id: 'gfs', label: 'GFS', description: 'Mỹ - Cập nhật nhanh' },
  { id: 'icon', label: 'ICON', description: 'Đức' },
];

// Risk level colors for station markers
const RISK_COLORS: Record<string, string> = {
  safe: '#22c55e',
  watch: '#eab308',
  warning: '#f97316',
  danger: '#ef4444',
};

// Hardcoded API key
const WINDY_API_KEY = 'wx4i4uC0wLr8c7QzgdjDS4UzmlObgv2m';

export default function WindyMapAPI({
  onStationClick,
  selectedStation: _selectedStation,
  stations = [],
}: WindyMapProps) {
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const windyApiRef = useRef<WindyAPI | null>(null);
  const markersRef = useRef<any[]>([]);
  const scriptsLoadedRef = useRef(false);
  const initAttemptedRef = useRef(false);

  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [showMenu, setShowMenu] = useState(false);
  const [activeCategory, setActiveCategory] = useState<string | null>(null);
  const [currentOverlay, setCurrentOverlay] = useState('rain');
  const [currentModel, setCurrentModel] = useState('ecmwf');

  const [pickerData, setPickerData] = useState<PickerData | null>(null);
  const [showPicker, setShowPicker] = useState(false);

  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState<Date>(new Date());

  // Initialize Windy after scripts are loaded
  const initWindy = useCallback(() => {
    if (initAttemptedRef.current) return;
    if (!mapContainerRef.current) {
      console.log('Map container not ready');
      return;
    }
    if (typeof window.windyInit !== 'function') {
      console.log('windyInit not available');
      return;
    }

    initAttemptedRef.current = true;
    console.log('Initializing Windy with key:', WINDY_API_KEY.substring(0, 8) + '...');

    const options: WindyInitOptions = {
      key: WINDY_API_KEY,
      lat: 16.0,
      lon: 108.0,
      zoom: 6,
      verbose: true,
    };

    try {
      window.windyInit(options, (api: WindyAPI) => {
        console.log('Windy initialized successfully');
        windyApiRef.current = api;
        const { map, store, picker, broadcast } = api;

        // Set initial overlay and model
        store.set('overlay', currentOverlay);
        store.set('product', currentModel);

        // Listen for overlay changes
        store.on('overlay', (overlay: string) => {
          setCurrentOverlay(overlay);
        });

        // Listen for time changes
        broadcast.on('redrawFinished', () => {
          const timestamp = store.get('timestamp');
          if (timestamp) {
            setCurrentTime(new Date(timestamp));
          }
        });

        // Setup picker
        picker.on('pickerOpened', (data: any) => {
          setPickerData({
            lat: data.lat,
            lon: data.lon,
            values: data.values || {},
            overlay: store.get('overlay'),
          });
          setShowPicker(true);
        });

        picker.on('pickerClosed', () => {
          setShowPicker(false);
          setPickerData(null);
        });

        // Add click handler for picker
        map.on('click', (e: any) => {
          picker.open({ lat: e.latlng.lat, lon: e.latlng.lng });
        });

        // Add station markers if available
        if (stations.length > 0) {
          addStationMarkers(map, stations);
        }

        setIsLoading(false);
        setError(null);
      });
    } catch (err) {
      console.error('Windy init error:', err);
      setError('Lỗi khởi tạo Windy: ' + (err as Error).message);
      setIsLoading(false);
    }
  }, [currentOverlay, currentModel, stations]);

  // Add station markers to map
  const addStationMarkers = useCallback((map: any, stationList: StationData[]) => {
    if (!window.L || !stationList.length) return;

    // Clear existing markers
    markersRef.current.forEach(marker => {
      try { marker.remove(); } catch (e) { /* ignore */ }
    });
    markersRef.current = [];

    stationList.forEach(station => {
      const color = RISK_COLORS[station.riskLevel || 'safe'];

      const icon = window.L.divIcon({
        className: 'custom-station-marker',
        html: `
          <div style="
            width: 20px;
            height: 20px;
            background: ${color};
            border: 2px solid white;
            border-radius: 50%;
            box-shadow: 0 2px 4px rgba(0,0,0,0.3);
          "></div>
        `,
        iconSize: [20, 20],
        iconAnchor: [10, 10],
      });

      const marker = window.L.marker([station.lat, station.lon], { icon })
        .addTo(map)
        .bindPopup(`
          <div style="min-width: 120px;">
            <strong>${station.name}</strong>
            ${station.value !== undefined ? `<br/>Giá trị: ${station.value} ${station.unit || ''}` : ''}
          </div>
        `);

      marker.on('click', () => {
        if (onStationClick) onStationClick(station);
      });

      markersRef.current.push(marker);
    });
  }, [onStationClick]);

  // Load scripts and initialize
  useEffect(() => {
    if (typeof window === 'undefined') return;
    if (scriptsLoadedRef.current) return;

    scriptsLoadedRef.current = true;
    setIsLoading(true);

    // Check if Leaflet already exists
    const leafletExists = typeof window.L !== 'undefined';
    const windyExists = typeof window.windyInit === 'function';

    if (leafletExists && windyExists) {
      // Already loaded, just init
      setTimeout(initWindy, 100);
      return;
    }

    // Load Leaflet CSS
    if (!document.querySelector('link[href*="leaflet"]')) {
      const leafletCss = document.createElement('link');
      leafletCss.rel = 'stylesheet';
      leafletCss.href = 'https://unpkg.com/leaflet@1.4.0/dist/leaflet.css';
      document.head.appendChild(leafletCss);
    }

    // Load Leaflet JS
    const loadLeaflet = () => {
      return new Promise<void>((resolve, reject) => {
        if (typeof window.L !== 'undefined') {
          resolve();
          return;
        }
        const script = document.createElement('script');
        script.src = 'https://unpkg.com/leaflet@1.4.0/dist/leaflet.js';
        script.onload = () => resolve();
        script.onerror = () => reject(new Error('Failed to load Leaflet'));
        document.head.appendChild(script);
      });
    };

    // Load Windy API
    const loadWindy = () => {
      return new Promise<void>((resolve, reject) => {
        if (typeof window.windyInit === 'function') {
          resolve();
          return;
        }
        const script = document.createElement('script');
        script.src = 'https://api.windy.com/assets/map-forecast/libBoot.js';
        script.onload = () => {
          // Wait a bit for windyInit to be available
          setTimeout(() => {
            if (typeof window.windyInit === 'function') {
              resolve();
            } else {
              reject(new Error('windyInit not available after script load'));
            }
          }, 500);
        };
        script.onerror = () => reject(new Error('Failed to load Windy API'));
        document.head.appendChild(script);
      });
    };

    // Load both scripts then init
    loadLeaflet()
      .then(() => loadWindy())
      .then(() => {
        console.log('All scripts loaded');
        // Wait for DOM to be ready
        setTimeout(initWindy, 200);
      })
      .catch((err) => {
        console.error('Script loading error:', err);
        setError(err.message);
        setIsLoading(false);
      });

    return () => {
      markersRef.current.forEach(marker => {
        try { marker.remove(); } catch (e) { /* ignore */ }
      });
    };
  }, [initWindy]);

  // Update markers when stations change
  useEffect(() => {
    if (windyApiRef.current?.map && stations.length > 0) {
      addStationMarkers(windyApiRef.current.map, stations);
    }
  }, [stations, addStationMarkers]);

  // Change overlay
  const handleOverlayChange = (overlayId: string) => {
    if (windyApiRef.current) {
      windyApiRef.current.store.set('overlay', overlayId);
      setCurrentOverlay(overlayId);
    }
  };

  // Change model
  const handleModelChange = (modelId: string) => {
    if (windyApiRef.current) {
      windyApiRef.current.store.set('product', modelId);
      setCurrentModel(modelId);
    }
  };

  // Timeline controls
  const handlePlayPause = () => {
    if (windyApiRef.current) {
      windyApiRef.current.broadcast.fire(isPlaying ? 'stop' : 'play');
      setIsPlaying(!isPlaying);
    }
  };

  const handleTimeStep = (direction: 'prev' | 'next') => {
    if (windyApiRef.current) {
      windyApiRef.current.broadcast.fire(direction === 'prev' ? 'timestampPrev' : 'timestampNext');
    }
  };

  // Get current overlay info
  const getCurrentOverlayInfo = () => {
    for (const category of LAYER_CATEGORIES) {
      const item = category.items.find(i => i.id === currentOverlay);
      if (item) return { ...item, category: category.category };
    }
    return { id: currentOverlay, label: currentOverlay, description: '', category: '' };
  };

  const overlayInfo = getCurrentOverlayInfo();

  // Error state
  if (error) {
    return (
      <div className="w-full h-full bg-gray-900 flex items-center justify-center">
        <div className="text-center text-red-400">
          <AlertTriangle className="w-12 h-12 mx-auto mb-4" />
          <p>{error}</p>
          <p className="text-sm text-gray-500 mt-2">Vui lòng kiểm tra kết nối mạng</p>
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
      {/* Map Container - MUST have id="windy" for Windy API */}
      <div
        ref={mapContainerRef}
        id="windy"
        className="w-full h-full"
        style={{ minHeight: '400px' }}
      />

      {/* Loading Overlay */}
      {isLoading && (
        <div className="absolute inset-0 bg-gray-900/80 flex items-center justify-center z-[2000]">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500 mx-auto mb-4"></div>
            <p className="text-white">Đang tải Windy Map...</p>
          </div>
        </div>
      )}

      {/* Top Left - Current Overlay Info */}
      {!isLoading && (
        <div className="absolute top-4 left-4 z-[1000] bg-black/60 backdrop-blur-sm rounded-lg px-4 py-2">
          <div className="flex items-center gap-3">
            <Layers className="w-5 h-5 text-blue-400" />
            <div>
              <p className="text-white font-medium">{overlayInfo.label}</p>
              <p className="text-gray-400 text-xs">{overlayInfo.description}</p>
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
          className="absolute top-4 right-4 z-[1001] bg-black/60 backdrop-blur-sm rounded-lg p-3 hover:bg-black/80 transition-colors"
        >
          {showMenu ? (
            <X className="w-5 h-5 text-white" />
          ) : (
            <Menu className="w-5 h-5 text-white" />
          )}
        </motion.button>
      )}

      {/* Layer Menu */}
      <AnimatePresence>
        {showMenu && (
          <motion.div
            initial={{ x: 320, opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            exit={{ x: 320, opacity: 0 }}
            transition={{ type: 'spring', damping: 25, stiffness: 200 }}
            className="absolute top-0 right-0 bottom-0 w-80 bg-gray-900/95 backdrop-blur-md z-[1000] overflow-hidden shadow-2xl flex flex-col"
          >
            {/* Header */}
            <div className="p-4 border-b border-gray-700">
              <h2 className="text-lg font-bold text-white flex items-center gap-2">
                <Layers className="w-5 h-5" />
                Lớp bản đồ
              </h2>
            </div>

            {/* Weather Model Selector */}
            <div className="p-4 border-b border-gray-700">
              <h3 className="text-xs font-medium text-gray-500 mb-2 uppercase">Mô hình thời tiết</h3>
              <div className="flex flex-wrap gap-1">
                {WEATHER_MODELS.map(model => (
                  <button
                    key={model.id}
                    onClick={() => handleModelChange(model.id)}
                    className={`px-3 py-1.5 rounded text-xs transition-colors ${
                      currentModel === model.id
                        ? 'bg-blue-600 text-white'
                        : 'bg-gray-800 text-gray-300 hover:bg-gray-700'
                    }`}
                    title={model.description}
                  >
                    {model.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Layer Categories */}
            <div className="flex-1 overflow-y-auto p-4">
              {LAYER_CATEGORIES.map((category) => {
                const CategoryIcon = category.icon;
                const isExpanded = activeCategory === category.category;

                return (
                  <div key={category.category} className="mb-3">
                    <button
                      onClick={() => setActiveCategory(isExpanded ? null : category.category)}
                      className="w-full flex items-center justify-between p-2 rounded-lg bg-gray-800/50 hover:bg-gray-800 transition-colors"
                    >
                      <div className="flex items-center gap-2">
                        <CategoryIcon className="w-4 h-4 text-blue-400" />
                        <span className="text-sm font-medium text-white">{category.category}</span>
                      </div>
                      <ChevronRight className={`w-4 h-4 text-gray-400 transition-transform ${isExpanded ? 'rotate-90' : ''}`} />
                    </button>

                    <AnimatePresence>
                      {isExpanded && (
                        <motion.div
                          initial={{ height: 0, opacity: 0 }}
                          animate={{ height: 'auto', opacity: 1 }}
                          exit={{ height: 0, opacity: 0 }}
                          className="overflow-hidden"
                        >
                          <div className="grid grid-cols-2 gap-1 mt-2 pl-6">
                            {category.items.map((item) => (
                              <button
                                key={item.id}
                                onClick={() => {
                                  handleOverlayChange(item.id);
                                }}
                                className={`px-2 py-1.5 rounded text-xs text-left transition-colors ${
                                  currentOverlay === item.id
                                    ? 'bg-blue-600 text-white'
                                    : 'bg-gray-800/50 text-gray-300 hover:bg-gray-700'
                                }`}
                                title={item.description}
                              >
                                {item.label}
                              </button>
                            ))}
                          </div>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </div>
                );
              })}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Bottom - Timeline Controls */}
      {!isLoading && (
        <div className="absolute bottom-4 left-1/2 -translate-x-1/2 z-[1000] bg-black/60 backdrop-blur-sm rounded-lg px-4 py-2">
          <div className="flex items-center gap-4">
            <button
              onClick={() => handleTimeStep('prev')}
              className="p-2 hover:bg-white/10 rounded transition-colors"
              title="Giờ trước"
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
              onClick={() => handleTimeStep('next')}
              className="p-2 hover:bg-white/10 rounded transition-colors"
              title="Giờ sau"
            >
              <ChevronRight className="w-5 h-5 text-white" />
            </button>

            <div className="flex items-center gap-2 text-white text-sm border-l border-gray-600 pl-4">
              <Clock className="w-4 h-4 text-gray-400" />
              <span>{currentTime.toLocaleString('vi-VN', {
                weekday: 'short',
                day: '2-digit',
                month: '2-digit',
                hour: '2-digit',
                minute: '2-digit'
              })}</span>
            </div>
          </div>
        </div>
      )}

      {/* Picker Info Popup */}
      <AnimatePresence>
        {showPicker && pickerData && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 20 }}
            className="absolute bottom-20 left-1/2 -translate-x-1/2 z-[1000] bg-black/80 backdrop-blur-sm rounded-lg p-4 min-w-[200px]"
          >
            <div className="flex items-center gap-2 mb-2">
              <MapPin className="w-4 h-4 text-blue-400" />
              <span className="text-white text-sm">
                {pickerData.lat.toFixed(4)}°, {pickerData.lon.toFixed(4)}°
              </span>
            </div>
            <div className="text-gray-300 text-sm">
              {Object.entries(pickerData.values).map(([key, value]) => (
                <div key={key} className="flex justify-between gap-4">
                  <span className="text-gray-500">{key}:</span>
                  <span className="font-medium">{typeof value === 'number' ? value.toFixed(1) : value}</span>
                </div>
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Windy Attribution */}
      {!isLoading && (
        <div className="absolute bottom-4 right-4 z-[1000] bg-black/40 rounded px-2 py-1">
          <a
            href="https://www.windy.com"
            target="_blank"
            rel="noopener noreferrer"
            className="text-xs text-gray-400 hover:text-white"
          >
            Powered by Windy.com
          </a>
        </div>
      )}
    </div>
  );
}
