'use client'

import { useState, useEffect, useRef } from 'react'
import {
  X, ChevronRight, MapPin, Clock, AlertTriangle,
  Droplets, CloudRain, Sun, Thermometer, Waves, Cylinder,
  CheckCircle, Wind, Radiation, Brain, Info, Loader2
} from 'lucide-react'
import { alertsApi } from '@/lib/api'

interface AlertData {
  id: string
  type: string
  category: string
  title: string
  severity: 'critical' | 'high' | 'medium' | 'low'
  date: string
  region: string
  provinces: string[]
  description: string
  data: Record<string, any>
  recommendations: string[]
  flood_zones?: Array<{
    province: string
    districts: string[]
    risk: string
  }>
}

interface AlertsResponse {
  generated_at: string
  total: number
  alerts: AlertData[]
  summary: {
    critical: number
    high: number
    medium: number
    low: number
  }
  by_category: Record<string, number>
}

interface ReservoirAnalysis {
  basin: string
  analysis: {
    peak_rain?: { max_mm: number; date: string; location: string }
    flood_timeline?: Array<{ date: string; event: string; severity: string }>
    affected_areas?: Array<{
      province: string
      water_level_cm: number
      flood_area_km2: number
      districts: Array<{ name: string; impact_level: string; water_level_cm: number }>
    }>
    overall_risk?: { level: string; score: number }
    recommendations?: string[]
    summary?: string
  }
  reservoir_status: {
    total: number
    reservoirs: Array<{
      name: string
      basin: string
      water_level_percent: number
      discharge_m3s: number
      status: string
    }>
  }
}

const CategoryIcon = ({ category, className = "w-4 h-4" }: { category: string; className?: string }) => {
  const icons: Record<string, React.ReactNode> = {
    'Lũ lụt': <Waves className={className} />,
    'Mưa lớn': <CloudRain className={className} />,
    'Nắng nóng': <Sun className={className} />,
    'Nắng nóng gay gắt': <Sun className={className} />,
    'Nắng nóng đặc biệt gay gắt': <Sun className={className} />,
    'Nắng nóng cục bộ': <Sun className={className} />,
    'Hạn hán': <Thermometer className={className} />,
    'Xâm nhập mặn': <Droplets className={className} />,
    'Xả lũ': <Cylinder className={className} />,
    'Xả lũ hồ chứa': <Cylinder className={className} />,
    'Gió mạnh': <Wind className={className} />,
    'Tia UV cao': <Radiation className={className} />,
    'Rét đậm': <Thermometer className={className} />,
    'Rét hại': <Thermometer className={className} />,
    'Rét': <Thermometer className={className} />,
    'Phân tích AI': <Brain className={className} />,
  }
  return <>{icons[category] || <AlertTriangle className={className} />}</>
}

const SEVERITY_STYLES: Record<string, { border: string; bg: string; text: string; dot: string }> = {
  critical: { border: 'border-l-red-600', bg: 'bg-red-50', text: 'text-red-700', dot: 'bg-red-500' },
  high: { border: 'border-l-orange-500', bg: 'bg-orange-50', text: 'text-orange-700', dot: 'bg-orange-500' },
  medium: { border: 'border-l-amber-500', bg: 'bg-amber-50', text: 'text-amber-700', dot: 'bg-amber-500' },
  low: { border: 'border-l-blue-500', bg: 'bg-blue-50', text: 'text-blue-700', dot: 'bg-blue-500' },
}

const SEVERITY_LABELS: Record<string, string> = {
  critical: 'Nguy hiểm',
  high: 'Cao',
  medium: 'Trung bình',
  low: 'Thấp',
}

const BASIN_NAMES: Record<string, string> = {
  HONG: 'Sông Hồng',
  CENTRAL: 'Miền Trung',
  MEKONG: 'Sông Mekong',
  DONGNAI: 'Sông Đồng Nai',
}

