'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, MapPin, Droplets, TrendingUp, AlertTriangle, Activity, Waves, Clock, BarChart3, TrendingDown, Minus, ArrowUpRight, ArrowDownRight } from 'lucide-react';

interface RegionData {
  bounds: {
    north: number;
    south: number;
    east: number;
    west: number;
  };
  stations_count: number;
  area_km2: number;
  generated_at: string;
  thiessen_analysis?: {
    basin_average_rainfall: number;
    method: string;
    formula: string;
  };
  accumulated_rainfall?: {
    max_daily: number;
    max_accumulated: number;
  };
  discharge_estimation?: {
    peak_discharge: number;
    runoff: number;
    runoff_coefficient: number;
    method: string;
    curve_number: number;
  };
  return_period?: {
    return_period_years: number;
    probability: number;
    category: string;
    interpretation: string;
  };
  trend_analysis?: {
    trend: string;
    slope: number;
    prediction: string;
  };
  flood_severity?: {
    severity: string;
    alert_level: number;
    recommendations: string[];
    discharge: number;
    rainfall_daily: number;
    rainfall_3d: number;
  };
  summary?: {
    risk_level: string;
    alert_level: number;
  };
  // Legacy fields for backward compatibility
  avg_rainfall?: number;
  max_rainfall?: number;
  risk_level?: string;
  stations: Array<{
    station_id: number;
    station_name: string;
    latitude: number;
    longitude: number;
    total_rainfall: number;
    max_daily_rainfall: number;
    weight?: number;
  }>;
}

interface RegionSelectorProps {
  regionData: RegionData | null;
  onClose: () => void;
}

