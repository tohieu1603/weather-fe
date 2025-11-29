'use client'

import { Droplet, AlertTriangle } from 'lucide-react'

interface BasinCardProps {
  name: string
  data: {
    basin: string
    forecast_days: Array<{
      date: string
      daily_rain: number
      accumulated_3d: number
      risk_level: string
      risk_description: string
    }>
    max_daily_rain: number
    max_daily_date: string
    warnings: Array<any>
  }
  onClick: () => void
}

const getRiskColor = (level: string) => {
  switch (level) {
    case 'NGUY HIỂM':
      return 'bg-red-100 border-red-500 text-red-700'
    case 'CẢNH BÁO':
      return 'bg-orange-100 border-orange-500 text-orange-700'
    case 'THEO DÕI':
      return 'bg-yellow-100 border-yellow-500 text-yellow-700'
    default:
      return 'bg-green-100 border-green-500 text-green-700'
  }
}

const getRiskIcon = (level: string) => {
  switch (level) {
    case 'NGUY HIỂM':
      return '⛔'
    case 'CẢNH BÁO':
      return '⚠️'
    case 'THEO DÕI':
      return '⚡'
    default:
      return '✓'
  }
}

const getBasinDisplayName = (name: string) => {
  const names: Record<string, string> = {
    'Hong': 'Sông Hồng',
    'Mekong': 'Sông Mekong',
    'DongNai': 'Sông Đồng Nai',
    'Central': 'Miền Trung'
  }
  return names[name] || name
}

export default function BasinCard({ name, data, onClick }: BasinCardProps) {
  const currentRisk = data.forecast_days[0]?.risk_level || 'AN TOÀN'
  const hasWarnings = data.warnings.length > 0

  return (
    <div
      onClick={onClick}
      className={`
        rounded-lg border-2 p-6 cursor-pointer transition-all hover:shadow-lg
        ${getRiskColor(currentRisk)}
      `}
    >
      <div className="flex items-start justify-between mb-4">
        <div>
          <h3 className="text-xl font-bold mb-1">{getBasinDisplayName(name)}</h3>
          <p className="text-sm opacity-75">{name} Basin</p>
        </div>
        <div className="text-4xl">{getRiskIcon(currentRisk)}</div>
      </div>

      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <span className="text-sm font-medium">Tình trạng hiện tại:</span>
          <span className="font-bold">{currentRisk}</span>
        </div>

        <div className="flex items-center justify-between">
          <span className="text-sm font-medium">Mưa lớn nhất:</span>
          <span className="font-bold">{data.max_daily_rain.toFixed(1)} mm</span>
        </div>

        <div className="flex items-center justify-between">
          <span className="text-sm font-medium">Ngày:</span>
          <span className="font-semibold">{data.max_daily_date}</span>
        </div>

        {hasWarnings && (
          <div className="mt-4 pt-3 border-t border-current/20">
            <div className="flex items-center gap-2">
              <AlertTriangle className="w-4 h-4" />
              <span className="text-sm font-semibold">
                {data.warnings.length} cảnh báo đang hoạt động
              </span>
            </div>
          </div>
        )}
      </div>

      <div className="mt-4 text-sm opacity-75 hover:opacity-100">
        → Nhấn để xem chi tiết
      </div>
    </div>
  )
}
