'use client';

import { useState, useEffect } from 'react';
import dynamic from 'next/dynamic';
import { Waves, Layers, Map, Bell, X, Droplets } from 'lucide-react';
import StationDetails from '@/components/StationDetails';
import RegionForecast from '@/components/RegionForecast';
import FloodZones from '@/components/FloodZones';
import AlertsList from '@/components/AlertsList';
import ReservoirPanel from '@/components/ReservoirPanel';
import { forecastApi, basinsApi } from '@/lib/api';

// Option 1: Original FloodMap with stations (BACKUP: FloodMap.tsx.backup)
// const FloodMap = dynamic(() => import('@/components/FloodMap'), {
//   ssr: false,
//   loading: () => (
//     <div className="w-full h-full flex items-center justify-center bg-gray-900">
//       <div className="text-gray-400">Loading map...</div>
//     </div>
//   ),
// });

// Option 2: Windy Embed (iframe) - Basic, no API key needed
// const FloodMap = dynamic(() => import('@/components/WindyMap'), {
//   ssr: false,
//   loading: () => (
//     <div className="w-full h-full flex items-center justify-center bg-gray-900">
//       <div className="text-gray-400">Loading Windy map...</div>
//     </div>
//   ),
// });

// Option 3: Windy Map API - Full features with Leaflet integration (requires API key)
// const FloodMap = dynamic(() => import('@/components/WindyMapAPI'), {
//   ssr: false,
//   loading: () => (
//     <div className="w-full h-full flex items-center justify-center bg-gray-900">
//       <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-blue-500"></div>
//     </div>
//   ),
// });

// Windy.com iframe (official embed)
const FloodMap = dynamic(() => import('@/components/WindyMap'), {
  ssr: false,
  loading: () => (
    <div className="w-full h-full flex items-center justify-center bg-gray-900">
      <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-blue-500"></div>
    </div>
  ),
});

interface Station {
  id: number;
  name: string;
  latitude: number;
  longitude: number;
  basin_id: number;
  basin_name?: string;
  basin_code?: string;
}

interface BasinSummary {
  basin_id: number;
  basin_name: string;
  total_stations: number;
  danger_count: number;
  warning_count: number;
  watch_count: number;
  safe_count: number;
}

