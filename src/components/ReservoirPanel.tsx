'use client'

import { useState, useEffect } from 'react'
import {
  Waves, Droplets, AlertTriangle, RefreshCw,
  ChevronDown, ChevronUp
} from 'lucide-react'

interface ReservoirData {
  name: string
  htl: number | null      // Mực nước hiện tại (m)
  hdbt: number | null     // Mực nước dâng bình thường (m)
  hc: number | null       // Mực nước chết (m)
  qve: number | null      // Lưu lượng đến (m³/s)
  totalQx: number | null  // Tổng xả (m³/s)
  qxt: number | null      // Xả turbine (m³/s)
  qxm: number | null      // Xả mặt (m³/s)
  ncxs: number | null     // Số cửa xả sâu
  ncxm: number | null     // Số cửa xả mặt
  basin?: string          // Lưu vực
  water_percent?: number | null  // % mực nước
}

interface ReservoirResponse {
  data: ReservoirData[]
  cached: boolean
  count: number
  scrapedAt?: string
  cachedAt?: string
}

const BASIN_NAMES: Record<string, string> = {
  HONG: 'Sông Hồng',
  CENTRAL: 'Miền Trung',
  MEKONG: 'Sông Mekong',
  DONGNAI: 'Đồng Nai',
  UNKNOWN: 'Khác'
}

const BASIN_COLORS: Record<string, string> = {
  HONG: 'bg-red-500',
  CENTRAL: 'bg-orange-500',
  MEKONG: 'bg-blue-500',
  DONGNAI: 'bg-green-500',
  UNKNOWN: 'bg-gray-500'
}

