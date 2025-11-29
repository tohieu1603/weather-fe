'use client';

import { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, AlertTriangle, Droplets, MapPin, TrendingUp, Calendar } from 'lucide-react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { format } from 'date-fns';

interface Station {
  id: number;
  name: string;
  latitude: number;
  longitude: number;
  basin_id: number;
  basin_name?: string;
  basin_code?: string;
}

interface ForecastData {
  date: string;
  rainfall: number;
  temperature: number;
}

interface StationDetailsProps {
  station: Station | null;
  onClose: () => void;
}

export default function StationDetails({ station, onClose }: StationDetailsProps) {
  const [forecastData, setForecastData] = useState<ForecastData[]>([]);
  const [riskLevel, setRiskLevel] = useState<string>('safe');
  const [currentRainfall, setCurrentRainfall] = useState<number>(0);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!station) return;

    const fetchStationData = async () => {
      setLoading(true);
      try {
        // Use basin_code instead of basin_name for API call
        const basinCode = station.basin_code || station.basin_name;
        const response = await fetch(`http://localhost:8000/api/forecast/basin/${basinCode}`);

        if (!response.ok) {
          throw new Error(`HTTP ${response.status}`);
        }

        const data = await response.json();

        // Use basin-level forecast data
        if (data.data && data.data.forecast_days) {
          const forecast = data.data.forecast_days;

          // Get risk level from first day
          if (forecast.length > 0) {
            setRiskLevel(forecast[0].risk_level || 'safe');
            setCurrentRainfall(forecast[0].daily_rain || 0);

            // Format forecast data for chart
            const chartData = forecast.slice(0, 7).map((f: any) => ({
              date: format(new Date(f.date), 'dd/MM'),
              rainfall: f.daily_rain || 0,
              temperature: 25, // Default temperature since we don't have per-station temp
            }));

            setForecastData(chartData);
          }
        }
      } catch (error) {
        console.error('Error fetching station details:', error);
        // Set default safe values on error
        setRiskLevel('safe');
        setCurrentRainfall(0);
        setForecastData([]);
      } finally {
        setLoading(false);
      }
    };

    fetchStationData();
  }, [station]);

  const getRiskColor = (level: string) => {
    const colors: Record<string, string> = {
      safe: 'bg-green-500',
      watch: 'bg-yellow-500',
      warning: 'bg-orange-500',
      danger: 'bg-red-500',
    };
    return colors[level.toLowerCase()] || 'bg-gray-500';
  };

  const getRiskText = (level: string) => {
    const texts: Record<string, string> = {
      safe: 'An toàn',
      watch: 'Theo dõi',
      warning: 'Cảnh báo',
      danger: 'Nguy hiểm',
    };
    return texts[level.toLowerCase()] || level;
  };

  return (
    <AnimatePresence>
      {station && (
        <motion.div
          initial={{ x: -400, opacity: 0 }}
          animate={{ x: 0, opacity: 1 }}
          exit={{ x: -400, opacity: 0 }}
          transition={{ type: 'spring', damping: 25, stiffness: 200 }}
          className="fixed left-0 top-0 h-full w-96 glass z-[2000] overflow-y-auto shadow-2xl"
        >
          {/* Header */}
          <div className="sticky top-0 glass-dark p-4 flex items-start justify-between border-b border-white/10">
            <div className="flex-1">
              <h2 className="text-xl font-bold text-white mb-1">{station.name}</h2>
              <div className="flex items-center gap-2 text-sm text-gray-300">
                <MapPin className="w-4 h-4" />
                <span>Lưu vực {station.basin_name}</span>
              </div>
            </div>
            <button
              onClick={onClose}
              className="p-2 hover:bg-white/10 rounded-lg transition-colors"
            >
              <X className="w-5 h-5 text-white" />
            </button>
          </div>

          {loading ? (
            <div className="p-8 text-center text-white">
              <div className="animate-pulse">Đang tải dữ liệu...</div>
            </div>
          ) : (
            <div className="p-4 space-y-6">
              {/* Risk Level Badge */}
              <motion.div
                initial={{ scale: 0.9 }}
                animate={{ scale: 1 }}
                className={`${getRiskColor(riskLevel)} rounded-lg p-4 text-white shadow-lg`}
              >
                <div className="flex items-center gap-3">
                  <AlertTriangle className="w-8 h-8" />
                  <div>
                    <div className="text-sm opacity-90">Mức độ rủi ro</div>
                    <div className="text-2xl font-bold">{getRiskText(riskLevel)}</div>
                  </div>
                </div>
              </motion.div>

              {/* Current Rainfall */}
              <div className="glass-card rounded-lg p-4">
                <div className="flex items-center gap-2 text-gray-300 mb-2">
                  <Droplets className="w-5 h-5" />
                  <span className="text-sm font-semibold">Lượng mưa hiện tại</span>
                </div>
                <div className="text-3xl font-bold text-white">
                  {currentRainfall.toFixed(1)} <span className="text-lg">mm</span>
                </div>
              </div>

              {/* Location Info */}
              <div className="glass-card rounded-lg p-4 space-y-2">
                <h3 className="font-semibold text-white mb-3 flex items-center gap-2">
                  <MapPin className="w-4 h-4" />
                  Vị trí
                </h3>
                <div className="text-sm text-gray-300 space-y-1">
                  <div className="flex justify-between">
                    <span>Vĩ độ:</span>
                    <span className="text-white font-mono">{station.latitude.toFixed(4)}°</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Kinh độ:</span>
                    <span className="text-white font-mono">{station.longitude.toFixed(4)}°</span>
                  </div>
                </div>
              </div>

              {/* 7-Day Forecast Chart */}
              {forecastData.length > 0 && (
                <div className="glass-card rounded-lg p-4">
                  <h3 className="font-semibold text-white mb-4 flex items-center gap-2">
                    <TrendingUp className="w-4 h-4" />
                    Dự báo 7 ngày
                  </h3>
                  <ResponsiveContainer width="100%" height={200}>
                    <LineChart data={forecastData}>
                      <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.1)" />
                      <XAxis
                        dataKey="date"
                        stroke="rgba(255,255,255,0.5)"
                        style={{ fontSize: '12px' }}
                      />
                      <YAxis
                        stroke="rgba(255,255,255,0.5)"
                        style={{ fontSize: '12px' }}
                      />
                      <Tooltip
                        contentStyle={{
                          backgroundColor: 'rgba(0,0,0,0.8)',
                          border: '1px solid rgba(255,255,255,0.2)',
                          borderRadius: '8px',
                        }}
                      />
                      <Line
                        type="monotone"
                        dataKey="rainfall"
                        stroke="#3b82f6"
                        strokeWidth={2}
                        dot={{ fill: '#3b82f6', r: 4 }}
                        name="Lượng mưa (mm)"
                      />
                    </LineChart>
                  </ResponsiveContainer>
                </div>
              )}

              {/* Forecast Table */}
              {forecastData.length > 0 && (
                <div className="glass-card rounded-lg p-4">
                  <h3 className="font-semibold text-white mb-3 flex items-center gap-2">
                    <Calendar className="w-4 h-4" />
                    Chi tiết dự báo
                  </h3>
                  <div className="space-y-2">
                    {forecastData.map((day, index) => (
                      <div
                        key={index}
                        className="flex items-center justify-between py-2 border-b border-white/10 last:border-0"
                      >
                        <span className="text-sm text-gray-300">{day.date}</span>
                        <div className="flex items-center gap-4">
                          <div className="text-right">
                            <div className="text-sm text-blue-400 font-semibold">
                              {day.rainfall.toFixed(1)} mm
                            </div>
                          </div>
                          <div className="text-right">
                            <div className="text-sm text-orange-400 font-semibold">
                              {day.temperature.toFixed(1)}°C
                            </div>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Warnings */}
              {riskLevel !== 'safe' && (
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="glass-card rounded-lg p-4 border-2 border-yellow-500/50"
                >
                  <div className="flex items-start gap-3">
                    <AlertTriangle className="w-5 h-5 text-yellow-500 flex-shrink-0 mt-0.5" />
                    <div className="text-sm text-gray-300">
                      <p className="font-semibold text-yellow-500 mb-1">Cảnh báo</p>
                      <p>
                        Khu vực này đang ở mức độ {getRiskText(riskLevel).toLowerCase()}.
                        Vui lòng theo dõi thông tin cập nhật và tuân thủ hướng dẫn của cơ quan chức năng.
                      </p>
                    </div>
                  </div>
                </motion.div>
              )}
            </div>
          )}
        </motion.div>
      )}
    </AnimatePresence>
  );
}
