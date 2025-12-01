'use client';

import { motion, AnimatePresence } from 'framer-motion';
import { X, Loader2, ChevronRight, ChevronLeft, AlertTriangle } from 'lucide-react';
import { useState, useEffect, useRef } from 'react';
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell,
  AreaChart, Area
} from 'recharts';

interface District {
  name: string;
  impact_level: string;
  water_level_cm: number;
  flood_area_km2: number;
  affected_wards: string[];
  evacuation_needed: boolean;
  notes: string;
}

interface AffectedArea {
  province: string;
  impact_level: string;
  water_level_cm: number;
  flood_area_km2: number;
  reason: string;
  districts?: District[];
}

interface ForecastDay {
  date: string;
  daily_rain: number;
  accumulated_3d: number;
  risk_level: string;
  risk_description: string;
}

interface AIAnalysis {
  peak_rain: {
    date: string;
    amount_mm: number;
    intensity: string;
  };
  flood_timeline: {
    rising_start: string;
    rising_end: string;
    peak_date: string;
    receding_start: string;
    receding_end: string;
  };
  affected_areas: AffectedArea[];
  overall_risk: {
    level: string;
    score: number;
    description: string;
  };
  recommendations: {
    government: string[];
    citizens: string[];
  };
  summary: string;
}

interface ForecastDataNested {
  basin: string;
  forecast_days: ForecastDay[];
}

interface RegionForecastData {
  region: string;
  basin: string;
  forecast: ForecastDataNested | {
    data?: ForecastDataNested;
    basin?: string;
    forecast_days?: ForecastDay[];
  } | null;
  ai_analysis?: AIAnalysis | null;
  loading?: boolean;
}

interface RegionForecastProps {
  regionData: RegionForecastData | null;
  onClose: () => void;
}

