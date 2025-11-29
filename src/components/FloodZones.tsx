'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Droplets, AlertTriangle, TrendingUp, Waves, Calendar, ArrowUp, ArrowDown, Minus, RefreshCw } from 'lucide-react';

interface FloodZonesProps {
  onClose: () => void;
}

interface BasinForecast {
  basin: string;
  forecast_days: Array<{
    date: string;
    daily_rain: number;
    accumulated_3d: number;
    risk_level: string;
    risk_description: string;
  }>;
  max_daily_rain: number;
  max_daily_date: string;
  warnings: Array<any>;
}

export default function FloodZones({ onClose }: FloodZonesProps) {
  const [activeBasin, setActiveBasin] = useState<'HONG' | 'MEKONG' | 'CENTRAL'>('HONG');
  const [forecasts, setForecasts] = useState<Record<string, BasinForecast>>({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    fetchForecasts();
  }, []);

  const fetchForecasts = async () => {
    try {
      setLoading(true);
      setError('');

      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 120000); // 120s timeout (first fetch can be slow)

      const response = await fetch('http://localhost:8000/api/forecast/all', {
        signal: controller.signal
      });

      clearTimeout(timeoutId);

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      const data = await response.json();

      if (data.basins && Object.keys(data.basins).length > 0) {
        setForecasts(data.basins);
        setError('');
      } else {
        setError('Dữ liệu dự báo trống. Vui lòng thử lại sau.');
      }
      setLoading(false);
    } catch (err: any) {
      console.error('Error fetching forecasts:', err);
      if (err.name === 'AbortError') {
        setError('Yêu cầu quá lâu. Vui lòng kiểm tra kết nối mạng và thử lại.');
      } else if (err.message.includes('Failed to fetch')) {
        setError('Không thể kết nối đến server. Đảm bảo backend đang chạy tại http://localhost:8000');
      } else {
        setError(`Lỗi: ${err.message || 'Không thể tải dữ liệu dự báo'}`);
      }
      setLoading(false);
    }
  };

  const getRiskColor = (riskLevel: string) => {
    const level = riskLevel.toLowerCase();
    if (level.includes('nguy') || level.includes('danger')) return 'from-red-600 to-red-800';
    if (level.includes('cảnh') || level.includes('warning')) return 'from-orange-500 to-orange-700';
    if (level.includes('theo') || level.includes('watch')) return 'from-yellow-500 to-yellow-700';
    return 'from-green-500 to-green-700';
  };

  const getRiskBadgeColor = (riskLevel: string) => {
    const level = riskLevel.toLowerCase();
    if (level.includes('nguy') || level.includes('danger')) return 'bg-red-500/20 text-red-300 border-red-500/50';
    if (level.includes('cảnh') || level.includes('warning')) return 'bg-orange-500/20 text-orange-300 border-orange-500/50';
    if (level.includes('theo') || level.includes('watch')) return 'bg-yellow-500/20 text-yellow-300 border-yellow-500/50';
    return 'bg-green-500/20 text-green-300 border-green-500/50';
  };

  const getTrendIcon = (days: Array<{ daily_rain: number }>) => {
    if (days.length < 2) return <Minus className="w-4 h-4" />;

    const recent = days.slice(-3);
    const early = days.slice(0, 3);
    const recentAvg = recent.reduce((sum, d) => sum + d.daily_rain, 0) / recent.length;
    const earlyAvg = early.reduce((sum, d) => sum + d.daily_rain, 0) / early.length;

    if (recentAvg > earlyAvg * 1.2) return <ArrowUp className="w-4 h-4 text-red-400" />;
    if (recentAvg < earlyAvg * 0.8) return <ArrowDown className="w-4 h-4 text-green-400" />;
    return <Minus className="w-4 h-4 text-gray-400" />;
  };

  const getTrendText = (days: Array<{ daily_rain: number }>) => {
    if (days.length < 2) return 'Không đủ dữ liệu';

    const recent = days.slice(-3);
    const early = days.slice(0, 3);
    const recentAvg = recent.reduce((sum, d) => sum + d.daily_rain, 0) / recent.length;
    const earlyAvg = early.reduce((sum, d) => sum + d.daily_rain, 0) / early.length;

    if (recentAvg > earlyAvg * 1.2) return 'Tăng mạnh';
    if (recentAvg < earlyAvg * 0.8) return 'Giảm';
    return 'Ổn định';
  };

  const basinNames: Record<string, string> = {
    'HONG': 'Lưu vực Sông Hồng',
    'MEKONG': 'Lưu vực Sông Mekong',
    'CENTRAL': 'Lưu vực Miền Trung',
    'DONGNAI': 'Lưu vực Sông Đồng Nai'
  };

  const currentForecast = forecasts[activeBasin];

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 bg-black/80 backdrop-blur-sm z-[2000] flex items-center justify-center p-4"
        onClick={onClose}
      >
        <motion.div
          initial={{ scale: 0.9, y: 20 }}
          animate={{ scale: 1, y: 0 }}
          exit={{ scale: 0.9, y: 20 }}
          className="glass-dark rounded-2xl w-full max-w-6xl max-h-[90vh] overflow-hidden shadow-2xl"
          onClick={(e) => e.stopPropagation()}
        >
          {/* Header */}
          <div className="bg-gray-900 border-b border-gray-700 p-6">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <div className="w-10 h-10 rounded bg-gray-800 flex items-center justify-center">
                  <Waves className="w-5 h-5 text-gray-400" />
                </div>
                <div>
                  <h2 className="text-xl font-semibold text-white">Dự Báo Lũ Lụt 7 Ngày Tới</h2>
                  <p className="text-gray-400 text-xs mt-1">
                    Mô hình thủy văn - Cập nhật từ Open-Meteo
                  </p>
                </div>
              </div>
              <button
                onClick={onClose}
                className="w-8 h-8 rounded bg-gray-800 hover:bg-gray-700 transition-colors flex items-center justify-center"
              >
                <X className="w-4 h-4 text-gray-400" />
              </button>
            </div>
          </div>

          {/* Tabs */}
          <div className="bg-gray-900/50 border-b border-gray-700 px-6">
            <div className="flex gap-2">
              {Object.keys(basinNames).map((basin) => (
                <button
                  key={basin}
                  onClick={() => setActiveBasin(basin as any)}
                  className={`px-6 py-4 font-semibold text-sm transition-all relative ${
                    activeBasin === basin
                      ? 'text-blue-400'
                      : 'text-gray-400 hover:text-gray-300'
                  }`}
                >
                  {basinNames[basin]}
                  {activeBasin === basin && (
                    <motion.div
                      layoutId="activeTab"
                      className="absolute bottom-0 left-0 right-0 h-0.5 bg-blue-500"
                    />
                  )}
                </button>
              ))}
            </div>
          </div>

          {/* Content */}
          <div className="p-6 overflow-y-auto max-h-[calc(90vh-200px)]">
            {loading ? (
              <div className="flex items-center justify-center py-20">
                <div className="text-center">
                  <div className="relative w-20 h-20 mx-auto mb-6">
                    <div className="absolute inset-0 border-4 border-blue-500/30 rounded-full"></div>
                    <div className="absolute inset-0 border-4 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
                    <Waves className="absolute inset-0 m-auto w-8 h-8 text-blue-400 animate-pulse" />
                  </div>
                  <p className="text-white font-semibold mb-2">Đang tải dự báo lũ lụt...</p>
                  <p className="text-gray-400 text-sm">Đang lấy dữ liệu từ Open-Meteo API</p>
                  <div className="mt-4 flex items-center justify-center gap-2 text-xs text-gray-500">
                    <div className="w-2 h-2 bg-blue-500 rounded-full animate-bounce" style={{ animationDelay: '0ms' }}></div>
                    <div className="w-2 h-2 bg-blue-500 rounded-full animate-bounce" style={{ animationDelay: '150ms' }}></div>
                    <div className="w-2 h-2 bg-blue-500 rounded-full animate-bounce" style={{ animationDelay: '300ms' }}></div>
                  </div>
                </div>
              </div>
            ) : error ? (
              <div className="flex items-center justify-center py-20">
                <div className="text-center max-w-md">
                  <div className="w-20 h-20 bg-red-500/10 rounded-full flex items-center justify-center mx-auto mb-4">
                    <AlertTriangle className="w-10 h-10 text-red-500" />
                  </div>
                  <h3 className="text-white font-semibold text-lg mb-2">Không thể tải dữ liệu</h3>
                  <p className="text-gray-400 mb-6 text-sm leading-relaxed">{error}</p>
                  <div className="flex gap-3 justify-center">
                    <button
                      onClick={fetchForecasts}
                      className="flex items-center gap-2 px-6 py-2.5 bg-blue-600 hover:bg-blue-700 rounded-lg text-white transition-all hover:shadow-lg hover:shadow-blue-500/30"
                    >
                      <RefreshCw className="w-4 h-4" />
                      Thử lại
                    </button>
                    <button
                      onClick={onClose}
                      className="px-6 py-2.5 bg-gray-700 hover:bg-gray-600 rounded-lg text-white transition-colors"
                    >
                      Đóng
                    </button>
                  </div>
                  <div className="mt-6 p-4 bg-gray-800/50 rounded-lg border border-gray-700">
                    <p className="text-xs text-gray-400 text-left">
                      <strong className="text-gray-300">Gợi ý:</strong><br/>
                      • Kiểm tra backend đang chạy: <code className="text-blue-400">cd backend && ./venv/bin/python3 main_simple.py</code><br/>
                      • Kiểm tra kết nối mạng<br/>
                      • Thử tải lại trang
                    </p>
                  </div>
                </div>
              </div>
            ) : currentForecast ? (
              <div className="space-y-6">
                {/* Summary Stats */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="rounded-lg p-4 bg-gray-800/50 border border-gray-700">
                    <div className="flex items-center gap-2 mb-3">
                      <Droplets className="w-5 h-5 text-gray-400" />
                      <div className="text-xs text-gray-400">Lượng mưa lớn nhất</div>
                    </div>
                    <div className="text-2xl font-semibold text-white">{currentForecast.max_daily_rain.toFixed(1)} mm</div>
                    <div className="text-xs text-gray-500 mt-1">
                      {new Date(currentForecast.max_daily_date).toLocaleDateString('vi-VN')}
                    </div>
                  </div>

                  <div className="rounded-lg p-4 bg-gray-800/50 border border-gray-700">
                    <div className="flex items-center gap-2 mb-3">
                      <TrendingUp className="w-5 h-5 text-gray-400" />
                      <div className="text-xs text-gray-400">Xu hướng</div>
                    </div>
                    <div className="text-xl font-semibold text-white flex items-center gap-2">
                      {getTrendIcon(currentForecast.forecast_days)}
                      {getTrendText(currentForecast.forecast_days)}
                    </div>
                    <div className="text-xs text-gray-500 mt-1">
                      So sánh 3 ngày đầu vs cuối
                    </div>
                  </div>

                  <div className="rounded-lg p-4 bg-gray-800/50 border border-gray-700">
                    <div className="flex items-center gap-2 mb-3">
                      <AlertTriangle className="w-5 h-5 text-gray-400" />
                      <div className="text-xs text-gray-400">Cảnh báo</div>
                    </div>
                    <div className="text-2xl font-semibold text-white">{currentForecast.warnings.length}</div>
                    <div className="text-xs text-gray-500 mt-1">
                      {currentForecast.warnings.length > 0 ? 'Ngày có cảnh báo' : 'Không có cảnh báo'}
                    </div>
                  </div>
                </div>

                {/* Warnings Alert */}
                {currentForecast.warnings.length > 0 && (
                  <div className="rounded-lg p-4 bg-gray-800/80 border-l-4 border-red-500">
                    <div className="flex items-start gap-3">
                      <AlertTriangle className="w-5 h-5 text-red-500 flex-shrink-0 mt-0.5" />
                      <div className="flex-1">
                        <h4 className="text-white font-semibold text-sm mb-2">Cảnh báo nguy hiểm</h4>
                        <div className="space-y-2">
                          {currentForecast.warnings.map((warning, idx) => (
                            <div key={idx} className="text-xs text-gray-300">
                              <span className="font-semibold text-white">
                                {new Date(warning.date).toLocaleDateString('vi-VN')}:
                              </span>{' '}
                              {warning.risk_description} ({warning.daily_rain.toFixed(1)} mm, tích lũy: {warning.accumulated_3d.toFixed(1)} mm)
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                {/* 7-Day Forecast Timeline */}
                <div className="rounded-lg bg-gray-900/50 border border-gray-700 overflow-hidden">
                  <div className="p-4 bg-gray-800/50 border-b border-gray-700">
                    <h3 className="text-sm font-semibold text-white flex items-center gap-2">
                      <Calendar className="w-4 h-4 text-gray-400" />
                      Dự báo 7 ngày tới
                    </h3>
                  </div>

                  <div className="p-4 space-y-2">
                    {currentForecast.forecast_days.map((day, idx) => {
                      const date = new Date(day.date);
                      const isToday = idx === 0;
                      const dayName = date.toLocaleDateString('vi-VN', { weekday: 'short' });
                      const dateStr = date.toLocaleDateString('vi-VN', { day: '2-digit', month: '2-digit' });

                      return (
                        <div
                          key={day.date}
                          className={`rounded border ${
                            isToday
                              ? 'bg-gray-800 border-gray-600'
                              : 'bg-gray-800/30 border-gray-700 hover:bg-gray-800/50'
                          }`}
                        >
                          <div className="p-3">
                            <div className="grid grid-cols-12 gap-3 items-center text-xs">
                              {/* Date */}
                              <div className="col-span-2">
                                <div className={`font-semibold ${isToday ? 'text-white' : 'text-gray-300'}`}>
                                  {isToday ? 'Hôm nay' : dayName}
                                </div>
                                <div className="text-gray-500">{dateStr}</div>
                              </div>

                              {/* Risk Level Badge */}
                              <div className="col-span-2">
                                <div className={`px-2 py-1 rounded text-xs font-semibold border text-center ${getRiskBadgeColor(day.risk_level)}`}>
                                  {day.risk_level}
                                </div>
                              </div>

                              {/* Daily Rain */}
                              <div className="col-span-3">
                                <div className="text-gray-500 mb-1">Mưa trong ngày</div>
                                <div className="flex items-center gap-1">
                                  <Droplets className="w-3 h-3 text-gray-500" />
                                  <span className="text-base font-semibold text-white">{day.daily_rain.toFixed(1)}</span>
                                  <span className="text-gray-500">mm</span>
                                </div>
                              </div>

                              {/* Accumulated 3d */}
                              <div className="col-span-3">
                                <div className="text-gray-500 mb-1">Tích lũy 3 ngày</div>
                                <div className="flex items-center gap-1">
                                  <Waves className="w-3 h-3 text-gray-500" />
                                  <span className="text-base font-semibold text-white">{day.accumulated_3d.toFixed(1)}</span>
                                  <span className="text-gray-500">mm</span>
                                </div>
                              </div>

                              {/* Visual Bar */}
                              <div className="col-span-2">
                                <div className="w-full bg-gray-700 rounded-full h-1.5">
                                  <div
                                    className={`h-1.5 rounded-full ${getRiskColor(day.risk_level).replace('from-', 'bg-').replace(/\s+to-.*/, '')}`}
                                    style={{ width: `${Math.min(100, (day.daily_rain / 200) * 100)}%` }}
                                  />
                                </div>
                              </div>
                            </div>

                            {/* Description */}
                            {day.risk_description && (
                              <div className="mt-2 pt-2 border-t border-gray-700">
                                <p className="text-xs text-gray-400">{day.risk_description}</p>
                              </div>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>

                {/* Data Source */}
                <div className="rounded-xl p-5 bg-gradient-to-r from-blue-500/10 to-purple-500/10 border border-blue-400/30">
                  <h4 className="text-sm font-bold text-blue-300 mb-3">📊 Nguồn dữ liệu và phương pháp</h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-xs text-blue-200">
                    <div>
                      <span className="font-semibold">• Dữ liệu thời tiết:</span> Open-Meteo Weather Forecast API
                    </div>
                    <div>
                      <span className="font-semibold">• Phương pháp tính mưa lưu vực:</span> Thiessen Polygon
                    </div>
                    <div>
                      <span className="font-semibold">• Mô hình dòng chảy:</span> SCS Curve Number Method
                    </div>
                    <div>
                      <span className="font-semibold">• Chu kỳ lũ:</span> Gumbel Distribution Analysis
                    </div>
                    <div>
                      <span className="font-semibold">• Ngưỡng cảnh báo:</span> NCHMF Vietnam Standards
                    </div>
                    <div>
                      <span className="font-semibold">• Cập nhật:</span> Mỗi 30 phút
                    </div>
                  </div>
                </div>
              </div>
            ) : (
              <div className="flex items-center justify-center py-20">
                <p className="text-gray-400">Không có dữ liệu dự báo cho lưu vực này</p>
              </div>
            )}
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}