export default function Home() {
  const [selectedStation, setSelectedStation] = useState<Station | null>(null);
  const [basins, setBasins] = useState<BasinSummary[]>([]);
  const [showBasinList, setShowBasinList] = useState(false);
  const [lastUpdate, setLastUpdate] = useState<Date | null>(null);
  const [regionData, setRegionData] = useState<any>(null);
  const [showFloodZones, setShowFloodZones] = useState(false);
  const [showDamAlerts, setShowDamAlerts] = useState(false);
  const [showReservoirs, setShowReservoirs] = useState(false);

  useEffect(() => {
    fetchOverviewData();
    const interval = setInterval(fetchOverviewData, 30 * 60 * 1000);
    return () => clearInterval(interval);
  }, []);

  const fetchOverviewData = async () => {
    try {
      const basinsData = await basinsApi.getSummary();
      setBasins(basinsData);

      setLastUpdate(new Date());
    } catch (error) {
      console.error('Error fetching overview data:', error);
      // Don't break the app if backend is not available
    }
  };

  const handleStationClick = (station: Station) => {
    setSelectedStation(station);
  };

  const handleCloseDetails = () => {
    setSelectedStation(null);
  };

  const handleRegionSelect = async (region: string) => {
    try {
      // Map region to basin name
      const regionToBasin: Record<string, string> = {
        'north': 'HONG',
        'central': 'CENTRAL',
        'south': 'MEKONG'
      };

      const basinName = regionToBasin[region];
      if (!basinName) return;

      // Show loading state immediately
      setRegionData({
        region: region,
        basin: basinName,
        forecast: null,
        ai_analysis: null,
        loading: true
      } as any);

      // Call API with async_mode=true (non-blocking)
      const data = await forecastApi.getBasinForecast(basinName, true, true);

      // Check if AI is still processing
      if (data.ai_status === 'processing' && data.job_id) {
        // Set initial data with forecast (AI still loading)
        setRegionData({
          region: region,
          basin: basinName,
          forecast: data.data,
          ai_analysis: null,
          loading: true  // Keep loading while AI processes
        } as any);

        // Start polling for AI result
        pollJobStatus(data.job_id, region, basinName, data.data);
      } else {
        // AI completed (from cache) or no AI
        setRegionData({
          region: region,
          basin: basinName,
          forecast: data.data,
          ai_analysis: data.ai_analysis,
          loading: false
        });
      }
    } catch (error) {
      console.error('Error fetching region data:', error);
      setRegionData(null);
    }
  };

  // Poll for AI job status until completed
  const pollJobStatus = async (
    jobId: string,
    region: string,
    basinName: string,
    forecastData: any
  ) => {
    const maxAttempts = 60;  // Max 60 attempts (2 minutes with 2s interval)
    let attempts = 0;

    const poll = async () => {
      try {
        const status = await forecastApi.getJobStatus(jobId);
        console.log(`[Poll] Job ${jobId}: ${status.status} (${status.progress}%)`);

        if (status.status === 'completed') {
          // AI analysis done!
          setRegionData({
            region: region,
            basin: basinName,
            forecast: forecastData,
            ai_analysis: status.result,
            loading: false
          });
          return;
        }

        if (status.status === 'failed') {
          console.error('AI analysis failed:', status.error);
          setRegionData({
            region: region,
            basin: basinName,
            forecast: forecastData,
            ai_analysis: null,
            loading: false
          });
          return;
        }

        // Still processing - continue polling
        attempts++;
        if (attempts < maxAttempts) {
          setTimeout(poll, 2000);  // Poll every 2 seconds
        } else {
          console.warn('Polling timeout, showing data without AI');
          setRegionData({
            region: region,
            basin: basinName,
            forecast: forecastData,
            ai_analysis: null,
            loading: false
          });
        }
      } catch (error) {
        console.error('Polling error:', error);
        setRegionData({
          region: region,
          basin: basinName,
          forecast: forecastData,
          ai_analysis: null,
          loading: false
        });
      }
    };

    // Start polling
    poll();
  };

  const handleCloseRegion = () => {
    setRegionData(null);
  };

  const getRiskColor = (basin: BasinSummary) => {
    if (basin.danger_count > 0) return 'bg-red-500';
    if (basin.warning_count > 0) return 'bg-orange-500';
    if (basin.watch_count > 0) return 'bg-yellow-500';
    return 'bg-green-500';
  };

  return (
    <div className="relative w-screen h-screen overflow-hidden bg-gray-900 pt-16">
      {/* Header */}
      <header className="absolute top-0 left-0 right-0 z-[1000] bg-gray-900/80 backdrop-blur-sm">
        <div className="px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Waves className="w-6 h-6 text-blue-400" />
            <div>
              <h1 className="text-base font-bold text-white">Hệ Thống Dự Báo Lũ Lụt</h1>
              <p className="text-xs text-gray-400">Vietnam Flood Forecast</p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <div className="text-right text-xs text-gray-400">
              <p>Cập nhật</p>
              <p className="text-white">{lastUpdate ? lastUpdate.toLocaleTimeString('vi-VN') : '--:--'}</p>
            </div>

            <select
              onChange={(e) => {
                const value = e.target.value;
                if (value) {
                  handleRegionSelect(value);
                  e.target.value = "";
                }
              }}
              className="px-2 py-1 bg-gray-800 text-white text-sm rounded border border-gray-700 hover:bg-gray-700"
              value=""
            >
              <option value="">Chọn vùng</option>
              <option value="north">Miền Bắc (Sông Hồng)</option>
              <option value="central">Miền Trung</option>
              <option value="south">Miền Nam (Sông Mekong)</option>
            </select>

            <button onClick={() => setShowBasinList(!showBasinList)} className="p-2 bg-gray-800 rounded hover:bg-gray-700" title="Lưu vực">
              <Layers className="w-4 h-4 text-white" />
            </button>
            <button onClick={() => setShowReservoirs(true)} className="p-2 bg-gray-800 rounded hover:bg-gray-700" title="Hồ chứa EVN">
              <Droplets className="w-4 h-4 text-white" />
            </button>
            <button onClick={() => setShowFloodZones(true)} className="p-2 bg-gray-800 rounded hover:bg-gray-700" title="Dự báo">
              <Map className="w-4 h-4 text-white" />
            </button>
            <button onClick={() => setShowDamAlerts(true)} className="p-2 bg-gray-800 rounded hover:bg-gray-700 relative" title="Cảnh báo">
              <Bell className="w-4 h-4 text-white" />
            </button>
          </div>
        </div>
      </header>

      {/* Basin List */}
      {showBasinList && (
        <div className="fixed right-0 top-16 bottom-0 w-64 bg-gray-900/95 backdrop-blur-md z-[1000] overflow-y-auto p-3">
          <h2 className="text-sm font-bold text-white mb-3">Danh sách lưu vực</h2>
          {basins.map((basin) => (
            <div key={basin.basin_id} className="glass-card rounded p-3 mb-2">
              <div className="flex items-center justify-between mb-1">
                <h3 className="text-sm font-semibold text-white">{basin.basin_name}</h3>
                <div className={`w-2 h-2 rounded-full ${getRiskColor(basin)}`}></div>
              </div>
              <div className="text-xs text-gray-400">
                Trạm: {basin.total_stations} | Cảnh báo: {basin.danger_count + basin.warning_count}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Alerts */}
      {/* Modals */}
      <StationDetails station={selectedStation} onClose={handleCloseDetails} />
      <RegionForecast regionData={regionData} onClose={handleCloseRegion} />

      {showFloodZones && <FloodZones onClose={() => setShowFloodZones(false)} />}

      {/* Reservoir Panel */}
      {showReservoirs && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-[2000] flex items-center justify-center p-4">
          <div className="relative w-full max-w-2xl max-h-[90vh] overflow-hidden">
            <button
              onClick={() => setShowReservoirs(false)}
              className="absolute -top-2 -right-2 z-10 p-2 bg-gray-800 rounded-full hover:bg-gray-700 text-white shadow-lg"
            >
              <X className="w-5 h-5" />
            </button>
            <ReservoirPanel />
          </div>
        </div>
      )}

      {/* Dam Alerts Panel */}
      {showDamAlerts && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-[2000] flex items-center justify-center p-4">
          <div className="relative w-full max-w-4xl max-h-[90vh] overflow-hidden">
            <button
              onClick={() => setShowDamAlerts(false)}
              className="absolute -top-2 -right-2 z-10 p-2 bg-gray-800 rounded-full hover:bg-gray-700 text-white shadow-lg"
            >
              <X className="w-5 h-5" />
            </button>
            <AlertsList />
          </div>
        </div>
      )}

      {/* Map */}
      <div className="absolute inset-x-0 bottom-0 top-16 w-full h-full z-0">
        <FloodMap onStationClick={handleStationClick} selectedStation={selectedStation} />
      </div>
    </div>
  );
}