export default function RegionForecast({ regionData, onClose }: RegionForecastProps) {
  const [activeTab, setActiveTab] = useState<'overview' | 'areas' | 'timeline'>('overview');
  const [selectedProvince, setSelectedProvince] = useState<AffectedArea | null>(null);
  const [selectedDistrict, setSelectedDistrict] = useState<District | null>(null);
  // Initial loading when region is selected (10 seconds) - only once for all tabs
  const [initialLoading, setInitialLoading] = useState(false);
  const [initialLoadingProgress, setInitialLoadingProgress] = useState(0);
  const [dataReady, setDataReady] = useState(false);
  const prevRegionRef = useRef<string | null>(null);
  const progressIntervalRef = useRef<NodeJS.Timeout | null>(null);

  // Handle initial loading when regionData changes
  useEffect(() => {
    if (!regionData) {
      // Reset all states when panel closes
      setInitialLoading(false);
      setInitialLoadingProgress(0);
      setDataReady(false);
      setActiveTab('overview');
      setSelectedProvince(null);
      setSelectedDistrict(null);
      prevRegionRef.current = null;
      if (progressIntervalRef.current) {
        clearInterval(progressIntervalRef.current);
        progressIntervalRef.current = null;
      }
      return;
    }

    // Check if region changed (new region selected)
    const currentRegion = regionData.region;
    if (currentRegion !== prevRegionRef.current) {
      prevRegionRef.current = currentRegion;

      // Reset states for new region
      setDataReady(false);
      setActiveTab('overview');
      setSelectedProvince(null);
      setSelectedDistrict(null);

      // Start 10s loading animation
      setInitialLoading(true);
      setInitialLoadingProgress(0);

      // Clear any existing interval
      if (progressIntervalRef.current) {
        clearInterval(progressIntervalRef.current);
      }

      const duration = 10000; // 10 seconds
      const interval = 100;
      const steps = duration / interval;
      let currentStep = 0;

      progressIntervalRef.current = setInterval(() => {
        currentStep++;
        setInitialLoadingProgress(Math.min((currentStep / steps) * 100, 100));

        if (currentStep >= steps) {
          if (progressIntervalRef.current) {
            clearInterval(progressIntervalRef.current);
            progressIntervalRef.current = null;
          }
          setInitialLoading(false);
          setInitialLoadingProgress(0);
          setDataReady(true);
        }
      }, interval);
    }

    return () => {
      if (progressIntervalRef.current) {
        clearInterval(progressIntervalRef.current);
        progressIntervalRef.current = null;
      }
    };
  }, [regionData?.region]);

  if (!regionData) return null;

  const getRegionName = (region: string) => {
    const names: Record<string, string> = {
      'north': 'Miền Bắc',
      'central': 'Miền Trung',
      'south': 'Miền Nam'
    };
    return names[region] || region;
  };

  const getImpactColor = (level: string) => {
    const l = level.toLowerCase();
    if (l.includes('rất cao') || l.includes('nguy')) return '#ef4444';
    if (l.includes('cao')) return '#f97316';
    if (l.includes('trung bình')) return '#eab308';
    return '#22c55e';
  };

  const getRiskColor = (score: number) => {
    if (score >= 8) return 'text-red-500 bg-red-500/10 border-red-500/30';
    if (score >= 6) return 'text-orange-500 bg-orange-500/10 border-orange-500/30';
    if (score >= 4) return 'text-yellow-500 bg-yellow-500/10 border-yellow-500/30';
    return 'text-green-500 bg-green-500/10 border-green-500/30';
  };

  const forecastObj = regionData.forecast as any;
  const forecast: ForecastDay[] = forecastObj?.data?.forecast_days || forecastObj?.forecast_days || [];
  const ai = regionData.ai_analysis;
  // Show loading if either API is loading OR initial 10s loading animation
  const isLoading = regionData.loading || initialLoading || !dataReady;

  const rainChartData = forecast.slice(0, 14).map(day => ({
    date: new Date(day.date).toLocaleDateString('vi-VN', { day: '2-digit', month: '2-digit' }),
    rain: day.daily_rain,
    accumulated: day.accumulated_3d
  }));

  const provinceData = ai?.affected_areas?.map(area => ({
    ...area,
    name: area.province.replace('Thừa Thiên ', 'TT-').replace('TP.', ''),
    fullName: area.province,
    color: getImpactColor(area.impact_level),
  })) || [];

  const formatDate = (dateStr: string) => {
    if (!dateStr || dateStr === 'N/A') return '-';
    try {
      return new Date(dateStr).toLocaleDateString('vi-VN', { day: '2-digit', month: '2-digit' });
    } catch {
      return dateStr;
    }
  };

  // Breadcrumb navigation
  const getBreadcrumb = () => {
    const parts = [getRegionName(regionData.region)];
    if (selectedProvince) parts.push(selectedProvince.province);
    if (selectedDistrict) parts.push(selectedDistrict.name);
    return parts;
  };

  const goBack = () => {
    if (selectedDistrict) {
      setSelectedDistrict(null);
    } else if (selectedProvince) {
      setSelectedProvince(null);
    }
  };

  // Handle tab change - no extra loading, data already loaded after initial 10s
  const handleTabChange = (tab: 'overview' | 'areas' | 'timeline') => {
    setActiveTab(tab);
  };

  // Province detail view
  const renderProvinceDetail = () => {
    if (!selectedProvince) return null;
    const districts = selectedProvince.districts || [];

    return (
      <div className="space-y-3">
        {/* Province Summary */}
        <div className="bg-gray-800/50 rounded-lg p-3">
          <div className="flex items-center justify-between mb-2">
            <h3 className="font-medium text-white">{selectedProvince.province}</h3>
            <span
              className="text-xs px-2 py-0.5 rounded"
              style={{ backgroundColor: `${getImpactColor(selectedProvince.impact_level)}20`, color: getImpactColor(selectedProvince.impact_level) }}
            >
              {selectedProvince.impact_level}
            </span>
          </div>
          <div className="grid grid-cols-2 gap-2 text-xs">
            <div><span className="text-gray-500">Mực nước:</span> <span className="text-cyan-400 font-medium">{selectedProvince.water_level_cm} cm</span></div>
            <div><span className="text-gray-500">Diện tích ngập:</span> <span className="text-blue-400 font-medium">{selectedProvince.flood_area_km2} km²</span></div>
          </div>
          {selectedProvince.reason && (
            <p className="text-xs text-gray-500 mt-2">{selectedProvince.reason}</p>
          )}
        </div>

        {/* Districts List */}
        <div className="space-y-2">
          <h4 className="text-xs font-medium text-gray-400 uppercase">Các huyện/quận ({districts.length})</h4>
          {districts.length > 0 ? (
            districts.map((district, i) => (
              <button
                key={i}
                onClick={() => setSelectedDistrict(district)}
                className="w-full bg-gray-800/30 hover:bg-gray-800/50 rounded-lg p-3 text-left transition-colors"
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className="w-1.5 h-6 rounded-full" style={{ backgroundColor: getImpactColor(district.impact_level) }} />
                    <div>
                      <div className="text-sm font-medium text-white flex items-center gap-2">
                        {district.name}
                        {district.evacuation_needed && (
                          <AlertTriangle className="w-3 h-3 text-red-500" />
                        )}
                      </div>
                      <span
                        className="text-[10px] px-1.5 py-0.5 rounded"
                        style={{ backgroundColor: `${getImpactColor(district.impact_level)}20`, color: getImpactColor(district.impact_level) }}
                      >
                        {district.impact_level}
                      </span>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <div className="text-right">
                      <div className="text-sm font-semibold text-cyan-400">{district.water_level_cm} cm</div>
                      <div className="text-[10px] text-gray-500">{district.flood_area_km2} km²</div>
                    </div>
                    <ChevronRight className="w-4 h-4 text-gray-500" />
                  </div>
                </div>
              </button>
            ))
          ) : (
            <div className="text-sm text-gray-500 text-center py-4">Chưa có dữ liệu chi tiết huyện</div>
          )}
        </div>
      </div>
    );
  };

  // District detail view
  const renderDistrictDetail = () => {
    if (!selectedDistrict) return null;

    return (
      <div className="space-y-3">
        {/* District Summary */}
        <div className={`rounded-lg p-4 border ${selectedDistrict.evacuation_needed ? 'bg-red-500/10 border-red-500/30' : 'bg-gray-800/50 border-gray-700'}`}>
          {selectedDistrict.evacuation_needed && (
            <div className="flex items-center gap-2 mb-3 text-red-400">
              <AlertTriangle className="w-4 h-4" />
              <span className="text-sm font-medium">Cần sơ tán dân</span>
            </div>
          )}
          <div className="flex items-center justify-between mb-3">
            <h3 className="font-medium text-white">{selectedDistrict.name}</h3>
            <span
              className="text-xs px-2 py-0.5 rounded"
              style={{ backgroundColor: `${getImpactColor(selectedDistrict.impact_level)}20`, color: getImpactColor(selectedDistrict.impact_level) }}
            >
              {selectedDistrict.impact_level}
            </span>
          </div>
          <div className="grid grid-cols-2 gap-3 text-sm">
            <div className="bg-gray-900/50 rounded p-2 text-center">
              <div className="text-xl font-bold text-cyan-400">{selectedDistrict.water_level_cm}</div>
              <div className="text-[10px] text-gray-500">cm mực nước</div>
            </div>
            <div className="bg-gray-900/50 rounded p-2 text-center">
              <div className="text-xl font-bold text-blue-400">{selectedDistrict.flood_area_km2}</div>
              <div className="text-[10px] text-gray-500">km² ngập</div>
            </div>
          </div>
          {selectedDistrict.notes && (
            <p className="text-xs text-gray-400 mt-3 p-2 bg-gray-900/30 rounded">{selectedDistrict.notes}</p>
          )}
        </div>

        {/* Affected Wards */}
        {selectedDistrict.affected_wards && selectedDistrict.affected_wards.length > 0 && (
          <div className="bg-gray-800/30 rounded-lg p-3">
            <h4 className="text-xs font-medium text-gray-400 uppercase mb-3">Xã/Phường bị ảnh hưởng ({selectedDistrict.affected_wards.length})</h4>
            <div className="flex flex-wrap gap-1.5">
              {selectedDistrict.affected_wards.map((ward, i) => (
                <span
                  key={i}
                  className="px-2 py-1 bg-gray-700/50 text-gray-300 text-xs rounded"
                >
                  {ward}
                </span>
              ))}
            </div>
          </div>
        )}

        {/* Emergency contacts for this area */}
        <div className="bg-gray-800/30 rounded-lg p-3">
          <h4 className="text-xs font-medium text-gray-400 mb-2">Liên hệ khẩn cấp</h4>
          <div className="grid grid-cols-2 gap-2 text-xs">
            <div className="flex justify-between"><span className="text-gray-500">Cứu hộ:</span><span className="font-mono text-white">114</span></div>
            <div className="flex justify-between"><span className="text-gray-500">Cứu thương:</span><span className="font-mono text-white">115</span></div>
            <div className="flex justify-between"><span className="text-gray-500">Công an:</span><span className="font-mono text-white">113</span></div>
            <div className="flex justify-between"><span className="text-gray-500">Điện lực:</span><span className="font-mono text-white">19006769</span></div>
          </div>
        </div>
      </div>
    );
  };

  return (
    <AnimatePresence>
      <motion.div
        initial={{ x: -450, opacity: 0 }}
        animate={{ x: 0, opacity: 1 }}
        exit={{ x: -450, opacity: 0 }}
        transition={{ type: 'spring', damping: 30, stiffness: 250 }}
        className="fixed left-0 top-14 bottom-0 w-[420px] bg-gray-900 z-[2000] overflow-hidden border-r border-gray-800"
      >
        {/* Header */}
        <div className="p-4 border-b border-gray-800">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              {(selectedProvince || selectedDistrict) && (
                <button onClick={goBack} className="p-1 hover:bg-gray-800 rounded transition-colors">
                  <ChevronLeft className="w-5 h-5 text-gray-400" />
                </button>
              )}
              <div>
                {/* Breadcrumb */}
                <div className="flex items-center gap-1 text-xs text-gray-500">
                  {getBreadcrumb().map((part, i) => (
                    <span key={i} className="flex items-center">
                      {i > 0 && <ChevronRight className="w-3 h-3 mx-1" />}
                      <span className={i === getBreadcrumb().length - 1 ? 'text-white' : ''}>{part}</span>
                    </span>
                  ))}
                </div>
                <p className="text-[10px] text-gray-600 mt-0.5">
                  {selectedDistrict ? 'Chi tiết huyện/quận' : selectedProvince ? 'Chi tiết tỉnh/TP' : 'Phân tích dự báo lũ lụt'}
                </p>
              </div>
            </div>
            <button onClick={onClose} className="p-1.5 hover:bg-gray-800 rounded-lg transition-colors">
              <X className="w-5 h-5 text-gray-400" />
            </button>
          </div>

          {/* Tabs - only show when not drilling down */}
          {!isLoading && ai && !selectedProvince && (
            <div className="flex gap-1 mt-3">
              {[
                { id: 'overview', label: 'Tổng quan' },
                { id: 'areas', label: 'Khu vực' },
                { id: 'timeline', label: 'Diễn biến' },
              ].map(tab => (
                <button
                  key={tab.id}
                  onClick={() => handleTabChange(tab.id as typeof activeTab)}
                  className={`flex-1 py-1.5 text-xs font-medium rounded transition-colors ${
                    activeTab === tab.id
                      ? 'bg-gray-800 text-white'
                      : 'text-gray-500 hover:text-gray-300'
                  }`}
                >
                  {tab.label}
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Content */}
        <div className="overflow-y-auto h-[calc(100%-100px)] p-4">
          {/* Loading */}
          {isLoading && (
            <div className="flex flex-col h-full gap-4">
              {/* Progress bar */}
              <div className="bg-gray-800/50 rounded-lg p-4">
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-2">
                    <Loader2 className="w-5 h-5 text-blue-500 animate-spin" />
                    <span className="text-sm text-gray-300">Đang tải dữ liệu {getRegionName(regionData.region)}...</span>
                  </div>
                  <span className="text-sm font-medium text-blue-400">{Math.round(initialLoadingProgress)}%</span>
                </div>
                <div className="w-full h-2 bg-gray-700 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-gradient-to-r from-blue-500 to-cyan-500 rounded-full transition-all duration-100"
                    style={{ width: `${initialLoadingProgress}%` }}
                  />
                </div>
                <p className="text-xs text-gray-500 mt-2 text-center">
                  AI đang phân tích dữ liệu thời tiết và dự báo lũ lụt...
                </p>
              </div>

              {/* Skeleton loaders */}
              <div className="space-y-4">
                {/* Risk Score Skeleton */}
                <div className="bg-gray-800/30 rounded-lg p-4 animate-pulse">
                  <div className="flex items-center gap-4">
                    <div className="w-16 h-12 bg-gray-700 rounded" />
                    <div className="flex-1">
                      <div className="h-4 w-24 bg-gray-700 rounded mb-2" />
                      <div className="h-3 w-full bg-gray-700/50 rounded" />
                    </div>
                  </div>
                </div>

                {/* Stats Skeleton */}
                <div className="grid grid-cols-3 gap-2">
                  {[1, 2, 3].map(i => (
                    <div key={i} className="bg-gray-800/30 rounded-lg p-3 text-center animate-pulse">
                      <div className="h-6 w-12 bg-gray-700 rounded mx-auto mb-1" />
                      <div className="h-3 w-16 bg-gray-700/50 rounded mx-auto" />
                    </div>
                  ))}
                </div>

                {/* Chart Skeleton */}
                <div className="bg-gray-800/30 rounded-lg p-3 animate-pulse">
                  <div className="h-4 w-32 bg-gray-700 rounded mb-3" />
                  <div className="h-32 bg-gray-700/30 rounded flex items-end justify-around px-2 pb-2">
                    {[40, 60, 80, 50, 70, 45, 55].map((h, i) => (
                      <div key={i} className="w-6 bg-gray-600/50 rounded-t" style={{ height: `${h}%` }} />
                    ))}
                  </div>
                </div>

                {/* Recommendations Skeleton */}
                <div className="bg-gray-800/30 rounded-lg p-3 animate-pulse">
                  <div className="h-4 w-40 bg-gray-700 rounded mb-3" />
                  <div className="space-y-2">
                    {[1, 2, 3].map(i => (
                      <div key={i} className="flex gap-2">
                        <div className="w-2 h-2 bg-gray-600 rounded-full mt-1" />
                        <div className="h-3 flex-1 bg-gray-700/50 rounded" />
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* District Detail View */}
          {!isLoading && selectedDistrict && renderDistrictDetail()}

          {/* Province Detail View */}
          {!isLoading && selectedProvince && !selectedDistrict && renderProvinceDetail()}

          {/* Main Views (when not drilling down) */}
          {!isLoading && !selectedProvince && (
            <>
              {/* Overview Tab */}
              {activeTab === 'overview' && (
                <div className="space-y-4">
                  {/* Risk Score */}
                  {ai?.overall_risk && (
                    <div className={`rounded-lg p-4 border ${getRiskColor(ai.overall_risk.score)}`}>
                      <div className="flex items-center gap-4">
                        <div className="text-4xl font-bold">{ai.overall_risk.score}<span className="text-lg opacity-60">/10</span></div>
                        <div className="flex-1">
                          <div className="font-medium">{ai.overall_risk.level}</div>
                          <p className="text-xs opacity-80 mt-1 line-clamp-2">{ai.summary}</p>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Key Numbers */}
                  {ai?.peak_rain && (
                    <div className="grid grid-cols-3 gap-2">
                      <div className="bg-gray-800/50 rounded-lg p-3 text-center">
                        <div className="text-xl font-bold text-blue-400">{ai.peak_rain.amount_mm?.toFixed(0) || 0}</div>
                        <div className="text-[10px] text-gray-500 mt-0.5">mm đỉnh mưa</div>
                      </div>
                      <div className="bg-gray-800/50 rounded-lg p-3 text-center">
                        <div className="text-lg font-bold text-white">{formatDate(ai.peak_rain.date)}</div>
                        <div className="text-[10px] text-gray-500 mt-0.5">ngày đỉnh</div>
                      </div>
                      <div className="bg-gray-800/50 rounded-lg p-3 text-center">
                        <div className="text-xl font-bold text-purple-400">{ai.affected_areas?.length || 0}</div>
                        <div className="text-[10px] text-gray-500 mt-0.5">tỉnh ảnh hưởng</div>
                      </div>
                    </div>
                  )}

                  {/* Rain Chart */}
                  {rainChartData.length > 0 && (
                    <div className="bg-gray-800/30 rounded-lg p-3">
                      <h3 className="text-xs font-medium text-gray-400 mb-3">Lượng mưa dự báo (mm)</h3>
                      <ResponsiveContainer width="100%" height={140}>
                        <BarChart data={rainChartData}>
                          <XAxis dataKey="date" tick={{ fill: '#6b7280', fontSize: 9 }} axisLine={false} tickLine={false} />
                          <YAxis tick={{ fill: '#6b7280', fontSize: 9 }} axisLine={false} tickLine={false} width={25} />
                          <Tooltip
                            contentStyle={{ backgroundColor: '#1f2937', border: 'none', borderRadius: 6, fontSize: 11 }}
                            formatter={(v: number) => [`${v.toFixed(1)} mm`]}
                          />
                          <Bar dataKey="rain" radius={[3, 3, 0, 0]}>
                            {rainChartData.map((entry, i) => (
                              <Cell key={i} fill={entry.rain > 50 ? '#ef4444' : entry.rain > 30 ? '#f97316' : '#3b82f6'} />
                            ))}
                          </Bar>
                        </BarChart>
                      </ResponsiveContainer>
                    </div>
                  )}

                  {/* Recommendations */}
                  {ai?.recommendations && (
                    <div className="space-y-3">
                      {ai.recommendations.government?.length > 0 && (
                        <div className="bg-gray-800/30 rounded-lg p-3">
                          <h4 className="text-xs font-medium text-blue-400 mb-2">Khuyến cáo chính quyền</h4>
                          <ul className="space-y-1.5">
                            {ai.recommendations.government.slice(0, 3).map((rec, i) => (
                              <li key={i} className="text-xs text-gray-300 flex gap-2">
                                <span className="text-blue-500">•</span>
                                <span>{rec}</span>
                              </li>
                            ))}
                          </ul>
                        </div>
                      )}
                      {ai.recommendations.citizens?.length > 0 && (
                        <div className="bg-gray-800/30 rounded-lg p-3">
                          <h4 className="text-xs font-medium text-green-400 mb-2">Khuyến cáo người dân</h4>
                          <ul className="space-y-1.5">
                            {ai.recommendations.citizens.slice(0, 3).map((rec, i) => (
                              <li key={i} className="text-xs text-gray-300 flex gap-2">
                                <span className="text-green-500">•</span>
                                <span>{rec}</span>
                              </li>
                            ))}
                          </ul>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              )}

              {/* Areas Tab */}
              {activeTab === 'areas' && (
                <div className="space-y-3">
                  {ai?.affected_areas && ai.affected_areas.length > 0 ? (
                    <>
                      <p className="text-xs text-gray-500">Click vào tỉnh để xem chi tiết huyện/xã</p>

                      {/* Water Level Chart */}
                      <div className="bg-gray-800/30 rounded-lg p-3">
                        <h3 className="text-xs font-medium text-gray-400 mb-3">Mực nước theo tỉnh (cm)</h3>
                        <ResponsiveContainer width="100%" height={Math.min(200, provinceData.length * 24)}>
                          <BarChart data={provinceData} layout="vertical">
                            <XAxis type="number" tick={{ fill: '#6b7280', fontSize: 9 }} axisLine={false} tickLine={false} />
                            <YAxis dataKey="name" type="category" tick={{ fill: '#9ca3af', fontSize: 10 }} axisLine={false} tickLine={false} width={70} />
                            <Tooltip
                              contentStyle={{ backgroundColor: '#1f2937', border: 'none', borderRadius: 6, fontSize: 11 }}
                              formatter={(v: number) => [`${v} cm`]}
                              labelFormatter={(l) => provinceData.find(p => p.name === l)?.fullName}
                            />
                            <Bar dataKey="water_level_cm" radius={[0, 4, 4, 0]} barSize={14}>
                              {provinceData.map((entry, i) => (
                                <Cell key={i} fill={entry.color} />
                              ))}
                            </Bar>
                          </BarChart>
                        </ResponsiveContainer>
                      </div>

                      {/* Province List - Clickable */}
                      <div className="space-y-2">
                        {ai.affected_areas.map((area, i) => (
                          <button
                            key={i}
                            onClick={() => setSelectedProvince(area)}
                            className="w-full bg-gray-800/30 hover:bg-gray-800/50 rounded-lg p-3 text-left transition-colors"
                          >
                            <div className="flex items-center justify-between">
                              <div className="flex items-center gap-2">
                                <div className="w-1.5 h-6 rounded-full" style={{ backgroundColor: getImpactColor(area.impact_level) }} />
                                <div>
                                  <div className="text-sm font-medium text-white">{area.province}</div>
                                  <span
                                    className="text-[10px] px-1.5 py-0.5 rounded"
                                    style={{ backgroundColor: `${getImpactColor(area.impact_level)}20`, color: getImpactColor(area.impact_level) }}
                                  >
                                    {area.impact_level}
                                  </span>
                                </div>
                              </div>
                              <div className="flex items-center gap-3">
                                <div className="text-right">
                                  <div className="text-sm font-semibold text-cyan-400">{area.water_level_cm} cm</div>
                                  <div className="text-[10px] text-gray-500">
                                    {area.districts?.length || 0} huyện
                                  </div>
                                </div>
                                <ChevronRight className="w-4 h-4 text-gray-500" />
                              </div>
                            </div>
                          </button>
                        ))}
                      </div>
                    </>
                  ) : (
                    <div className="bg-green-500/10 border border-green-500/30 rounded-lg p-6 text-center">
                      <div className="w-12 h-12 bg-green-500/20 rounded-full flex items-center justify-center mx-auto mb-3">
                        <span className="text-2xl">✓</span>
                      </div>
                      <h3 className="text-green-400 font-medium mb-1">Không có khu vực bị ảnh hưởng</h3>
                      <p className="text-xs text-green-300/70">
                        Lượng mưa dự báo thấp, không có nguy cơ ngập lụt trong 14 ngày tới.
                      </p>
                    </div>
                  )}
                </div>
              )}

              {/* Timeline Tab */}
              {activeTab === 'timeline' && ai?.flood_timeline && (
                <div className="space-y-4">
                  {/* Accumulated Chart */}
                  <div className="bg-gray-800/30 rounded-lg p-3">
                    <h3 className="text-xs font-medium text-gray-400 mb-3">Mưa tích lũy 3 ngày (mm)</h3>
                    <ResponsiveContainer width="100%" height={120}>
                      <AreaChart data={rainChartData}>
                        <defs>
                          <linearGradient id="accuGrad" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="0%" stopColor="#8b5cf6" stopOpacity={0.3} />
                            <stop offset="100%" stopColor="#8b5cf6" stopOpacity={0} />
                          </linearGradient>
                        </defs>
                        <XAxis dataKey="date" tick={{ fill: '#6b7280', fontSize: 9 }} axisLine={false} tickLine={false} />
                        <YAxis tick={{ fill: '#6b7280', fontSize: 9 }} axisLine={false} tickLine={false} width={25} />
                        <Tooltip contentStyle={{ backgroundColor: '#1f2937', border: 'none', borderRadius: 6, fontSize: 11 }} />
                        <Area type="monotone" dataKey="accumulated" stroke="#8b5cf6" fill="url(#accuGrad)" strokeWidth={2} />
                      </AreaChart>
                    </ResponsiveContainer>
                  </div>

                  {/* Timeline - Only show if there's actual flood risk (dates not "N/A") */}
                  {ai.flood_timeline.peak_date && ai.flood_timeline.peak_date !== 'N/A' ? (
                    <div className="bg-gray-800/30 rounded-lg p-3">
                      <h3 className="text-xs font-medium text-gray-400 mb-4">Diễn biến lũ</h3>
                      <div className="relative pl-4 space-y-3">
                        <div className="absolute left-[5px] top-1 bottom-1 w-0.5 bg-gray-700" />

                        {[
                          { date: ai.flood_timeline.rising_start, label: 'Nước bắt đầu dâng', color: '#3b82f6' },
                          { date: ai.flood_timeline.peak_date, label: 'ĐỈNH LŨ', color: '#ef4444', highlight: true },
                          { date: ai.flood_timeline.receding_start, label: 'Nước bắt đầu rút', color: '#f97316' },
                          { date: ai.flood_timeline.receding_end, label: 'Ổn định', color: '#22c55e' },
                        ].filter(item => item.date && item.date !== 'N/A').map((item, i) => (
                          <div key={i} className="relative flex items-center gap-3">
                            <div
                              className={`w-2.5 h-2.5 rounded-full -ml-[5px] z-10 ${item.highlight ? 'ring-2 ring-red-500/40' : ''}`}
                              style={{ backgroundColor: item.color }}
                            />
                            <div className={`flex-1 flex items-center justify-between ${item.highlight ? 'bg-red-500/10 -mx-1 px-2 py-1 rounded' : ''}`}>
                              <span className={`text-sm ${item.highlight ? 'font-semibold text-red-400' : 'text-gray-300'}`}>
                                {item.label}
                              </span>
                              <span className="text-xs font-mono text-gray-500">{formatDate(item.date)}</span>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  ) : (
                    <div className="bg-green-500/10 border border-green-500/30 rounded-lg p-4">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-green-500/20 rounded-full flex items-center justify-center">
                          <span className="text-2xl">✓</span>
                        </div>
                        <div>
                          <h3 className="text-green-400 font-medium">Không có nguy cơ lũ lụt</h3>
                          <p className="text-xs text-green-300/70 mt-1">
                            Lượng mưa dự báo thấp, thời tiết ổn định trong 14 ngày tới.
                          </p>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Daily bars */}
                  <div className="bg-gray-800/30 rounded-lg p-3">
                    <h3 className="text-xs font-medium text-gray-400 mb-3">Mưa theo ngày</h3>
                    <div className="flex gap-0.5">
                      {forecast.slice(0, 14).map((day, i) => {
                        const max = Math.max(...forecast.map(d => d.daily_rain), 1);
                        const pct = Math.max(8, (day.daily_rain / max) * 100);
                        return (
                          <div key={i} className="flex-1 flex flex-col items-center">
                            <div className="h-12 w-full bg-gray-700/30 rounded-sm relative">
                              <div
                                className="absolute bottom-0 w-full rounded-sm"
                                style={{
                                  height: `${pct}%`,
                                  backgroundColor: day.daily_rain > 50 ? '#ef4444' : day.daily_rain > 30 ? '#f97316' : '#3b82f6'
                                }}
                              />
                            </div>
                            <span className="text-[8px] text-gray-600 mt-0.5">{new Date(day.date).getDate()}</span>
                          </div>
                        );
                      })}
                    </div>
                  </div>

                  {/* Emergency contacts */}
                  <div className="bg-gray-800/30 rounded-lg p-3">
                    <h4 className="text-xs font-medium text-gray-400 mb-2">Liên hệ khẩn cấp</h4>
                    <div className="grid grid-cols-2 gap-2 text-xs">
                      <div className="flex justify-between"><span className="text-gray-500">Cứu hộ:</span><span className="font-mono text-white">114</span></div>
                      <div className="flex justify-between"><span className="text-gray-500">Cứu thương:</span><span className="font-mono text-white">115</span></div>
                      <div className="flex justify-between"><span className="text-gray-500">Công an:</span><span className="font-mono text-white">113</span></div>
                      <div className="flex justify-between"><span className="text-gray-500">Điện lực:</span><span className="font-mono text-white">19006769</span></div>
                    </div>
                  </div>
                </div>
              )}
            </>
          )}

          {/* Fallback if no AI */}
          {!isLoading && !ai && forecast.length > 0 && (
            <div className="bg-gray-800/30 rounded-lg p-3">
              <h3 className="text-xs font-medium text-gray-400 mb-3">Dự báo mưa</h3>
              <ResponsiveContainer width="100%" height={160}>
                <BarChart data={rainChartData}>
                  <XAxis dataKey="date" tick={{ fill: '#6b7280', fontSize: 9 }} axisLine={false} />
                  <YAxis tick={{ fill: '#6b7280', fontSize: 9 }} axisLine={false} width={25} />
                  <Tooltip contentStyle={{ backgroundColor: '#1f2937', border: 'none', borderRadius: 6 }} />
                  <Bar dataKey="rain" fill="#3b82f6" radius={[3, 3, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          )}
        </div>
      </motion.div>
    </AnimatePresence>
  );
}
