'use client'

import { BarChart, Bar, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, Area, AreaChart } from 'recharts'
import { TrendingUp } from 'lucide-react'

interface ForecastChartProps {
  basinName: string
  data: {
    basin: string
    forecast_days: Array<{
      date: string
      daily_rain: number
      accumulated_3d: number
      risk_level: string
      risk_description: string
    }>
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

export default function ForecastChart({ basinName, data }: ForecastChartProps) {
  const chartData = data.forecast_days.slice(0, 10).map(day => ({
    date: day.date.substring(5), // MM-DD
    'Mưa trong ngày': day.daily_rain,
    'Tích lũy 3 ngày': day.accumulated_3d,
    risk: day.risk_level
  }))

  const CustomTooltip = ({ active, payload }: any) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-white p-4 rounded-lg shadow-lg border border-gray-200">
          <p className="font-semibold mb-2">{payload[0].payload.date}</p>
          {payload.map((entry: any, index: number) => (
            <p key={index} style={{ color: entry.color }} className="text-sm">
              {entry.name}: <span className="font-bold">{entry.value.toFixed(1)} mm</span>
            </p>
          ))}
          <p className="text-sm mt-2 text-gray-600">
            Mức độ: <span className="font-semibold">{payload[0].payload.risk}</span>
          </p>
        </div>
      )
    }
    return null
  }

  return (
    <div className="bg-white rounded-lg shadow-lg p-6">
      <div className="flex items-center gap-2 mb-6">
        <TrendingUp className="w-6 h-6 text-blue-500" />
        <h2 className="text-2xl font-bold text-gray-800">
          Biểu đồ dự báo - {getBasinDisplayName(basinName)}
        </h2>
      </div>

      {/* Bar Chart - Daily Rainfall */}
      <div className="mb-8">
        <h3 className="text-lg font-semibold text-gray-700 mb-4">Lượng mưa hàng ngày</h3>
        <ResponsiveContainer width="100%" height={300}>
          <BarChart data={chartData}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="date" />
            <YAxis label={{ value: 'mm', angle: -90, position: 'insideLeft' }} />
            <Tooltip content={<CustomTooltip />} />
            <Legend />
            <Bar dataKey="Mưa trong ngày" fill="#3b82f6" radius={[8, 8, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </div>

      {/* Area Chart - Accumulated Rainfall */}
      <div className="mb-8">
        <h3 className="text-lg font-semibold text-gray-700 mb-4">Mưa tích lũy 3 ngày</h3>
        <ResponsiveContainer width="100%" height={300}>
          <AreaChart data={chartData}>
            <defs>
              <linearGradient id="colorAccumulated" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#8b5cf6" stopOpacity={0.8}/>
                <stop offset="95%" stopColor="#8b5cf6" stopOpacity={0.1}/>
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="date" />
            <YAxis label={{ value: 'mm', angle: -90, position: 'insideLeft' }} />
            <Tooltip content={<CustomTooltip />} />
            <Legend />
            <Area
              type="monotone"
              dataKey="Tích lũy 3 ngày"
              stroke="#8b5cf6"
              fillOpacity={1}
              fill="url(#colorAccumulated)"
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>

      {/* Combined Line Chart */}
      <div>
        <h3 className="text-lg font-semibold text-gray-700 mb-4">So sánh xu hướng</h3>
        <ResponsiveContainer width="100%" height={300}>
          <LineChart data={chartData}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="date" />
            <YAxis label={{ value: 'mm', angle: -90, position: 'insideLeft' }} />
            <Tooltip content={<CustomTooltip />} />
            <Legend />
            <Line
              type="monotone"
              dataKey="Mưa trong ngày"
              stroke="#3b82f6"
              strokeWidth={2}
              dot={{ r: 4 }}
              activeDot={{ r: 6 }}
            />
            <Line
              type="monotone"
              dataKey="Tích lũy 3 ngày"
              stroke="#8b5cf6"
              strokeWidth={2}
              dot={{ r: 4 }}
              activeDot={{ r: 6 }}
            />
          </LineChart>
        </ResponsiveContainer>
      </div>
    </div>
  )
}