const convertAnalysisToAlert = (data: ReservoirAnalysis): AlertData | null => {
  const { basin, analysis, reservoir_status } = data
  if (!analysis || !analysis.summary) return null

  const overallRisk = analysis.overall_risk
  const summary = analysis.summary?.toLowerCase() || ''
  const affectedAreas = analysis.affected_areas || []
  const peakRain = analysis.peak_rain

  let severity: 'critical' | 'high' | 'medium' | 'low' = 'medium'

  if (summary.includes('báo động đỏ') || summary.includes('nguy hiểm') || summary.includes('khẩn cấp')) {
    severity = 'critical'
  } else if (summary.includes('cảnh báo') || summary.includes('nguy cơ cao') || summary.includes('mưa lớn')) {
    severity = 'high'
  } else if (summary.includes('theo dõi') || summary.includes('chú ý') || summary.includes('trung bình')) {
    severity = 'medium'
  } else {
    severity = 'low'
  }

  if (overallRisk) {
    const riskLevel = overallRisk.level?.toLowerCase() || ''
    if (riskLevel.includes('critical') || riskLevel.includes('nguy hiểm') || (overallRisk.score && overallRisk.score >= 80)) {
      severity = 'critical'
    } else if (riskLevel.includes('high') || riskLevel.includes('cao') || (overallRisk.score && overallRisk.score >= 60)) {
      severity = 'high'
    } else if (riskLevel.includes('medium') || riskLevel.includes('trung bình') || (overallRisk.score && overallRisk.score >= 40)) {
      severity = 'medium'
    }
  }

  if (severity === 'low') return null

  const dischargingReservoirs = reservoir_status?.reservoirs?.filter(r => r.discharge_m3s > 0) || []
  const highWaterReservoirs = reservoir_status?.reservoirs?.filter(r => r.water_level_percent >= 90) || []
  const provinces = affectedAreas.map(a => a.province)
  const today = new Date().toLocaleDateString('vi-VN')

  return {
    id: `reservoir-analysis-${basin}-${Date.now()}`,
    type: 'reservoir_analysis',
    category: 'Phân tích AI',
    title: `Cảnh báo thủy điện lưu vực ${BASIN_NAMES[basin] || basin}`,
    severity,
    date: today,
    region: BASIN_NAMES[basin] || basin,
    provinces: provinces.length > 0 ? provinces : [BASIN_NAMES[basin] || basin],
    description: analysis.summary || `Phân tích rủi ro tổng hợp cho lưu vực ${BASIN_NAMES[basin]}`,
    data: {
      max_rainfall_mm: peakRain?.max_mm || 0,
      total_reservoirs: reservoir_status?.total || 0,
      discharging_count: dischargingReservoirs.length,
      high_water_count: highWaterReservoirs.length,
      affected_provinces: affectedAreas.length,
    },
    recommendations: analysis.recommendations || [],
    flood_zones: affectedAreas.length > 0 ? affectedAreas.map(area => ({
      province: area.province,
      districts: area.districts?.map(d => d.name) || [],
      risk: area.water_level_cm > 60 ? 'Rất cao' : area.water_level_cm > 30 ? 'Cao' : 'Trung bình'
    })) : dischargingReservoirs.length > 0 ? [{
      province: BASIN_NAMES[basin] || basin,
      districts: dischargingReservoirs.map(r => `${r.name} (xả ${r.discharge_m3s} m³/s)`),
      risk: severity === 'critical' ? 'Rất cao' : severity === 'high' ? 'Cao' : 'Trung bình'
    }] : undefined,
  }
}