export default function RegionSelector({ regionData, onClose }: RegionSelectorProps) {
  const [currentTime, setCurrentTime] = useState(new Date());

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date());
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  if (!regionData || !regionData.bounds) return null;

  const getRiskColor = (level: string | undefined) => {
    if (!level) return 'bg-gray-500';
    const colors: Record<string, string> = {
      safe: 'bg-green-500',
      watch: 'bg-yellow-500',
      warning: 'bg-orange-500',
      danger: 'bg-red-500',
    };
    return colors[level.toLowerCase()] || 'bg-gray-500';
  };

  const getRiskText = (level: string | undefined) => {
    if (!level) return 'Không xác định';
    const texts: Record<string, string> = {
      safe: 'An toàn',
      watch: 'Theo dõi',
      warning: 'Cảnh báo',
      danger: 'Nguy hiểm',
    };
    return texts[level.toLowerCase()] || level;
  };

  const getTrendIconComponent = (trend: string) => {
    const iconClass = "w-10 h-10";
    switch (trend) {
      case 'increasing_fast':
        return <TrendingUp className={`${iconClass} text-red-500`} strokeWidth={3} />;
      case 'increasing':
        return <ArrowUpRight className={`${iconClass} text-orange-500`} strokeWidth={2.5} />;
      case 'stable':
        return <Minus className={`${iconClass} text-blue-500`} strokeWidth={2.5} />;
      case 'decreasing':
        return <ArrowDownRight className={`${iconClass} text-green-500`} strokeWidth={2.5} />;
      case 'decreasing_fast':
        return <TrendingDown className={`${iconClass} text-green-600`} strokeWidth={3} />;
      default:
        return <Minus className={`${iconClass} text-gray-400`} />;
    }
  };

  const getTrendColor = (trend: string) => {
    switch (trend) {
      case 'increasing_fast': return 'text-red-500';
      case 'increasing': return 'text-orange-500';
      case 'stable': return 'text-blue-500';
      case 'decreasing': return 'text-green-500';
      case 'decreasing_fast': return 'text-green-600';
      default: return 'text-gray-400';
    }
  };

  const riskLevel = regionData.summary?.risk_level || regionData.risk_level || 'safe';
  const avgRainfall = regionData.thiessen_analysis?.basin_average_rainfall || regionData.avg_rainfall || 0;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ x: -400, opacity: 0 }}
        animate={{ x: 0, opacity: 1 }}
        exit={{ x: -400, opacity: 0 }}
        transition={{ type: 'spring', damping: 25, stiffness: 200 }}
        className="fixed left-0 top-20 bottom-0 w-[500px] glass z-[2000] overflow-y-auto shadow-2xl"
      >
        {/* Header */}
        <div className="sticky top-0 glass-dark p-4 border-b border-white/10">
          <div className="flex items-start justify-between mb-3">
            <div className="flex-1">
              <h2 className="text-xl font-bold text-white mb-1 drop-shadow-lg">Phân tích Thủy văn Vùng</h2>
              <div className="flex items-center gap-2 text-sm text-gray-200 font-medium">
                <MapPin className="w-4 h-4" />
                <span>{regionData.stations_count} trạm • {regionData.area_km2?.toFixed(0)} km²</span>
              </div>
            </div>
            <button
              onClick={onClose}
              className="p-2 hover:bg-white/10 rounded-lg transition-colors"
            >
              <X className="w-5 h-5 text-white drop-shadow-lg" />
            </button>
          </div>

          {/* Realtime Clock */}
          <div className="flex items-center gap-2 text-xs text-gray-300 font-medium">
            <Clock className="w-3 h-3" />
            <span>Cập nhật: {currentTime.toLocaleTimeString('vi-VN')}</span>
            {regionData.generated_at && (
              <span className="ml-2">• Dữ liệu: {new Date(regionData.generated_at).toLocaleTimeString('vi-VN')}</span>
            )}
          </div>
        </div>

        <div className="p-4 space-y-4">
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

          {/* Thiessen Analysis */}
          {regionData.thiessen_analysis && (
            <div className="glass-card rounded-lg p-4">
              <h3 className="font-bold text-white mb-3 flex items-center gap-2 drop-shadow-md">
                <BarChart3 className="w-4 h-4 text-blue-400" />
                Phân tích Thiessen Polygon
              </h3>
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-gray-200 font-medium">Phương pháp:</span>
                  <span className="text-white font-bold">{regionData.thiessen_analysis.method}</span>
                </div>
                <div className="p-2 bg-blue-500/20 rounded border border-blue-400/40">
                  <div className="text-xs text-blue-200 font-mono font-semibold">
                    {regionData.thiessen_analysis.formula}
                  </div>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-gray-200 text-sm font-medium">Mưa TB lưu vực:</span>
                  <span className="text-2xl font-bold text-white drop-shadow-lg">
                    {avgRainfall.toFixed(1)} <span className="text-sm">mm</span>
                  </span>
                </div>
              </div>
            </div>
          )}

          {/* Accumulated Rainfall */}
          {regionData.accumulated_rainfall && (
            <div className="glass-card rounded-lg p-4">
              <h3 className="font-bold text-white mb-3 flex items-center gap-2 drop-shadow-md">
                <Droplets className="w-4 h-4 text-cyan-400" />
                Lượng mưa tích lũy
              </h3>
              <div className="grid grid-cols-2 gap-3">
                <div className="p-3 bg-cyan-500/20 rounded border border-cyan-400/40">
                  <div className="text-xs text-cyan-200 mb-1 font-semibold">Max ngày</div>
                  <div className="text-xl font-bold text-white drop-shadow-md">
                    {regionData.accumulated_rainfall.max_daily.toFixed(1)} mm
                  </div>
                </div>
                <div className="p-3 bg-cyan-500/20 rounded border border-cyan-400/40">
                  <div className="text-xs text-cyan-200 mb-1 font-semibold">Max 3 ngày</div>
                  <div className="text-xl font-bold text-white drop-shadow-md">
                    {regionData.accumulated_rainfall.max_accumulated.toFixed(1)} mm
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Discharge Estimation */}
          {regionData.discharge_estimation && (
            <div className="glass-card rounded-lg p-4">
              <h3 className="font-bold text-white mb-3 flex items-center gap-2 drop-shadow-md">
                <Waves className="w-4 h-4 text-purple-400" />
                Ước tính Lưu lượng ({regionData.discharge_estimation.method})
              </h3>
              <div className="space-y-2">
                <div className="p-3 bg-purple-500/20 rounded border border-purple-400/40">
                  <div className="text-xs text-purple-200 mb-1 font-semibold">Lưu lượng đỉnh</div>
                  <div className="text-2xl font-bold text-white drop-shadow-lg">
                    {regionData.discharge_estimation.peak_discharge.toFixed(1)} <span className="text-sm">m³/s</span>
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-2 text-xs">
                  <div className="flex justify-between">
                    <span className="text-gray-200 font-medium">Runoff:</span>
                    <span className="text-white font-bold">{regionData.discharge_estimation.runoff.toFixed(1)} mm</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-200 font-medium">CN:</span>
                    <span className="text-white font-bold">{regionData.discharge_estimation.curve_number}</span>
                  </div>
                  <div className="flex justify-between col-span-2">
                    <span className="text-gray-200 font-medium">Hệ số:</span>
                    <span className="text-white font-bold">{regionData.discharge_estimation.runoff_coefficient.toFixed(3)}</span>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Return Period */}
          {regionData.return_period && (
            <div className="glass-card rounded-lg p-4">
              <h3 className="font-bold text-black mb-3 flex items-center gap-2 drop-shadow-md">
                <Activity className="w-4 h-4 text-orange-600" />
                Chu kỳ lặp lại (Gumbel)
              </h3>
              <div className="space-y-3">
                <div className="p-3 bg-orange-500/20 rounded border border-orange-400/40">
                  <div className="text-xs text-orange-800 mb-1 font-semibold">{regionData.return_period.category}</div>
                  <div className="text-2xl font-bold text-black drop-shadow-lg">
                    {regionData.return_period.return_period_years.toFixed(1)} <span className="text-sm">năm</span>
                  </div>
                </div>
                <div className="text-xs text-black font-medium">
                  <div>Xác suất: {regionData.return_period.probability.toFixed(1)}% mỗi năm</div>
                  <div className="mt-1">{regionData.return_period.interpretation}</div>
                </div>

                {/* Bảng ngưỡng cảnh báo */}
                <div className="mt-3 pt-3 border-t border-black/20">
                  <div className="text-xs font-bold text-black mb-2">Ngưỡng cảnh báo theo Return Period:</div>
                  <div className="overflow-x-auto">
                    <table className="w-full text-xs border-collapse">
                      <thead>
                        <tr className="bg-black/10">
                          <th className="border border-black/20 px-2 py-1 text-left font-bold text-black">Return Period</th>
                          <th className="border border-black/20 px-2 py-1 text-left font-bold text-black">Mức cảnh báo</th>
                          <th className="border border-black/20 px-2 py-1 text-left font-bold text-black">Ý nghĩa</th>
                        </tr>
                      </thead>
                      <tbody>
                        <tr className="hover:bg-white/10">
                          <td className="border border-black/20 px-2 py-1 text-black font-medium">&lt; 2 năm</td>
                          <td className="border border-black/20 px-2 py-1">
                            <span className="inline-block px-2 py-0.5 rounded bg-green-500/30 text-green-900 font-bold text-xs">Bình thường</span>
                          </td>
                          <td className="border border-black/20 px-2 py-1 text-black">Lũ nhỏ, thường xuyên</td>
                        </tr>
                        <tr className="hover:bg-white/10">
                          <td className="border border-black/20 px-2 py-1 text-black font-medium">2-5 năm</td>
                          <td className="border border-black/20 px-2 py-1">
                            <span className="inline-block px-2 py-0.5 rounded bg-yellow-500/30 text-yellow-900 font-bold text-xs">Cảnh báo</span>
                          </td>
                          <td className="border border-black/20 px-2 py-1 text-black">Lũ vừa, cần theo dõi</td>
                        </tr>
                        <tr className="hover:bg-white/10">
                          <td className="border border-black/20 px-2 py-1 text-black font-medium">5-20 năm</td>
                          <td className="border border-black/20 px-2 py-1">
                            <span className="inline-block px-2 py-0.5 rounded bg-orange-500/30 text-orange-900 font-bold text-xs">Nghiêm trọng</span>
                          </td>
                          <td className="border border-black/20 px-2 py-1 text-black">Lũ lớn, cần sơ tán</td>
                        </tr>
                        <tr className="hover:bg-white/10">
                          <td className="border border-black/20 px-2 py-1 text-black font-medium">&gt; 20 năm</td>
                          <td className="border border-black/20 px-2 py-1">
                            <span className="inline-block px-2 py-0.5 rounded bg-red-500/30 text-red-900 font-bold text-xs">Khẩn cấp</span>
                          </td>
                          <td className="border border-black/20 px-2 py-1 text-black">Lũ lịch sử, thiệt hại lớn</td>
                        </tr>
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Trend Analysis */}
          {regionData.trend_analysis && (
            <div className="glass-card rounded-lg p-4">
              <h3 className="font-bold text-black mb-3 flex items-center gap-2 drop-shadow-md">
                <Activity className="w-4 h-4 text-green-600" />
                Xu hướng
              </h3>
              <div className="flex items-center gap-4">
                <div className="flex-shrink-0">
                  {getTrendIconComponent(regionData.trend_analysis.trend)}
                </div>
                <div className="flex-1">
                  <div className={`text-lg font-bold ${getTrendColor(regionData.trend_analysis.trend)} drop-shadow-md`}>
                    {regionData.trend_analysis.prediction}
                  </div>
                  <div className="text-xs text-black font-medium mt-1">
                    Độ dốc: {regionData.trend_analysis.slope.toFixed(2)}
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Recommendations */}
          {regionData.flood_severity && regionData.flood_severity.recommendations && (
            <div className="glass-card rounded-lg p-4 border-2 border-yellow-400/60">
              <h3 className="font-bold text-black mb-3 flex items-center gap-2 drop-shadow-md">
                <AlertTriangle className="w-5 h-5 text-yellow-600" />
                Khuyến nghị
              </h3>
              <div className="space-y-2">
                {regionData.flood_severity.recommendations.map((rec, idx) => (
                  <div key={idx} className="flex items-start gap-2 text-sm">
                    <span className="text-yellow-600 mt-0.5 font-bold">•</span>
                    <span className="text-black font-semibold">{rec}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Bounds Info */}
          <div className="glass-card rounded-lg p-4">
            <h3 className="font-bold text-black mb-3 flex items-center gap-2 drop-shadow-md">
              <MapPin className="w-4 h-4 text-blue-600" />
              Phạm vi khu vực
            </h3>
            <div className="grid grid-cols-2 gap-2 text-sm text-black">
              <div>
                <span className="font-bold">Bắc:</span>
                <span className="ml-2 text-black font-bold">{regionData.bounds.north.toFixed(4)}°</span>
              </div>
              <div>
                <span className="font-bold">Nam:</span>
                <span className="ml-2 text-black font-bold">{regionData.bounds.south.toFixed(4)}°</span>
              </div>
              <div>
                <span className="font-bold">Đông:</span>
                <span className="ml-2 text-black font-bold">{regionData.bounds.east.toFixed(4)}°</span>
              </div>
              <div>
                <span className="font-bold">Tây:</span>
                <span className="ml-2 text-black font-bold">{regionData.bounds.west.toFixed(4)}°</span>
              </div>
            </div>
          </div>

          {/* Stations List */}
          <div className="glass-card rounded-lg p-4">
            <h3 className="font-bold text-black mb-3 drop-shadow-md">Các trạm trong vùng ({regionData.stations_count})</h3>
            <div className="space-y-2 max-h-64 overflow-y-auto">
              {regionData.stations.map((station) => (
                <div
                  key={station.station_id}
                  className="p-3 bg-white/10 rounded-lg border border-white/20 hover:bg-white/15 transition-colors"
                >
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="font-bold text-black text-sm drop-shadow-sm">{station.station_name}</div>
                      <div className="text-xs text-black mt-1 font-medium">
                        <div>Tổng mưa: <span className="text-black font-bold">{station.total_rainfall.toFixed(1)} mm</span></div>
                        <div>Max: <span className="text-black font-bold">{station.max_daily_rainfall.toFixed(1)} mm/ngày</span></div>
                        {station.weight && (
                          <div>Trọng số: <span className="text-black font-bold">{station.weight.toFixed(3)}</span></div>
                        )}
                      </div>
                    </div>
                    <div className="text-xs text-black font-semibold">
                      {station.latitude.toFixed(2)}°, {station.longitude.toFixed(2)}°
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </motion.div>
    </AnimatePresence>
  );
}