export default function ReservoirPanel() {
  const [reservoirs, setReservoirs] = useState<ReservoirData[]>([])
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)
  const [selectedBasin, setSelectedBasin] = useState<string>('all')
  const [expandedReservoir, setExpandedReservoir] = useState<string | null>(null)
  const [lastUpdated, setLastUpdated] = useState<string | null>(null)
  const [basinLoading, setBasinLoading] = useState(false)
  const [loadingProgress, setLoadingProgress] = useState(0)

  useEffect(() => {
    fetchReservoirs()
    const interval = setInterval(fetchReservoirs, 5 * 60 * 1000) // Refresh every 5 mins
    return () => clearInterval(interval)
  }, [])

  const fetchReservoirs = async (forceRefresh = false) => {
    try {
      if (forceRefresh) setRefreshing(true)

      const method = forceRefresh ? 'POST' : 'GET'
      const res = await fetch('/api/reservoir', { method })

      if (res.ok) {
        const data: ReservoirResponse = await res.json()

        // Add basin info and water percent if not present
        const enrichedData = data.data.map(r => ({
          ...r,
          basin: r.basin || getBasinForReservoir(r.name),
          water_percent: r.water_percent || (r.htl && r.hdbt ? Math.round((r.htl / r.hdbt) * 100) : null)
        }))

        setReservoirs(enrichedData)
        setLastUpdated(data.scrapedAt || data.cachedAt || new Date().toISOString())
      }
    } catch (error) {
      console.error('Error fetching reservoirs:', error)
    } finally {
      setLoading(false)
      setRefreshing(false)
    }
  }

  // Mapping tên hồ -> lưu vực (simplified)
  const getBasinForReservoir = (name: string): string => {
    const mapping: Record<string, string> = {
      'Tuyên Quang': 'HONG', 'Lai Châu': 'HONG', 'Sơn La': 'HONG', 'Hòa Bình': 'HONG',
      'Thác Bà': 'HONG', 'Bản Chát': 'HONG', 'Huội Quảng': 'HONG', 'Nậm Chiến': 'HONG',
      'A Vương': 'CENTRAL', 'Sông Tranh 2': 'CENTRAL', 'Đắk Mi 4': 'CENTRAL',
      'Sông Bung 4': 'CENTRAL', 'Bình Điền': 'CENTRAL', 'Hương Điền': 'CENTRAL',
      'Trị An': 'DONGNAI', 'Thác Mơ': 'DONGNAI', 'Cần Đơn': 'DONGNAI',
      'Buôn Kuốp': 'MEKONG', 'Buôn Tua Srah': 'MEKONG', 'Srêpốk 3': 'MEKONG',
    }
    return mapping[name] || 'UNKNOWN'
  }

  // Handle basin selection with 10s loading delay
  const handleBasinSelect = (basin: string) => {
    if (basin === selectedBasin || basinLoading) return

    setBasinLoading(true)
    setLoadingProgress(0)

    // Progress animation over 10 seconds
    const duration = 10000 // 10 seconds
    const interval = 100 // Update every 100ms
    const steps = duration / interval
    let currentStep = 0

    const progressInterval = setInterval(() => {
      currentStep++
      setLoadingProgress(Math.min((currentStep / steps) * 100, 100))

      if (currentStep >= steps) {
        clearInterval(progressInterval)
        setSelectedBasin(basin)
        setBasinLoading(false)
        setLoadingProgress(0)
      }
    }, interval)
  }

  const filteredReservoirs = selectedBasin === 'all'
    ? reservoirs
    : reservoirs.filter(r => r.basin === selectedBasin)

  // Get basin summary
  const basinSummary = reservoirs.reduce((acc, r) => {
    const basin = r.basin || 'UNKNOWN'
    acc[basin] = (acc[basin] || 0) + 1
    return acc
  }, {} as Record<string, number>)

  // Count high water reservoirs
  const highWaterCount = reservoirs.filter(r => (r.water_percent || 0) >= 90).length
  const spillwayOpenCount = reservoirs.filter(r => (r.ncxs || 0) > 0 || (r.ncxm || 0) > 0).length

  const getWaterLevelColor = (percent: number | null) => {
    if (percent === null) return 'bg-gray-200'
    if (percent >= 95) return 'bg-red-500'
    if (percent >= 90) return 'bg-orange-500'
    if (percent >= 80) return 'bg-yellow-500'
    if (percent >= 50) return 'bg-blue-500'
    return 'bg-blue-300'
  }

  const getWaterLevelText = (percent: number | null) => {
    if (percent === null) return 'N/A'
    if (percent >= 95) return 'Rất cao'
    if (percent >= 90) return 'Cao'
    if (percent >= 80) return 'Bình thường'
    if (percent >= 50) return 'Thấp'
    return 'Rất thấp'
  }

  if (loading) {
    return (
      <div className="bg-white rounded-lg shadow-xl p-4">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">Hồ chứa thủy điện</h2>
        <div className="space-y-3">
          {[1, 2, 3, 4].map(i => (
            <div key={i} className="h-16 bg-gray-100 rounded animate-pulse"></div>
          ))}
        </div>
      </div>
    )
  }

  return (
    <div className="bg-white rounded-lg shadow-xl max-h-[85vh] flex flex-col overflow-hidden">
      {/* Header */}
      <div className="p-4 border-b bg-gradient-to-r from-blue-50 to-cyan-50">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <Waves className="w-5 h-5 text-blue-600" />
            <h2 className="text-lg font-semibold text-gray-900">Hồ chứa thủy điện EVN</h2>
          </div>
          <button
            onClick={() => fetchReservoirs(true)}
            disabled={refreshing}
            className="p-2 hover:bg-white rounded-full transition-colors"
            title="Làm mới dữ liệu"
          >
            <RefreshCw className={`w-4 h-4 text-gray-600 ${refreshing ? 'animate-spin' : ''}`} />
          </button>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-3 gap-2 mb-3">
          <div className="bg-white/80 rounded-lg p-2 text-center">
            <p className="text-2xl font-bold text-blue-600">{reservoirs.length}</p>
            <p className="text-xs text-gray-500">Tổng hồ</p>
          </div>
          <div className="bg-white/80 rounded-lg p-2 text-center">
            <p className="text-2xl font-bold text-orange-600">{highWaterCount}</p>
            <p className="text-xs text-gray-500">Mực nước cao</p>
          </div>
          <div className="bg-white/80 rounded-lg p-2 text-center">
            <p className="text-2xl font-bold text-red-600">{spillwayOpenCount}</p>
            <p className="text-xs text-gray-500">Đang xả</p>
          </div>
        </div>

        {/* Basin filter */}
        <div className="flex gap-1 overflow-x-auto pb-1">
          <button
            onClick={() => handleBasinSelect('all')}
            disabled={basinLoading}
            className={`px-3 py-1.5 text-xs rounded whitespace-nowrap transition-colors ${
              selectedBasin === 'all' ? 'bg-gray-900 text-white' : 'bg-white text-gray-600 hover:bg-gray-100'
            } ${basinLoading ? 'opacity-50 cursor-not-allowed' : ''}`}
          >
            Tất cả ({reservoirs.length})
          </button>
          {Object.entries(basinSummary).map(([basin, count]) => (
            <button
              key={basin}
              onClick={() => handleBasinSelect(basin)}
              disabled={basinLoading}
              className={`px-3 py-1.5 text-xs rounded whitespace-nowrap transition-colors flex items-center gap-1 ${
                selectedBasin === basin ? 'bg-gray-900 text-white' : 'bg-white text-gray-600 hover:bg-gray-100'
              } ${basinLoading ? 'opacity-50 cursor-not-allowed' : ''}`}
            >
              <span className={`w-2 h-2 rounded-full ${BASIN_COLORS[basin] || 'bg-gray-400'}`}></span>
              {BASIN_NAMES[basin] || basin} ({count})
            </button>
          ))}
        </div>

        {/* Loading Progress Bar */}
        {basinLoading && (
          <div className="mt-3 bg-white/80 rounded-lg p-3">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs text-gray-600 flex items-center gap-2">
                <RefreshCw className="w-3 h-3 animate-spin" />
                Đang tải dữ liệu khu vực...
              </span>
              <span className="text-xs font-medium text-blue-600">{Math.round(loadingProgress)}%</span>
            </div>
            <div className="w-full h-2 bg-gray-200 rounded-full overflow-hidden">
              <div
                className="h-full bg-gradient-to-r from-blue-500 to-cyan-500 rounded-full transition-all duration-100"
                style={{ width: `${loadingProgress}%` }}
              />
            </div>
            <p className="text-xs text-gray-500 mt-1 text-center">
              Đang phân tích {Math.round(loadingProgress / 10)}/10 bước...
            </p>
          </div>
        )}
      </div>

      {/* Reservoir List */}
      <div className="flex-1 overflow-y-auto">
        {filteredReservoirs.length === 0 ? (
          <div className="p-8 text-center text-gray-500">
            <Droplets className="w-10 h-10 mx-auto mb-2 opacity-30" />
            <p>Không có dữ liệu hồ chứa</p>
          </div>
        ) : (
          <div className="divide-y">
            {filteredReservoirs.map((reservoir) => {
              const isExpanded = expandedReservoir === reservoir.name
              const hasSpillway = (reservoir.ncxs || 0) > 0 || (reservoir.ncxm || 0) > 0
              const isHighWater = (reservoir.water_percent || 0) >= 90

              return (
                <div
                  key={reservoir.name}
                  className={`transition-colors ${
                    hasSpillway ? 'bg-red-50' : isHighWater ? 'bg-orange-50' : ''
                  }`}
                >
                  {/* Main row */}
                  <div
                    onClick={() => setExpandedReservoir(isExpanded ? null : reservoir.name)}
                    className="p-3 cursor-pointer hover:bg-gray-50/50"
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <span className={`w-2 h-2 rounded-full ${BASIN_COLORS[reservoir.basin || 'UNKNOWN']}`}></span>
                        <div>
                          <h3 className="font-medium text-gray-900 text-sm flex items-center gap-2">
                            {reservoir.name}
                            {hasSpillway && (
                              <span className="px-1.5 py-0.5 text-xs bg-red-500 text-white rounded">
                                Đang xả
                              </span>
                            )}
                          </h3>
                          <p className="text-xs text-gray-500">{BASIN_NAMES[reservoir.basin || 'UNKNOWN']}</p>
                        </div>
                      </div>

                      <div className="flex items-center gap-3">
                        {/* Water level indicator */}
                        <div className="text-right">
                          <p className="text-sm font-semibold text-gray-900">
                            {reservoir.htl?.toFixed(2) || '-'} m
                          </p>
                          <p className={`text-xs ${
                            (reservoir.water_percent || 0) >= 90 ? 'text-orange-600 font-medium' : 'text-gray-500'
                          }`}>
                            {reservoir.water_percent ? `${reservoir.water_percent}%` : '-'}
                          </p>
                        </div>

                        {/* Water level bar */}
                        <div className="w-16 h-8 bg-gray-100 rounded overflow-hidden relative">
                          <div
                            className={`absolute bottom-0 left-0 right-0 transition-all ${getWaterLevelColor(reservoir.water_percent || null)}`}
                            style={{ height: `${Math.min(reservoir.water_percent || 0, 100)}%` }}
                          ></div>
                          <div className="absolute inset-0 flex items-center justify-center">
                            <Droplets className="w-4 h-4 text-white/70" />
                          </div>
                        </div>

                        {isExpanded ? (
                          <ChevronUp className="w-4 h-4 text-gray-400" />
                        ) : (
                          <ChevronDown className="w-4 h-4 text-gray-400" />
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Expanded details */}
                  {isExpanded && (
                    <div className="px-3 pb-3 pt-1 border-t border-gray-100">
                      <div className="grid grid-cols-2 gap-2 text-xs">
                        {/* Water levels */}
                        <div className="bg-gray-50 p-2 rounded">
                          <p className="text-gray-500 mb-1">Mực nước</p>
                          <div className="space-y-1">
                            <div className="flex justify-between">
                              <span>Hiện tại (Htl):</span>
                              <span className="font-medium">{reservoir.htl?.toFixed(2) || '-'} m</span>
                            </div>
                            <div className="flex justify-between">
                              <span>Dâng BT (Hdbt):</span>
                              <span className="font-medium">{reservoir.hdbt?.toFixed(2) || '-'} m</span>
                            </div>
                            <div className="flex justify-between">
                              <span>Mực chết (Hc):</span>
                              <span className="font-medium">{reservoir.hc?.toFixed(2) || '-'} m</span>
                            </div>
                          </div>
                        </div>

                        {/* Flow rates */}
                        <div className="bg-gray-50 p-2 rounded">
                          <p className="text-gray-500 mb-1">Lưu lượng</p>
                          <div className="space-y-1">
                            <div className="flex justify-between">
                              <span>Đến hồ (Qve):</span>
                              <span className="font-medium">{reservoir.qve?.toFixed(1) || '-'} m³/s</span>
                            </div>
                            <div className="flex justify-between">
                              <span>Tổng xả (ΣQx):</span>
                              <span className="font-medium text-blue-600">{reservoir.totalQx?.toFixed(1) || '-'} m³/s</span>
                            </div>
                            <div className="flex justify-between">
                              <span>Xả turbine:</span>
                              <span className="font-medium">{reservoir.qxt?.toFixed(1) || '-'} m³/s</span>
                            </div>
                          </div>
                        </div>

                        {/* Spillway info */}
                        {(reservoir.ncxs || reservoir.ncxm || reservoir.qxm) && (
                          <div className="col-span-2 bg-red-50 p-2 rounded">
                            <p className="text-red-600 font-medium mb-1 flex items-center gap-1">
                              <AlertTriangle className="w-3 h-3" />
                              Thông tin xả
                            </p>
                            <div className="grid grid-cols-3 gap-2 text-gray-700">
                              <div>
                                <span className="text-gray-500">Xả mặt:</span>
                                <span className="ml-1 font-medium">{reservoir.qxm?.toFixed(1) || 0} m³/s</span>
                              </div>
                              <div>
                                <span className="text-gray-500">Cửa xả sâu:</span>
                                <span className="ml-1 font-medium">{reservoir.ncxs || 0}</span>
                              </div>
                              <div>
                                <span className="text-gray-500">Cửa xả mặt:</span>
                                <span className="ml-1 font-medium">{reservoir.ncxm || 0}</span>
                              </div>
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              )
            })}
          </div>
        )}
      </div>

      {/* Footer */}
      <div className="p-2 border-t bg-gray-50 text-xs text-gray-500 text-center">
        Nguồn: EVN • Cập nhật: {lastUpdated ? new Date(lastUpdated).toLocaleString('vi-VN') : '-'}
      </div>
    </div>
  )
}
