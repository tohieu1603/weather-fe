'use client';

import { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  X, MapPin, Loader2, CloudRain, Droplets, Clock,
  AlertTriangle, CheckCircle, Navigation, Search, ChevronDown, ChevronRight
} from 'lucide-react';
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell,
  AreaChart, Area
} from 'recharts';
import { rainfallApi } from '@/lib/api';

interface RainfallAnalysisProps {
  isOpen: boolean;
  onClose: () => void;
}

interface DailyForecast {
  date: string;
  precipitation_mm: number;
  rain_mm: number;
  rain_hours: number;
  probability_percent: number;
  risk_code: string;
  risk_level: string;
  risk_description: string;
}

interface RainfallData {
  location: {
    code?: string;
    name?: string;
    region?: string;
    coordinates?: {
      latitude: number;
      longitude: number;
    };
    address?: {
      ward?: string;
      district?: string;
      province?: string;
      full_address?: string;
    };
    nearest_station?: {
      code: string;
      name: string;
      region: string;
    };
  };
  analysis: {
    summary: {
      total_rainfall_mm: number;
      max_daily_rainfall_mm: number;
      max_day_date: string;
      avg_daily_rainfall_mm: number;
      total_rain_hours: number;
      forecast_days: number;
    };
    overall_risk: {
      code: string;
      level: string;
      description: string;
    };
    daily_forecast: DailyForecast[];
    peak_hours: Array<{ time: string; precipitation_mm: number }>;
    recommendations: string[];
  };
}

interface SearchResult {
  display_name: string;
  lat: number;
  lon: number;
  type: string;
  ward: string;
  district: string;
  province: string;
}

interface District {
  name: string;
  lat: number;
  lon: number;
  type: string;
}

// Full 63 provinces of Vietnam grouped by region
const provinces = {
  'Miền Bắc': [
    { code: 'hanoi', name: 'Hà Nội' },
    { code: 'hai_phong', name: 'Hải Phòng' },
    { code: 'quang_ninh', name: 'Quảng Ninh' },
    { code: 'bac_ninh', name: 'Bắc Ninh' },
    { code: 'hai_duong', name: 'Hải Dương' },
    { code: 'hung_yen', name: 'Hưng Yên' },
    { code: 'thai_binh', name: 'Thái Bình' },
    { code: 'nam_dinh', name: 'Nam Định' },
    { code: 'ninh_binh', name: 'Ninh Bình' },
    { code: 'ha_nam', name: 'Hà Nam' },
    { code: 'vinh_phuc', name: 'Vĩnh Phúc' },
    { code: 'bac_giang', name: 'Bắc Giang' },
    { code: 'phu_tho', name: 'Phú Thọ' },
    { code: 'thai_nguyen', name: 'Thái Nguyên' },
    { code: 'bac_kan', name: 'Bắc Kạn' },
    { code: 'cao_bang', name: 'Cao Bằng' },
    { code: 'lang_son', name: 'Lạng Sơn' },
    { code: 'tuyen_quang', name: 'Tuyên Quang' },
    { code: 'ha_giang', name: 'Hà Giang' },
    { code: 'yen_bai', name: 'Yên Bái' },
    { code: 'lao_cai', name: 'Lào Cai' },
    { code: 'lai_chau', name: 'Lai Châu' },
    { code: 'dien_bien', name: 'Điện Biên' },
    { code: 'son_la', name: 'Sơn La' },
    { code: 'hoa_binh', name: 'Hòa Bình' },
  ],
  'Miền Trung': [
    { code: 'thanh_hoa', name: 'Thanh Hóa' },
    { code: 'nghe_an', name: 'Nghệ An' },
    { code: 'ha_tinh', name: 'Hà Tĩnh' },
    { code: 'quang_binh', name: 'Quảng Bình' },
    { code: 'quang_tri', name: 'Quảng Trị' },
    { code: 'thua_thien_hue', name: 'Thừa Thiên Huế' },
    { code: 'da_nang', name: 'Đà Nẵng' },
    { code: 'quang_nam', name: 'Quảng Nam' },
    { code: 'quang_ngai', name: 'Quảng Ngãi' },
    { code: 'binh_dinh', name: 'Bình Định' },
    { code: 'phu_yen', name: 'Phú Yên' },
    { code: 'khanh_hoa', name: 'Khánh Hòa' },
    { code: 'ninh_thuan', name: 'Ninh Thuận' },
    { code: 'binh_thuan', name: 'Bình Thuận' },
  ],
  'Tây Nguyên': [
    { code: 'kon_tum', name: 'Kon Tum' },
    { code: 'gia_lai', name: 'Gia Lai' },
    { code: 'dak_lak', name: 'Đắk Lắk' },
    { code: 'dak_nong', name: 'Đắk Nông' },
    { code: 'lam_dong', name: 'Lâm Đồng' },
  ],
  'Miền Nam': [
    { code: 'ho_chi_minh', name: 'TP. Hồ Chí Minh' },
    { code: 'binh_duong', name: 'Bình Dương' },
    { code: 'dong_nai', name: 'Đồng Nai' },
    { code: 'binh_phuoc', name: 'Bình Phước' },
    { code: 'tay_ninh', name: 'Tây Ninh' },
    { code: 'ba_ria_vung_tau', name: 'Bà Rịa-Vũng Tàu' },
    { code: 'long_an', name: 'Long An' },
    { code: 'tien_giang', name: 'Tiền Giang' },
    { code: 'ben_tre', name: 'Bến Tre' },
    { code: 'tra_vinh', name: 'Trà Vinh' },
    { code: 'vinh_long', name: 'Vĩnh Long' },
    { code: 'dong_thap', name: 'Đồng Tháp' },
    { code: 'an_giang', name: 'An Giang' },
    { code: 'kien_giang', name: 'Kiên Giang' },
    { code: 'can_tho', name: 'Cần Thơ' },
    { code: 'hau_giang', name: 'Hậu Giang' },
    { code: 'soc_trang', name: 'Sóc Trăng' },
    { code: 'bac_lieu', name: 'Bạc Liêu' },
    { code: 'ca_mau', name: 'Cà Mau' },
  ],
};

