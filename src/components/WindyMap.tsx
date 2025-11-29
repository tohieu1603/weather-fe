'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Wind, Droplets, Thermometer, Eye, Cloud, Zap, Waves, MapPin, Menu, X, Satellite, CloudRain } from 'lucide-react';

interface WindyMapProps {
  onStationClick?: (station: any) => void;
  selectedStation?: any | null;
}

export default function WindyMap({ onStationClick, selectedStation }: WindyMapProps) {
  const [overlay, setOverlay] = useState('rain');
  const [showMenu, setShowMenu] = useState(false);

  // Center on Vietnam
  const lat = 16.0;
  const lon = 108.0;
  const zoom = 6;

  const overlayCategories = [
    {
      category: 'Radar & Mây',
      items: [
        { id: 'radar', label: 'Radar thời tiết', icon: CloudRain, color: 'text-blue-400', description: 'Mưa thực tế từ radar' },
        { id: 'satellite', label: 'Vệ tinh', icon: Satellite, color: 'text-purple-400', description: 'Ảnh vệ tinh thời gian thực' },
        { id: 'rain', label: 'Mưa', icon: Droplets, color: 'text-blue-500', description: 'Dự báo lượng mưa' },
        { id: 'rainAccu', label: 'Mưa tích lũy', icon: Droplets, color: 'text-blue-600', description: 'Tổng lượng mưa' },
        { id: 'thunder', label: 'Mưa, sét', icon: Zap, color: 'text-yellow-400', description: 'Dự báo sấm sét' },
        { id: 'clouds', label: 'Mây', icon: Cloud, color: 'text-gray-400', description: 'Độ che phủ mây' },
      ]
    },
    {
      category: 'Gió',
      items: [
        { id: 'wind', label: 'Gió', icon: Wind, color: 'text-cyan-400', description: 'Hướng & tốc độ gió' },
        { id: 'gust', label: 'Gió giật', icon: Wind, color: 'text-cyan-600', description: 'Cường độ gió giật' },
      ]
    },
    {
      category: 'Nhiệt độ & Độ ẩm',
      items: [
        { id: 'temp', label: 'Nhiệt độ', icon: Thermometer, color: 'text-orange-400', description: 'Nhiệt độ không khí' },
        { id: 'dewpoint', label: 'Điểm sương', icon: Thermometer, color: 'text-blue-300', description: 'Độ ẩm không khí' },
      ]
    },
    {
      category: 'Biển & Sóng',
      items: [
        { id: 'waves', label: 'Sóng', icon: Waves, color: 'text-teal-400', description: 'Độ cao sóng biển' },
        { id: 'swell', label: 'Sóng lừng', icon: Waves, color: 'text-teal-600', description: 'Chu kỳ sóng' },
      ]
    },
    {
      category: 'Khác',
      items: [
        { id: 'pressure', label: 'Áp suất', icon: MapPin, color: 'text-indigo-400', description: 'Khí áp bề mặt' },
        { id: 'visibility', label: 'Tầm nhìn', icon: Eye, color: 'text-gray-500', description: 'Độ rõ không khí' },
      ]
    }
  ];

  const getWindyUrl = () => {
    const baseUrl = 'https://embed.windy.com/embed2.html';

    // Map overlay IDs to Windy overlay names
    const overlayMap: Record<string, string> = {
      'radar': 'radar',
      'satellite': 'satellite',
      'rain': 'rain',
      'rainAccu': 'rainAccu',
      'thunder': 'thunder',
      'clouds': 'clouds',
      'wind': 'wind',
      'gust': 'gust',
      'temp': 'temp',
      'dewpoint': 'dewpoint',
      'waves': 'waves',
      'swell': 'swell',
      'pressure': 'pressure',
      'visibility': 'visibility'
    };

    const params = new URLSearchParams({
      lat: lat.toString(),
      lon: lon.toString(),
      detailLat: lat.toString(),
      detailLon: lon.toString(),
      zoom: zoom.toString(),
      level: 'surface',
      overlay: overlayMap[overlay] || 'rain',
      product: 'ecmwf',
      menu: '',
      message: 'true',
      marker: '',
      calendar: 'now',
      pressure: '',
      type: 'map',
      location: 'coordinates',
      detail: '',
      metricWind: 'km/h',
      metricTemp: '°C',
      radarRange: '-1'
    });

    return `${baseUrl}?${params.toString()}`;
  };

  const getCurrentOverlayInfo = () => {
    for (const category of overlayCategories) {
      const item = category.items.find(i => i.id === overlay);
      if (item) return item;
    }
    return overlayCategories[0].items[0];
  };

  const currentOverlay = getCurrentOverlayInfo();

  return (
    <div className="relative w-full h-full bg-gray-900">
      {/* Menu Toggle Button */}
      <motion.button
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
        onClick={() => setShowMenu(!showMenu)}
        className="absolute top-4 right-4 z-[1001] bg-black/40 backdrop-blur-sm rounded-lg p-2 hover:bg-black/60 transition-colors"
        title="Lớp bản đồ"
      >
        {showMenu ? (
          <X className="w-5 h-5 text-white" />
        ) : (
          <Menu className="w-5 h-5 text-white" />
        )}
      </motion.button>

      {/* Layer Menu */}
      <AnimatePresence>
        {showMenu && (
          <motion.div
            initial={{ x: 300, opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            exit={{ x: 300, opacity: 0 }}
            transition={{ type: 'spring', damping: 25, stiffness: 200 }}
            className="absolute top-0 right-0 bottom-0 w-64 bg-gray-900/95 backdrop-blur-md z-[1000] overflow-y-auto shadow-xl"
          >
            <div className="p-3">
              <h2 className="text-base font-bold text-white mb-3">Lớp bản đồ</h2>

              {overlayCategories.map((category) => (
                <div key={category.category} className="mb-4">
                  <h3 className="text-xs font-medium text-gray-500 mb-2 uppercase">
                    {category.category}
                  </h3>
                  <div className="grid grid-cols-2 gap-1">
                    {category.items.map((item) => {
                      const isActive = overlay === item.id;
                      return (
                        <button
                          key={item.id}
                          onClick={() => {
                            setOverlay(item.id);
                            setShowMenu(false);
                          }}
                          className={`
                            px-2 py-1.5 rounded text-xs text-left transition-colors
                            ${isActive
                              ? 'bg-blue-600 text-white'
                              : 'bg-gray-800/50 text-gray-300 hover:bg-gray-700'
                            }
                          `}
                        >
                          {item.label}
                        </button>
                      );
                    })}
                  </div>
                </div>
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Windy Attribution */}
      <div className="absolute bottom-2 right-2 z-[1000] bg-black/30 rounded px-2 py-1 text-xs text-gray-400">
        <a
          href="https://www.windy.com"
          target="_blank"
          rel="noopener noreferrer"
          className="hover:text-white"
        >
          Windy.com
        </a>
      </div>

      {/* Info Badge - Compact */}
      <div className="absolute top-4 left-4 z-[1000] bg-black/40 backdrop-blur-sm rounded-lg px-3 py-2">
        <div className="flex items-center gap-2">
          {(() => {
            const Icon = currentOverlay.icon;
            return <Icon className={`w-4 h-4 ${currentOverlay.color}`} />;
          })()}
          <span className="text-white text-sm font-medium">{currentOverlay.label}</span>
        </div>
      </div>

      {/* Windy Iframe */}
      <iframe
        src={getWindyUrl()}
        width="100%"
        height="100%"
        frameBorder="0"
        style={{ border: 0 }}
        allowFullScreen
        className="w-full h-full"
      />
    </div>
  );
}