export default function AlertsList() {
  const [alerts, setAlerts] = useState<AlertData[]>([])
  const [loading, setLoading] = useState(true)
  const [loadingProgress, setLoadingProgress] = useState(0)
  const [selectedAlert, setSelectedAlert] = useState<AlertData | null>(null)
  const [filter, setFilter] = useState<string>('all')
  const [summary, setSummary] = useState({ critical: 0, high: 0, medium: 0, low: 0 })
  const [categories, setCategories] = useState<Record<string, number>>({})
  const pollingRef = useRef<NodeJS.Timeout | null>(null)

  useEffect(() => {
    fetchAlerts()
    const interval = setInterval(fetchAlerts, 120000)
    return () => {
      clearInterval(interval)
      if (pollingRef.current) clearTimeout(pollingRef.current)
    }
  }, [])

  // Poll for job status
  const pollJobStatus = async (jobId: string) => {
    const maxAttempts = 60  // Max 2 minutes
    let attempts = 0

    const poll = async () => {
      try {
        const status = await alertsApi.getJobStatus(jobId)
        console.log(`[Alerts Poll] Job ${jobId}: ${status.status} (${status.progress}%)`)
        setLoadingProgress(status.progress || 0)

        if (status.status === 'completed' && status.result) {
          processAlertsData(status.result)
          setLoading(false)
          return
        }

        if (status.status === 'failed') {
          console.error('Alerts job failed:', status.error)
          setLoading(false)
          return
        }

        attempts++
        if (attempts < maxAttempts) {
          pollingRef.current = setTimeout(poll, 2000)
        } else {
          console.warn('Polling timeout')
          setLoading(false)
        }
      } catch (error) {
        console.error('Polling error:', error)
        setLoading(false)
      }
    }

    poll()
  }

  const processAlertsData = (weatherData: AlertsResponse) => {
    let allAlerts: AlertData[] = weatherData.alerts || []
    let totalSummary = weatherData.summary || { critical: 0, high: 0, medium: 0, low: 0 }
    let allCategories: Record<string, number> = weatherData.by_category || {}

    const severityOrder: Record<string, number> = { critical: 0, high: 1, medium: 2, low: 3 }
    allAlerts.sort((a, b) => severityOrder[a.severity] - severityOrder[b.severity])

    setAlerts(allAlerts)
    setSummary(totalSummary)
    setCategories(allCategories)
  }

  const fetchAlerts = async () => {
    try {
      setLoadingProgress(0)

      // Use async mode to avoid blocking
      const data = await alertsApi.getAlertsAsync()

      // Check if processing in background
      if (data.status === 'processing' && data.job_id) {
        console.log('[Alerts] Background processing, polling job:', data.job_id)
        setLoading(true)
        pollJobStatus(data.job_id)
        return
      }

      // Data returned immediately (from cache)
      processAlertsData(data)
      setLoading(false)

    } catch (error) {
      console.error('Error fetching alerts:', error)
      setLoading(false)
    }
  }

  const filteredAlerts = filter === 'all' ? alerts : alerts.filter(a => a.category === filter)

  if (loading) {
    return (
      <div className="bg-white rounded-lg shadow-lg max-h-[85vh] overflow-hidden">
        <div className="p-4 border-b">
          <h2 className="text-lg font-semibold text-gray-900">Cảnh báo thiên tai</h2>
          <p className="text-sm text-gray-500 mt-1">Đang tải dữ liệu...</p>
        </div>
        <div className="p-4">
          {/* Progress bar */}
          <div className="mb-4">
            <div className="flex items-center justify-between text-sm text-gray-600 mb-2">
              <span className="flex items-center gap-2">
                <Loader2 className="w-4 h-4 animate-spin" />
                Đang tải cảnh báo...
              </span>
              <span>{loadingProgress}%</span>
            </div>
            <div className="w-full h-2 bg-gray-200 rounded-full overflow-hidden">
              <div
                className="h-full bg-blue-500 transition-all duration-300"
                style={{ width: `${loadingProgress}%` }}
              />
            </div>
          </div>
          <div className="space-y-3">
            {[1, 2, 3].map(i => (
              <div key={i} className="h-20 bg-gray-100 rounded animate-pulse"></div>
            ))}
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="bg-white rounded-lg shadow-lg max-h-[85vh] flex flex-col overflow-hidden">
      {/* Header */}
      <div className="p-4 border-b bg-gray-50">
        <div className="flex items-center justify-between mb-3">
          <div>
            <h2 className="text-lg font-semibold text-gray-900">Cảnh báo thiên tai</h2>
            <p className="text-sm text-gray-500">{alerts.length} cảnh báo đang hoạt động</p>
          </div>

          {/* Summary counts */}
          <div className="flex items-center gap-3 text-sm">
            {summary.critical > 0 && (
              <div className="flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded-full bg-red-500 animate-pulse"></span>
                <span className="font-medium text-red-700">{summary.critical}</span>
              </div>
            )}
            {summary.high > 0 && (
              <div className="flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded-full bg-orange-500"></span>
                <span className="font-medium text-orange-700">{summary.high}</span>
              </div>
            )}
            {summary.medium > 0 && (
              <div className="flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded-full bg-amber-500"></span>
                <span className="font-medium text-amber-700">{summary.medium}</span>
              </div>
            )}
          </div>
        </div>

        {/* Filter tabs */}
        <div className="flex gap-1.5 overflow-x-auto text-sm">
          <button
            onClick={() => setFilter('all')}
            className={`px-3 py-1.5 rounded-md whitespace-nowrap transition-colors ${
              filter === 'all' ? 'bg-gray-900 text-white' : 'bg-white text-gray-600 hover:bg-gray-100 border'
            }`}
          >
            Tất cả ({alerts.length})
          </button>
          {Object.entries(categories).map(([cat, count]) => (
            <button
              key={cat}
              onClick={() => setFilter(cat)}
              className={`px-3 py-1.5 rounded-md whitespace-nowrap transition-colors flex items-center gap-1.5 ${
                filter === cat ? 'bg-gray-900 text-white' : 'bg-white text-gray-600 hover:bg-gray-100 border'
              }`}
            >
              <CategoryIcon category={cat} className="w-3.5 h-3.5" />
              {cat} ({count})
            </button>
          ))}
        </div>
      </div>

      {/* Alert List */}
      <div className="flex-1 overflow-y-auto">
        {filteredAlerts.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-12 text-gray-400">
            <CheckCircle className="w-10 h-10 text-green-500 mb-2" />
            <p className="font-medium text-gray-600">An toàn</p>
            <p className="text-sm">Không có cảnh báo nào hiện tại</p>
          </div>
        ) : (
          <div className="divide-y">
            {filteredAlerts.map((alert) => {
              const style = SEVERITY_STYLES[alert.severity] || SEVERITY_STYLES.low
              return (
                <div
                  key={alert.id}
                  onClick={() => setSelectedAlert(alert)}
                  className={`p-4 border-l-4 ${style.border} hover:bg-gray-50 cursor-pointer transition-colors`}
                >
                  {/* Top row: severity + category + time */}
                  <div className="flex items-center gap-2 mb-2">
                    <span className={`inline-flex items-center gap-1 px-2 py-0.5 text-xs font-medium rounded ${style.bg} ${style.text}`}>
                      <span className={`w-1.5 h-1.5 rounded-full ${style.dot}`}></span>
                      {SEVERITY_LABELS[alert.severity]}
                    </span>
                    <span className="inline-flex items-center gap-1 px-2 py-0.5 text-xs bg-gray-100 text-gray-600 rounded">
                      <CategoryIcon category={alert.category} className="w-3 h-3" />
                      {alert.category}
                    </span>
                    <span className="text-xs text-gray-400 ml-auto flex items-center gap-1">
                      <Clock className="w-3 h-3" />
                      {alert.date}
                    </span>
                  </div>

                  {/* Title */}
                  <h3 className="font-medium text-gray-900 text-sm mb-1">{alert.title}</h3>

                  {/* Description */}
                  <p className="text-xs text-gray-500 line-clamp-2 mb-2">{alert.description}</p>

                  {/* Bottom row: location + key data */}
                  <div className="flex items-center justify-between text-xs">
                    <span className="flex items-center gap-1 text-gray-500">
                      <MapPin className="w-3 h-3" />
                      {alert.region}
                      {alert.provinces.length > 1 && ` (+${alert.provinces.length - 1} tỉnh)`}
                    </span>

                    {/* Quick data preview */}
                    <div className="flex items-center gap-3 text-gray-600">
                      {alert.data.max_rainfall_mm > 0 && (
                        <span className="flex items-center gap-1">
                          <CloudRain className="w-3 h-3 text-blue-500" />
                          {alert.data.max_rainfall_mm}mm
                        </span>
                      )}
                      {alert.data.rainfall_mm > 0 && !alert.data.max_rainfall_mm && (
                        <span className="flex items-center gap-1">
                          <CloudRain className="w-3 h-3 text-blue-500" />
                          {alert.data.rainfall_mm}mm
                        </span>
                      )}
                      {alert.data.discharging_count > 0 && (
                        <span className="flex items-center gap-1">
                          <Waves className="w-3 h-3 text-cyan-500" />
                          {alert.data.discharging_count} hồ xả
                        </span>
                      )}
                      {alert.data.total_discharge_m3s > 0 && (
                        <span className="flex items-center gap-1">
                          <Cylinder className="w-3 h-3 text-purple-500" />
                          {alert.data.total_discharge_m3s.toLocaleString()} m³/s
                        </span>
                      )}
                      {alert.data.max_temperature_c > 0 && (
                        <span className="flex items-center gap-1">
                          <Sun className="w-3 h-3 text-orange-500" />
                          {alert.data.max_temperature_c}°C
                        </span>
                      )}
                      {alert.data.min_temperature_c !== undefined && alert.data.min_temperature_c <= 15 && (
                        <span className="flex items-center gap-1">
                          <Thermometer className="w-3 h-3 text-blue-600" />
                          {alert.data.min_temperature_c}°C
                        </span>
                      )}
                      {alert.data.wind_speed_kmh > 0 && (
                        <span className="flex items-center gap-1">
                          <Wind className="w-3 h-3 text-cyan-600" />
                          {alert.data.wind_speed_kmh}km/h
                        </span>
                      )}
                      <ChevronRight className="w-4 h-4 text-gray-400" />
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </div>

      {/* Detail Modal */}
      {selectedAlert && (
        <div className="fixed inset-0 bg-black/50 z-[3000] flex items-center justify-center p-4">
          <div className="bg-white rounded-lg w-full max-w-lg max-h-[90vh] overflow-hidden shadow-xl">
            {/* Modal Header */}
            <div className={`p-4 border-b border-l-4 ${SEVERITY_STYLES[selectedAlert.severity]?.border}`}>
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-2">
                    <span className={`inline-flex items-center gap-1 px-2 py-0.5 text-xs font-medium rounded ${SEVERITY_STYLES[selectedAlert.severity]?.bg} ${SEVERITY_STYLES[selectedAlert.severity]?.text}`}>
                      {SEVERITY_LABELS[selectedAlert.severity]}
                    </span>
                    <span className="inline-flex items-center gap-1 px-2 py-0.5 text-xs bg-gray-100 text-gray-600 rounded">
                      <CategoryIcon category={selectedAlert.category} className="w-3 h-3" />
                      {selectedAlert.category}
                    </span>
                  </div>
                  <h3 className="font-semibold text-gray-900">{selectedAlert.title}</h3>
                  <p className="text-sm text-gray-500 mt-1 flex items-center gap-3">
                    <span className="flex items-center gap-1">
                      <MapPin className="w-3.5 h-3.5" />
                      {selectedAlert.region}
                    </span>
                    <span className="flex items-center gap-1">
                      <Clock className="w-3.5 h-3.5" />
                      {selectedAlert.date}
                    </span>
                  </p>
                </div>
                <button onClick={() => setSelectedAlert(null)} className="p-1 hover:bg-gray-100 rounded">
                  <X className="w-5 h-5 text-gray-500" />
                </button>
              </div>
            </div>

            {/* Modal Content */}
            <div className="p-4 overflow-y-auto max-h-[calc(90vh-120px)] space-y-4">
              {/* Description */}
              <div>
                <h4 className="text-xs font-semibold text-gray-500 uppercase mb-2 flex items-center gap-1">
                  <Info className="w-3.5 h-3.5" />
                  Mô tả
                </h4>
                <p className="text-sm text-gray-700 leading-relaxed bg-gray-50 rounded p-3">
                  {selectedAlert.description}
                </p>
              </div>

              {/* Provinces */}
              {selectedAlert.provinces && selectedAlert.provinces.length > 0 && (
                <div>
                  <h4 className="text-xs font-semibold text-gray-500 uppercase mb-2 flex items-center gap-1">
                    <MapPin className="w-3.5 h-3.5" />
                    Khu vực ảnh hưởng ({selectedAlert.provinces.length} tỉnh/thành)
                  </h4>
                  <div className="flex flex-wrap gap-1.5">
                    {selectedAlert.provinces.map((province, idx) => (
                      <span key={idx} className="px-2 py-1 bg-gray-100 text-gray-700 text-xs rounded">
                        {province}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {/* Data metrics - Enhanced */}
              {selectedAlert.data && Object.keys(selectedAlert.data).length > 0 && (
                <div>
                  <h4 className="text-xs font-semibold text-gray-500 uppercase mb-2">Thông số chi tiết</h4>

                  {/* Primary metrics - large cards */}
                  <div className="grid grid-cols-2 gap-3 mb-3">
                    {selectedAlert.data.rainfall_mm !== undefined && (
                      <div className="bg-gradient-to-br from-blue-50 to-blue-100 p-3 rounded-lg border border-blue-200">
                        <div className="flex items-center gap-2 mb-1">
                          <CloudRain className="w-4 h-4 text-blue-600" />
                          <p className="text-xs text-blue-600 font-medium">Lượng mưa</p>
                        </div>
                        <p className="text-2xl font-bold text-blue-700">{selectedAlert.data.rainfall_mm} <span className="text-sm font-normal">mm</span></p>
                        <p className="text-xs text-blue-500 mt-1">
                          {selectedAlert.data.rainfall_mm >= 100 ? 'Mưa rất to' :
                           selectedAlert.data.rainfall_mm >= 50 ? 'Mưa to' :
                           selectedAlert.data.rainfall_mm >= 25 ? 'Mưa vừa' : 'Mưa nhỏ'}
                        </p>
                      </div>
                    )}
                    {selectedAlert.data.max_rainfall_mm !== undefined && (
                      <div className="bg-gradient-to-br from-blue-50 to-blue-100 p-3 rounded-lg border border-blue-200">
                        <div className="flex items-center gap-2 mb-1">
                          <CloudRain className="w-4 h-4 text-blue-600" />
                          <p className="text-xs text-blue-600 font-medium">Lượng mưa tối đa</p>
                        </div>
                        <p className="text-2xl font-bold text-blue-700">{selectedAlert.data.max_rainfall_mm} <span className="text-sm font-normal">mm</span></p>
                        <p className="text-xs text-blue-500 mt-1">
                          {selectedAlert.data.max_rainfall_mm >= 100 ? 'Mưa rất to' :
                           selectedAlert.data.max_rainfall_mm >= 50 ? 'Mưa to' :
                           selectedAlert.data.max_rainfall_mm >= 25 ? 'Mưa vừa' : 'Mưa nhỏ'}
                        </p>
                      </div>
                    )}
                    {selectedAlert.data.wind_speed_kmh !== undefined && (
                      <div className="bg-gradient-to-br from-cyan-50 to-cyan-100 p-3 rounded-lg border border-cyan-200">
                        <div className="flex items-center gap-2 mb-1">
                          <Wind className="w-4 h-4 text-cyan-600" />
                          <p className="text-xs text-cyan-600 font-medium">Tốc độ gió</p>
                        </div>
                        <p className="text-2xl font-bold text-cyan-700">{selectedAlert.data.wind_speed_kmh} <span className="text-sm font-normal">km/h</span></p>
                        <p className="text-xs text-cyan-500 mt-1">
                          {selectedAlert.data.wind_speed_kmh >= 90 ? 'Gió bão' :
                           selectedAlert.data.wind_speed_kmh >= 62 ? 'Gió mạnh' :
                           selectedAlert.data.wind_speed_kmh >= 40 ? 'Gió vừa' : 'Gió nhẹ'}
                        </p>
                      </div>
                    )}
                    {selectedAlert.data.max_temperature_c !== undefined && (
                      <div className="bg-gradient-to-br from-orange-50 to-orange-100 p-3 rounded-lg border border-orange-200">
                        <div className="flex items-center gap-2 mb-1">
                          <Thermometer className="w-4 h-4 text-orange-600" />
                          <p className="text-xs text-orange-600 font-medium">Nhiệt độ cao nhất</p>
                        </div>
                        <p className="text-2xl font-bold text-orange-700">{selectedAlert.data.max_temperature_c}<span className="text-sm font-normal">°C</span></p>
                        <p className="text-xs text-orange-500 mt-1">
                          {selectedAlert.data.max_temperature_c >= 39 ? 'Nắng nóng gay gắt' :
                           selectedAlert.data.max_temperature_c >= 37 ? 'Nắng nóng' : 'Bình thường'}
                        </p>
                      </div>
                    )}
                    {selectedAlert.data.discharge_m3s !== undefined && (
                      <div className="bg-gradient-to-br from-purple-50 to-purple-100 p-3 rounded-lg border border-purple-200">
                        <div className="flex items-center gap-2 mb-1">
                          <Waves className="w-4 h-4 text-purple-600" />
                          <p className="text-xs text-purple-600 font-medium">Lưu lượng xả</p>
                        </div>
                        <p className="text-2xl font-bold text-purple-700">{selectedAlert.data.discharge_m3s.toLocaleString()} <span className="text-sm font-normal">m³/s</span></p>
                        <p className="text-xs text-purple-500 mt-1">
                          {selectedAlert.data.discharge_m3s >= 2000 ? 'Xả rất lớn' :
                           selectedAlert.data.discharge_m3s >= 1000 ? 'Xả lớn' : 'Xả trung bình'}
                        </p>
                      </div>
                    )}
                    {selectedAlert.data.total_discharge_m3s !== undefined && (
                      <div className="bg-gradient-to-br from-purple-50 to-purple-100 p-3 rounded-lg border border-purple-200">
                        <div className="flex items-center gap-2 mb-1">
                          <Waves className="w-4 h-4 text-purple-600" />
                          <p className="text-xs text-purple-600 font-medium">Tổng lưu lượng xả</p>
                        </div>
                        <p className="text-2xl font-bold text-purple-700">{selectedAlert.data.total_discharge_m3s?.toLocaleString()} <span className="text-sm font-normal">m³/s</span></p>
                        <p className="text-xs text-purple-500 mt-1">
                          {selectedAlert.data.total_discharge_m3s >= 2000 ? 'Xả rất lớn' :
                           selectedAlert.data.total_discharge_m3s >= 1000 ? 'Xả lớn' : 'Xả trung bình'}
                        </p>
                      </div>
                    )}
                    {selectedAlert.data.min_temperature_c !== undefined && (
                      <div className="bg-gradient-to-br from-blue-50 to-indigo-100 p-3 rounded-lg border border-blue-200">
                        <div className="flex items-center gap-2 mb-1">
                          <Thermometer className="w-4 h-4 text-blue-600" />
                          <p className="text-xs text-blue-600 font-medium">Nhiệt độ thấp nhất</p>
                        </div>
                        <p className="text-2xl font-bold text-blue-700">{selectedAlert.data.min_temperature_c}<span className="text-sm font-normal">°C</span></p>
                        <p className="text-xs text-blue-500 mt-1">
                          {selectedAlert.data.min_temperature_c <= 5 ? 'Rét hại nghiêm trọng' :
                           selectedAlert.data.min_temperature_c <= 10 ? 'Rét hại' :
                           selectedAlert.data.min_temperature_c <= 13 ? 'Rét đậm' : 'Trời rét'}
                        </p>
                      </div>
                    )}
                    {selectedAlert.data.evapotranspiration_mm !== undefined && (
                      <div className="bg-gradient-to-br from-amber-50 to-amber-100 p-3 rounded-lg border border-amber-200">
                        <div className="flex items-center gap-2 mb-1">
                          <Sun className="w-4 h-4 text-amber-600" />
                          <p className="text-xs text-amber-600 font-medium">Lượng bốc hơi</p>
                        </div>
                        <p className="text-2xl font-bold text-amber-700">{selectedAlert.data.evapotranspiration_mm} <span className="text-sm font-normal">mm/ngày</span></p>
                        <p className="text-xs text-amber-500 mt-1">
                          {selectedAlert.data.evapotranspiration_mm >= 7 ? 'Bốc hơi rất cao' : 'Bốc hơi cao'}
                        </p>
                      </div>
                    )}
                    {selectedAlert.data.apparent_temperature_c !== undefined && (
                      <div className="bg-gradient-to-br from-red-50 to-orange-100 p-3 rounded-lg border border-orange-200">
                        <div className="flex items-center gap-2 mb-1">
                          <Thermometer className="w-4 h-4 text-red-600" />
                          <p className="text-xs text-red-600 font-medium">Nhiệt độ cảm nhận</p>
                        </div>
                        <p className="text-2xl font-bold text-red-700">{selectedAlert.data.apparent_temperature_c}<span className="text-sm font-normal">°C</span></p>
                        <p className="text-xs text-red-500 mt-1">
                          {selectedAlert.data.apparent_temperature_c >= 42 ? 'Nguy hiểm, say nắng' :
                           selectedAlert.data.apparent_temperature_c >= 38 ? 'Rất nóng, mệt mỏi' : 'Nóng bức'}
                        </p>
                      </div>
                    )}
                    {selectedAlert.data.uv_index !== undefined && (
                      <div className="bg-gradient-to-br from-violet-50 to-purple-100 p-3 rounded-lg border border-violet-200">
                        <div className="flex items-center gap-2 mb-1">
                          <Radiation className="w-4 h-4 text-violet-600" />
                          <p className="text-xs text-violet-600 font-medium">Chỉ số UV</p>
                        </div>
                        <p className="text-2xl font-bold text-violet-700">{selectedAlert.data.uv_index}</p>
                        <p className="text-xs text-violet-500 mt-1">
                          {selectedAlert.data.uv_index >= 11 ? 'Cực kỳ cao' :
                           selectedAlert.data.uv_index >= 8 ? 'Rất cao' :
                           selectedAlert.data.uv_index >= 6 ? 'Cao' : 'Trung bình'}
                        </p>
                      </div>
                    )}
                  </div>

                  {/* Secondary metrics - smaller grid */}
                  <div className="grid grid-cols-3 gap-2">
                    {Object.entries(selectedAlert.data)
                      .filter(([key]) => !['rainfall_mm', 'max_rainfall_mm', 'wind_speed_kmh', 'max_temperature_c', 'discharge_m3s', 'total_discharge_m3s', 'min_temperature_c', 'evapotranspiration_mm', 'apparent_temperature_c', 'uv_index'].includes(key))
                      .map(([key, value]) => (
                      <div key={key} className="bg-gray-50 p-2.5 rounded border border-gray-100">
                        <p className="text-xs text-gray-500 truncate">{formatDataKey(key)}</p>
                        <p className="text-sm font-semibold text-gray-900">{formatDataValue(key, value)}</p>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Flood zones */}
              {selectedAlert.flood_zones && selectedAlert.flood_zones.length > 0 && (
                <div>
                  <h4 className="text-xs font-semibold text-gray-500 uppercase mb-2 flex items-center gap-1">
                    <Waves className="w-3.5 h-3.5" />
                    Vùng ngập lụt ({selectedAlert.flood_zones.length})
                  </h4>
                  <div className="space-y-2">
                    {selectedAlert.flood_zones.map((zone, idx) => (
                      <div key={idx} className="bg-gray-50 p-3 rounded">
                        <div className="flex items-center justify-between mb-1.5">
                          <span className="text-sm font-medium text-gray-900">{zone.province}</span>
                          <span className={`text-xs px-2 py-0.5 rounded font-medium ${
                            zone.risk === 'Rất cao' ? 'bg-red-100 text-red-700' :
                            zone.risk === 'Cao' ? 'bg-orange-100 text-orange-700' :
                            'bg-amber-100 text-amber-700'
                          }`}>
                            {zone.risk}
                          </span>
                        </div>
                        <p className="text-xs text-gray-600">{zone.districts.join(', ')}</p>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Recommendations */}
              {selectedAlert.recommendations && selectedAlert.recommendations.length > 0 && (
                <div>
                  <h4 className="text-xs font-semibold text-gray-500 uppercase mb-2 flex items-center gap-1">
                    <CheckCircle className="w-3.5 h-3.5" />
                    Khuyến cáo ({selectedAlert.recommendations.length})
                  </h4>
                  <ul className="space-y-1.5">
                    {selectedAlert.recommendations.map((rec, idx) => (
                      <li key={idx} className="flex items-start gap-2 text-sm text-gray-700 bg-green-50 rounded p-2">
                        <CheckCircle className="w-4 h-4 text-green-600 mt-0.5 flex-shrink-0" />
                        <span>{rec}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

function formatDataKey(key: string): string {
  const labels: Record<string, string> = {
    // Mưa
    rainfall_daily_mm: 'Lượng mưa/ngày',
    rainfall_accumulated_mm: 'Tích lũy 3 ngày',
    rainfall_mm: 'Lượng mưa',
    rain_intensity: 'Cường độ mưa',
    precipitation_hours: 'Số giờ mưa',
    precipitation_probability: 'Xác suất mưa',
    flood_risk_percent: 'Nguy cơ ngập',
    humidity_note: 'Độ ẩm',

    // Nhiệt độ
    max_temperature_c: 'Nhiệt độ cao nhất',
    min_temperature_c: 'Nhiệt độ thấp nhất',
    temp_max_c: 'Nhiệt độ cao nhất',
    temp_min_c: 'Nhiệt độ thấp nhất',
    apparent_temperature_c: 'Nhiệt độ cảm nhận',
    heat_level: 'Mức nắng nóng',
    dehydration_risk: 'Nguy cơ mất nước',
    sunshine_hours: 'Số giờ nắng',

    // Gió
    wind_speed_kmh: 'Tốc độ gió',
    wind_gust_kmh: 'Gió giật',
    wind_level: 'Cấp gió',
    beaufort_scale: 'Thang Beaufort',
    wind_direction_deg: 'Hướng gió (độ)',
    wind_direction_text: 'Hướng gió',
    danger_level: 'Mức nguy hiểm',

    // UV
    uv_index: 'Chỉ số UV',
    uv_level: 'Mức UV',

    // Thời tiết chung
    weather_code: 'Mã thời tiết',
    weather_description: 'Mô tả thời tiết',
    probability: 'Xác suất',
    risk_level: 'Mức rủi ro',

    // Nước/Lũ
    humidity_percent: 'Độ ẩm',
    days_without_rain: 'Số ngày không mưa',
    water_level_percent: 'Mực nước',
    salinity_intrusion_km: 'Xâm nhập mặn',
    salinity_level_ppt: 'Độ mặn',
    affected_area_ha: 'Diện tích ảnh hưởng',
    river_discharge_m3s: 'Lưu lượng sông',

    // Hồ chứa/Đập
    dam_name: 'Tên đập',
    river: 'Sông',
    discharge_m3s: 'Lưu lượng xả',
    discharge_percent: 'Công suất xả',
    water_level_m: 'Mực nước hồ',
    spillway_gates_open: 'Cửa xả mở',
    total_gates: 'Tổng số cửa',
    warning_time_hours: 'Thời gian cảnh báo',
    estimated_time: 'Thời gian dự kiến',
    combined_risk_score: 'Điểm rủi ro tổng hợp',
    weather_risk_level: 'Rủi ro thời tiết',
    max_rainfall_mm: 'Lượng mưa tối đa',
    flood_probability: 'Xác suất ngập',
    reservoir_risk_level: 'Rủi ro hồ chứa',
    total_reservoirs: 'Tổng số hồ chứa',
    discharging_count: 'Hồ đang xả',
    critical_count: 'Hồ nguy hiểm',
    high_water_count: 'Hồ mực nước cao',
    affected_provinces: 'Tỉnh bị ảnh hưởng',

    // EVN Reservoir discharge alerts
    reservoir_name: 'Tên hồ chứa',
    basin: 'Lưu vực',
    normal_level_m: 'Mực nước dâng BT',
    dead_level_m: 'Mực nước chết',
    water_percent: 'Tỷ lệ mực nước',
    inflow_m3s: 'Lưu lượng đến',
    total_discharge_m3s: 'Tổng lưu lượng xả',
    turbine_discharge_m3s: 'Xả qua turbine',
    spillway_discharge_m3s: 'Xả qua tràn',
    spillway_gates_deep: 'Số cửa xả sâu',
    spillway_gates_surface: 'Số cửa xả mặt',
    alert_reason: 'Lý do cảnh báo',

    // Cold wave / Drought alerts
    apparent_min_temperature_c: 'Nhiệt độ cảm nhận thấp nhất',
    cold_level: 'Mức độ rét',
    evapotranspiration_mm: 'Lượng bốc hơi',
    drought_level: 'Mức hạn hán',
    humidity_status: 'Tình trạng ẩm',

    // Heat wave alerts
    apparent_temperature_c: 'Nhiệt độ cảm nhận',
    uv_index: 'Chỉ số UV',
    heat_type: 'Loại nắng nóng',
    heat_category: 'Phân loại',
  }
  return labels[key] || key.replace(/_/g, ' ')
}

function formatDataValue(key: string, value: any): string {
  if (value === null || value === undefined) return '-'

  if (key.includes('_mm') || key === 'rainfall_mm') return `${value} mm`
  if (key.includes('_c') || key === 'max_temperature_c') return `${value}°C`
  if (key.includes('_percent') || key === 'probability') return `${value}%`
  if (key.includes('_km')) return `${value} km`
  if (key.includes('_ppt')) return `${value}‰`
  if (key.includes('_ha')) return `${value.toLocaleString()} ha`
  if (key.includes('_m3s')) return `${value.toLocaleString()} m³/s`
  if (key.includes('_m') && !key.includes('_m3')) return `${value} m`
  if (key.includes('_hours')) return `${value} giờ`

  return String(value)
}