export default function RainfallAnalysis({ isOpen, onClose }: RainfallAnalysisProps) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [data, setData] = useState<RainfallData | null>(null);
  const [geoError, setGeoError] = useState<string | null>(null);
  const [searchMode, setSearchMode] = useState<'gps' | 'province' | 'search'>('gps');
  const [expandedRegion, setExpandedRegion] = useState<string | null>('Miền Bắc');

  // Province drill-down state
  const [selectedProvince, setSelectedProvince] = useState<{ code: string; name: string } | null>(null);
  const [districts, setDistricts] = useState<District[]>([]);
  const [loadingDistricts, setLoadingDistricts] = useState(false);

  // Search state
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<SearchResult[]>([]);
  const [searchLoading, setSearchLoading] = useState(false);
  const [searchTimeout, setSearchTimeoutState] = useState<NodeJS.Timeout | null>(null);

  // Debounced search
  useEffect(() => {
    if (searchTimeout) clearTimeout(searchTimeout);

    if (searchQuery.length >= 2) {
      const timeout = setTimeout(async () => {
        setSearchLoading(true);
        try {
          const result = await rainfallApi.searchLocations(searchQuery);
          setSearchResults(result.results || []);
        } catch (err) {
          console.error('Search error:', err);
          setSearchResults([]);
        } finally {
          setSearchLoading(false);
        }
      }, 500);
      setSearchTimeoutState(timeout);
    } else {
      setSearchResults([]);
    }

    return () => {
      if (searchTimeout) clearTimeout(searchTimeout);
    };
  }, [searchQuery]);

  const getCurrentLocation = () => {
    setLoading(true);
    setError(null);
    setGeoError(null);

    if (!navigator.geolocation) {
      setGeoError('Trình duyệt không hỗ trợ định vị');
      setLoading(false);
      return;
    }

    navigator.geolocation.getCurrentPosition(
      async (position) => {
        const { latitude, longitude } = position.coords;
        try {
          const result = await rainfallApi.analyzeByLocation(latitude, longitude);
          setData(result);
        } catch (err: any) {
          setError(err.response?.data?.detail || 'Không thể lấy dữ liệu');
        } finally {
          setLoading(false);
        }
      },
      (err) => {
        setLoading(false);
        switch (err.code) {
          case err.PERMISSION_DENIED:
            setGeoError('Bạn đã từ chối quyền truy cập vị trí.');
            break;
          case err.POSITION_UNAVAILABLE:
            setGeoError('Không thể xác định vị trí.');
            break;
          case err.TIMEOUT:
            setGeoError('Hết thời gian chờ.');
            break;
          default:
            setGeoError('Lỗi không xác định.');
        }
      },
      { enableHighAccuracy: true, timeout: 10000, maximumAge: 0 }
    );
  };

  const analyzeByCoordinates = async (lat: number, lon: number) => {
    setLoading(true);
    setError(null);
    try {
      const result = await rainfallApi.analyzeByLocation(lat, lon);
      setData(result);
    } catch (err: any) {
      setError(err.response?.data?.detail || 'Không thể lấy dữ liệu');
    } finally {
      setLoading(false);
    }
  };

  const selectProvince = async (province: { code: string; name: string }) => {
    setSelectedProvince(province);
    setLoadingDistricts(true);
    setDistricts([]);

    try {
      const result = await rainfallApi.getProvinceDistricts(province.code);
      setDistricts(result.districts || []);
    } catch (err) {
      console.error('Error loading districts:', err);
    } finally {
      setLoadingDistricts(false);
    }
  };

  const analyzeByProvince = async (provinceCode: string) => {
    setLoading(true);
    setError(null);
    try {
      const result = await rainfallApi.analyzeByProvince(provinceCode);
      setData(result);
    } catch (err: any) {
      setError(err.response?.data?.detail || 'Không thể lấy dữ liệu');
    } finally {
      setLoading(false);
    }
  };

  const getRiskColor = (code: string) => {
    switch (code) {
      case 'very_high': return 'text-red-500 bg-red-500/10 border-red-500/30';
      case 'high': return 'text-orange-500 bg-orange-500/10 border-orange-500/30';
      case 'medium': return 'text-yellow-500 bg-yellow-500/10 border-yellow-500/30';
      case 'low': return 'text-green-500 bg-green-500/10 border-green-500/30';
      default: return 'text-blue-500 bg-blue-500/10 border-blue-500/30';
    }
  };

  const getRiskBgColor = (code: string) => {
    switch (code) {
      case 'very_high': return '#ef4444';
      case 'high': return '#f97316';
      case 'medium': return '#eab308';
      case 'low': return '#22c55e';
      default: return '#3b82f6';
    }
  };

  const formatDate = (dateStr: string) => {
    try {
      return new Date(dateStr).toLocaleDateString('vi-VN', { day: '2-digit', month: '2-digit' });
    } catch {
      return dateStr;
    }
  };

  const getLocationName = () => {
    if (!data?.location) return '';
    if (data.location.name) return data.location.name;
    const addr = data.location.address;
    if (addr) {
      const parts = [];
      if (addr.ward) parts.push(addr.ward);
      if (addr.district) parts.push(addr.district);
      if (addr.province) parts.push(addr.province);
      if (parts.length > 0) return parts.join(', ');
    }
    if (data.location.nearest_station?.name) return data.location.nearest_station.name;
    return 'Vị trí đã chọn';
  };

  const getCoordinates = () => {
    if (!data?.location?.coordinates) return null;
    return `${data.location.coordinates.latitude.toFixed(4)}, ${data.location.coordinates.longitude.toFixed(4)}`;
  };

  const resetSelection = () => {
    setSelectedProvince(null);
    setDistricts([]);
    setSearchQuery('');
    setSearchResults([]);
  };

  useEffect(() => {
    if (!isOpen) {
      setData(null);
      setError(null);
      setGeoError(null);
      setLoading(false);
      resetSelection();
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const chartData = data?.analysis?.daily_forecast?.map(day => ({
    date: formatDate(day.date),
    rain: day.precipitation_mm,
    hours: day.rain_hours,
    prob: day.probability_percent,
    risk: day.risk_code
  })) || [];

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[2000] flex items-center justify-center p-4"
        onClick={onClose}
      >
        <motion.div
          initial={{ scale: 0.9, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          exit={{ scale: 0.9, opacity: 0 }}
          transition={{ type: 'spring', damping: 25, stiffness: 300 }}
          className="bg-gray-900 rounded-xl w-full max-w-lg max-h-[90vh] overflow-hidden border border-gray-800"
          onClick={(e) => e.stopPropagation()}
        >
          {/* Header */}
          <div className="p-4 border-b border-gray-800 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <CloudRain className="w-5 h-5 text-blue-400" />
              <div>
                <h2 className="font-semibold text-white">Phân tích lượng mưa</h2>
                <p className="text-xs text-gray-500">Dự báo 7 ngày theo vị trí</p>
              </div>
            </div>
            <button onClick={onClose} className="p-1.5 hover:bg-gray-800 rounded-lg transition-colors">
              <X className="w-5 h-5 text-gray-400" />
            </button>
          </div>

          {/* Content */}
          <div className="overflow-y-auto max-h-[calc(90vh-80px)] p-4">
            {/* Location Selection */}
            {!data && !loading && !error && (
              <div className="space-y-4">
                {/* Mode Toggle */}
                <div className="flex gap-1 p-1 bg-gray-800/50 rounded-lg">
                  <button
                    onClick={() => { setSearchMode('gps'); resetSelection(); }}
                    className={`flex-1 py-2 px-2 rounded-md text-xs font-medium transition-colors flex items-center justify-center gap-1 ${
                      searchMode === 'gps' ? 'bg-blue-600 text-white' : 'text-gray-400 hover:text-white'
                    }`}
                  >
                    <Navigation className="w-3 h-3" />
                    GPS
                  </button>
                  <button
                    onClick={() => { setSearchMode('province'); resetSelection(); }}
                    className={`flex-1 py-2 px-2 rounded-md text-xs font-medium transition-colors flex items-center justify-center gap-1 ${
                      searchMode === 'province' ? 'bg-blue-600 text-white' : 'text-gray-400 hover:text-white'
                    }`}
                  >
                    <MapPin className="w-3 h-3" />
                    Tỉnh/Huyện
                  </button>
                  <button
                    onClick={() => { setSearchMode('search'); resetSelection(); }}
                    className={`flex-1 py-2 px-2 rounded-md text-xs font-medium transition-colors flex items-center justify-center gap-1 ${
                      searchMode === 'search' ? 'bg-blue-600 text-white' : 'text-gray-400 hover:text-white'
                    }`}
                  >
                    <Search className="w-3 h-3" />
                    Tìm kiếm
                  </button>
                </div>

                {/* GPS Mode */}
                {searchMode === 'gps' && (
                  <div className="text-center py-8">
                    <div className="w-16 h-16 mx-auto bg-blue-500/10 rounded-full flex items-center justify-center mb-4">
                      <MapPin className="w-8 h-8 text-blue-400" />
                    </div>
                    <h3 className="text-lg font-medium text-white mb-2">Xác định vị trí</h3>
                    <p className="text-sm text-gray-400 mb-6">Sử dụng GPS để phân tích lượng mưa tại vị trí hiện tại</p>
                    <button
                      onClick={getCurrentLocation}
                      className="px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium transition-colors flex items-center gap-2 mx-auto"
                    >
                      <Navigation className="w-4 h-4" />
                      Lấy vị trí hiện tại
                    </button>
                    {geoError && (
                      <div className="mt-4 p-3 bg-red-500/10 border border-red-500/30 rounded-lg text-sm text-red-400">
                        {geoError}
                      </div>
                    )}
                  </div>
                )}

                {/* Province/District Mode */}
                {searchMode === 'province' && (
                  <div className="space-y-3">
                    {/* Breadcrumb */}
                    {selectedProvince && (
                      <div className="flex items-center gap-2 text-sm">
                        <button onClick={resetSelection} className="text-blue-400 hover:text-blue-300">
                          Tỉnh/Thành
                        </button>
                        <ChevronRight className="w-4 h-4 text-gray-500" />
                        <span className="text-white">{selectedProvince.name}</span>
                      </div>
                    )}

                    {/* Province List */}
                    {!selectedProvince && (
                      <>
                        <p className="text-sm text-gray-400">Chọn tỉnh/thành phố:</p>
                        <div className="max-h-72 overflow-y-auto space-y-2">
                          {Object.entries(provinces).map(([region, provList]) => (
                            <div key={region} className="border border-gray-700 rounded-lg overflow-hidden">
                              <button
                                onClick={() => setExpandedRegion(expandedRegion === region ? null : region)}
                                className="w-full px-3 py-2 bg-gray-800/50 hover:bg-gray-800 flex items-center justify-between"
                              >
                                <span className="text-sm font-medium text-white">{region} ({provList.length})</span>
                                <ChevronDown className={`w-4 h-4 text-gray-400 transition-transform ${expandedRegion === region ? 'rotate-180' : ''}`} />
                              </button>
                              {expandedRegion === region && (
                                <div className="grid grid-cols-2 gap-1 p-2 bg-gray-800/30">
                                  {provList.map((prov) => (
                                    <button
                                      key={prov.code}
                                      onClick={() => selectProvince(prov)}
                                      className="p-2 bg-gray-700/50 hover:bg-gray-700 rounded text-left transition-colors flex items-center justify-between"
                                    >
                                      <span className="text-xs text-white">{prov.name}</span>
                                      <ChevronRight className="w-3 h-3 text-gray-500" />
                                    </button>
                                  ))}
                                </div>
                              )}
                            </div>
                          ))}
                        </div>
                      </>
                    )}

                    {/* District List */}
                    {selectedProvince && (
                      <div className="space-y-3">
                        {loadingDistricts ? (
                          <div className="text-center py-8">
                            <Loader2 className="w-6 h-6 text-blue-500 animate-spin mx-auto mb-2" />
                            <p className="text-sm text-gray-400">Đang tải quận/huyện...</p>
                          </div>
                        ) : districts.length > 0 ? (
                          <>
                            <div className="flex items-center justify-between">
                              <p className="text-sm text-gray-400">Chọn quận/huyện ({districts.length}):</p>
                              <button
                                onClick={() => analyzeByProvince(selectedProvince.code)}
                                className="text-xs text-blue-400 hover:text-blue-300"
                              >
                                Xem toàn tỉnh
                              </button>
                            </div>
                            <div className="grid grid-cols-2 gap-2 max-h-60 overflow-y-auto">
                              {districts.map((district, i) => (
                                <button
                                  key={i}
                                  onClick={() => analyzeByCoordinates(district.lat, district.lon)}
                                  className="p-2 bg-gray-800/50 hover:bg-gray-800 rounded text-left transition-colors"
                                >
                                  <span className="text-xs text-white">{district.name}</span>
                                </button>
                              ))}
                            </div>
                          </>
                        ) : (
                          <div className="text-center py-6">
                            <p className="text-sm text-gray-400 mb-3">Không tìm thấy quận/huyện</p>
                            <button
                              onClick={() => analyzeByProvince(selectedProvince.code)}
                              className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-sm"
                            >
                              Xem dự báo toàn tỉnh {selectedProvince.name}
                            </button>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                )}

                {/* Search Mode */}
                {searchMode === 'search' && (
                  <div className="space-y-3">
                    <p className="text-sm text-gray-400">Tìm kiếm địa điểm (quận, huyện, xã, phường):</p>
                    <div className="relative">
                      <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
                      <input
                        type="text"
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        placeholder="VD: Cầu Giấy, Quận 1, Xã Đông Anh..."
                        className="w-full pl-10 pr-4 py-3 bg-gray-800 border border-gray-700 rounded-lg text-white text-sm placeholder-gray-500 focus:outline-none focus:border-blue-500"
                      />
                      {searchLoading && (
                        <Loader2 className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-blue-500 animate-spin" />
                      )}
                    </div>

                    {/* Search Results */}
                    {searchResults.length > 0 && (
                      <div className="space-y-2 max-h-60 overflow-y-auto">
                        {searchResults.map((result, i) => (
                          <button
                            key={i}
                            onClick={() => analyzeByCoordinates(result.lat, result.lon)}
                            className="w-full p-3 bg-gray-800/50 hover:bg-gray-800 rounded-lg text-left transition-colors"
                          >
                            <div className="text-sm text-white">{result.ward || result.district || result.province}</div>
                            <div className="text-xs text-gray-500 mt-1 truncate">{result.display_name}</div>
                          </button>
                        ))}
                      </div>
                    )}

                    {searchQuery.length >= 2 && !searchLoading && searchResults.length === 0 && (
                      <div className="text-center py-6 text-gray-400 text-sm">
                        Không tìm thấy kết quả cho "{searchQuery}"
                      </div>
                    )}
                  </div>
                )}
              </div>
            )}

            {/* Loading */}
            {loading && (
              <div className="text-center py-12">
                <Loader2 className="w-10 h-10 text-blue-500 animate-spin mx-auto mb-4" />
                <p className="text-gray-400">Đang phân tích dữ liệu...</p>
              </div>
            )}

            {/* Error */}
            {error && (
              <div className="text-center py-8">
                <AlertTriangle className="w-10 h-10 text-red-500 mx-auto mb-4" />
                <p className="text-red-400 mb-4">{error}</p>
                <button
                  onClick={() => { setError(null); setData(null); resetSelection(); }}
                  className="px-4 py-2 bg-gray-800 hover:bg-gray-700 text-white rounded-lg text-sm"
                >
                  Thử lại
                </button>
              </div>
            )}

            {/* Results */}
            {data && !loading && (
              <div className="space-y-4">
                {/* Location Info */}
                <div className="bg-gray-800/50 rounded-lg p-3">
                  <div className="flex items-start gap-3">
                    <MapPin className="w-5 h-5 text-blue-400 mt-0.5" />
                    <div className="flex-1">
                      <h3 className="font-medium text-white">{getLocationName()}</h3>
                      {getCoordinates() && <p className="text-xs text-gray-500 mt-1">{getCoordinates()}</p>}
                      {data.location.region && <span className="text-xs text-gray-500">Vùng: {data.location.region}</span>}
                    </div>
                    <button onClick={() => { setData(null); resetSelection(); }} className="text-xs text-blue-400 hover:text-blue-300">
                      Đổi vị trí
                    </button>
                  </div>
                </div>

                {/* Overall Risk */}
                {data.analysis?.overall_risk && (
                  <div className={`rounded-lg p-4 border ${getRiskColor(data.analysis.overall_risk.code)}`}>
                    <div className="flex items-center justify-between">
                      <div>
                        <div className="text-sm text-gray-400">Mức độ rủi ro</div>
                        <div className="text-xl font-bold">{data.analysis.overall_risk.level}</div>
                      </div>
                      {data.analysis.overall_risk.code === 'very_low' ? (
                        <CheckCircle className="w-8 h-8" />
                      ) : (
                        <AlertTriangle className="w-8 h-8" />
                      )}
                    </div>
                    <p className="text-sm mt-2 opacity-80">{data.analysis.overall_risk.description}</p>
                  </div>
                )}

                {/* Summary Stats */}
                {data.analysis?.summary && (
                  <div className="grid grid-cols-3 gap-2">
                    <div className="bg-gray-800/50 rounded-lg p-3 text-center">
                      <Droplets className="w-5 h-5 text-blue-400 mx-auto mb-1" />
                      <div className="text-lg font-bold text-white">{data.analysis.summary.total_rainfall_mm}</div>
                      <div className="text-[10px] text-gray-500">mm tổng</div>
                    </div>
                    <div className="bg-gray-800/50 rounded-lg p-3 text-center">
                      <CloudRain className="w-5 h-5 text-orange-400 mx-auto mb-1" />
                      <div className="text-lg font-bold text-white">{data.analysis.summary.max_daily_rainfall_mm}</div>
                      <div className="text-[10px] text-gray-500">mm đỉnh</div>
                    </div>
                    <div className="bg-gray-800/50 rounded-lg p-3 text-center">
                      <Clock className="w-5 h-5 text-cyan-400 mx-auto mb-1" />
                      <div className="text-lg font-bold text-white">{data.analysis.summary.total_rain_hours}</div>
                      <div className="text-[10px] text-gray-500">giờ mưa</div>
                    </div>
                  </div>
                )}

                {/* Rain Chart */}
                {chartData.length > 0 && (
                  <div className="bg-gray-800/30 rounded-lg p-3">
                    <h4 className="text-xs font-medium text-gray-400 mb-3">Dự báo lượng mưa (mm)</h4>
                    <ResponsiveContainer width="100%" height={140}>
                      <BarChart data={chartData}>
                        <XAxis dataKey="date" tick={{ fill: '#6b7280', fontSize: 9 }} axisLine={false} tickLine={false} />
                        <YAxis tick={{ fill: '#6b7280', fontSize: 9 }} axisLine={false} tickLine={false} width={25} />
                        <Tooltip contentStyle={{ backgroundColor: '#1f2937', border: 'none', borderRadius: 6, fontSize: 11 }} formatter={(v: number) => [`${v.toFixed(1)} mm`]} />
                        <Bar dataKey="rain" radius={[3, 3, 0, 0]}>
                          {chartData.map((entry, i) => (
                            <Cell key={i} fill={getRiskBgColor(entry.risk)} />
                          ))}
                        </Bar>
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                )}

                {/* Probability Chart */}
                {chartData.length > 0 && (
                  <div className="bg-gray-800/30 rounded-lg p-3">
                    <h4 className="text-xs font-medium text-gray-400 mb-3">Xác suất mưa (%)</h4>
                    <ResponsiveContainer width="100%" height={100}>
                      <AreaChart data={chartData}>
                        <defs>
                          <linearGradient id="probGrad" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="0%" stopColor="#3b82f6" stopOpacity={0.3} />
                            <stop offset="100%" stopColor="#3b82f6" stopOpacity={0} />
                          </linearGradient>
                        </defs>
                        <XAxis dataKey="date" tick={{ fill: '#6b7280', fontSize: 9 }} axisLine={false} tickLine={false} />
                        <YAxis tick={{ fill: '#6b7280', fontSize: 9 }} axisLine={false} tickLine={false} width={25} domain={[0, 100]} />
                        <Tooltip contentStyle={{ backgroundColor: '#1f2937', border: 'none', borderRadius: 6, fontSize: 11 }} formatter={(v: number) => [`${v}%`]} />
                        <Area type="monotone" dataKey="prob" stroke="#3b82f6" fill="url(#probGrad)" strokeWidth={2} />
                      </AreaChart>
                    </ResponsiveContainer>
                  </div>
                )}

                {/* Daily Details */}
                {data.analysis?.daily_forecast && data.analysis.daily_forecast.length > 0 && (
                  <div className="bg-gray-800/30 rounded-lg p-3">
                    <h4 className="text-xs font-medium text-gray-400 mb-3">Chi tiết theo ngày</h4>
                    <div className="space-y-2 max-h-48 overflow-y-auto">
                      {data.analysis.daily_forecast.map((day, i) => (
                        <div key={i} className="flex items-center justify-between p-2 bg-gray-800/50 rounded">
                          <div className="flex items-center gap-2">
                            <div className="w-1.5 h-6 rounded-full" style={{ backgroundColor: getRiskBgColor(day.risk_code) }} />
                            <div>
                              <div className="text-sm text-white">{formatDate(day.date)}</div>
                              <div className="text-[10px] text-gray-500">{day.rain_hours}h mưa</div>
                            </div>
                          </div>
                          <div className="text-right">
                            <div className="text-sm font-medium text-blue-400">{day.precipitation_mm} mm</div>
                            <div className="text-[10px] px-1.5 py-0.5 rounded" style={{ backgroundColor: `${getRiskBgColor(day.risk_code)}20`, color: getRiskBgColor(day.risk_code) }}>
                              {day.risk_level}
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Recommendations */}
                {data.analysis?.recommendations && data.analysis.recommendations.length > 0 && (
                  <div className="bg-gray-800/30 rounded-lg p-3">
                    <h4 className="text-xs font-medium text-gray-400 mb-2">Khuyến nghị</h4>
                    <ul className="space-y-1.5">
                      {data.analysis.recommendations.map((rec, i) => (
                        <li key={i} className="text-xs text-gray-300 flex gap-2">
                          <span className="text-blue-500">•</span>
                          <span>{rec}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
            )}
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}
