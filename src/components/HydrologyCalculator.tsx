'use client';

import { useState } from 'react';
import { motion } from 'framer-motion';

interface CalculatorProps {
  onClose: () => void;
}

export default function HydrologyCalculator({ onClose }: CalculatorProps) {
  const [activeTab, setActiveTab] = useState<'reservoir' | 'routing' | 'travel' | 'wave'>('reservoir');
  const [result, setResult] = useState<any>(null);
  const [loading, setLoading] = useState(false);

  // Reservoir Balance State
  const [reservoir, setReservoir] = useState({
    S_current: 1000000000,
    inflow: 500,
    outflow: 400,
    evap: 10,
    seepage: 5,
    dt: 3600
  });

  // Flood Routing State
  const [routing, setRouting] = useState({
    inflow: [100, 150, 200, 250, 300, 250, 200, 150, 100],
    K: 21600,
    X: 0.2,
    dt: 3600
  });

  // Travel Time State
  const [travel, setTravel] = useState({
    distance: 50,
    slope: 0.001,
    manning_n: 0.035,
    hydraulic_radius: 3.5
  });

  // Wave Celerity State
  const [wave, setWave] = useState({
    discharge: 1000,
    width: 100,
    depth: 5
  });

  const calculateReservoir = async () => {
    setLoading(true);
    try {
      const res = await fetch('http://localhost:8000/api/hydrology/reservoir-balance', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(reservoir)
      });
      const data = await res.json();
      setResult(data);
    } catch (error) {
      console.error('Error:', error);
    }
    setLoading(false);
  };

  const calculateRouting = async () => {
    setLoading(true);
    try {
      const res = await fetch('http://localhost:8000/api/hydrology/flood-routing', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(routing)
      });
      const data = await res.json();
      setResult(data);
    } catch (error) {
      console.error('Error:', error);
    }
    setLoading(false);
  };

  const calculateTravel = async () => {
    setLoading(true);
    try {
      const res = await fetch('http://localhost:8000/api/hydrology/travel-time', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(travel)
      });
      const data = await res.json();
      setResult(data);
    } catch (error) {
      console.error('Error:', error);
    }
    setLoading(false);
  };

  const calculateWave = async () => {
    setLoading(true);
    try {
      const res = await fetch('http://localhost:8000/api/hydrology/wave-celerity', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(wave)
      });
      const data = await res.json();
      setResult(data);
    } catch (error) {
      console.error('Error:', error);
    }
    setLoading(false);
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-[2000] flex items-center justify-center bg-black/50 backdrop-blur-sm p-4"
      onClick={onClose}
    >
      <motion.div
        initial={{ scale: 0.9, y: 20 }}
        animate={{ scale: 1, y: 0 }}
        exit={{ scale: 0.9, y: 20 }}
        className="glass-card rounded-2xl max-w-6xl w-full max-h-[90vh] overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="p-6 border-b border-white/10">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-2xl font-bold text-white">Công Thức Thủy Văn</h2>
              <p className="text-gray-300 text-sm mt-1">Hydrological Calculations</p>
            </div>
            <button
              onClick={onClose}
              className="p-2 rounded-lg glass hover:bg-white/20 transition-colors"
            >
              <svg className="w-6 h-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        </div>

        {/* Tabs */}
        <div className="flex border-b border-white/10 px-6">
          {[
            { id: 'reservoir', name: 'Cân Bằng Hồ Chứa', icon: '🏞️' },
            { id: 'routing', name: 'Diễn Toán Lũ', icon: '🌊' },
            { id: 'travel', name: 'Thời Gian Truyền', icon: '⏱️' },
            { id: 'wave', name: 'Sóng Lũ', icon: '〰️' }
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => {
                setActiveTab(tab.id as any);
                setResult(null);
              }}
              className={`px-4 py-3 text-sm font-medium transition-colors relative ${
                activeTab === tab.id
                  ? 'text-blue-400'
                  : 'text-gray-400 hover:text-white'
              }`}
            >
              <span className="mr-2">{tab.icon}</span>
              {tab.name}
              {activeTab === tab.id && (
                <motion.div
                  layoutId="activeTab"
                  className="absolute bottom-0 left-0 right-0 h-0.5 bg-blue-400"
                />
              )}
            </button>
          ))}
        </div>

        {/* Content */}
        <div className="p-6 overflow-y-auto max-h-[calc(90vh-200px)]">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Input Section */}
            <div className="space-y-4">
              <h3 className="text-lg font-semibold text-white mb-4">Tham số đầu vào</h3>

              {activeTab === 'reservoir' && (
                <div className="space-y-3">
                  <div>
                    <label className="text-sm text-gray-300 block mb-1">Dung tích hiện tại (m³)</label>
                    <input
                      type="number"
                      value={reservoir.S_current}
                      onChange={(e) => setReservoir({ ...reservoir, S_current: Number(e.target.value) })}
                      className="w-full px-3 py-2 glass rounded-lg text-white"
                    />
                  </div>
                  <div>
                    <label className="text-sm text-gray-300 block mb-1">Lưu lượng đến (m³/s)</label>
                    <input
                      type="number"
                      value={reservoir.inflow}
                      onChange={(e) => setReservoir({ ...reservoir, inflow: Number(e.target.value) })}
                      className="w-full px-3 py-2 glass rounded-lg text-white"
                    />
                  </div>
                  <div>
                    <label className="text-sm text-gray-300 block mb-1">Lưu lượng xả (m³/s)</label>
                    <input
                      type="number"
                      value={reservoir.outflow}
                      onChange={(e) => setReservoir({ ...reservoir, outflow: Number(e.target.value) })}
                      className="w-full px-3 py-2 glass rounded-lg text-white"
                    />
                  </div>
                  <div>
                    <label className="text-sm text-gray-300 block mb-1">Bốc hơi (m³/s)</label>
                    <input
                      type="number"
                      value={reservoir.evap}
                      onChange={(e) => setReservoir({ ...reservoir, evap: Number(e.target.value) })}
                      className="w-full px-3 py-2 glass rounded-lg text-white"
                    />
                  </div>
                  <div>
                    <label className="text-sm text-gray-300 block mb-1">Thất thoát (m³/s)</label>
                    <input
                      type="number"
                      value={reservoir.seepage}
                      onChange={(e) => setReservoir({ ...reservoir, seepage: Number(e.target.value) })}
                      className="w-full px-3 py-2 glass rounded-lg text-white"
                    />
                  </div>
                  <button
                    onClick={calculateReservoir}
                    disabled={loading}
                    className="w-full py-3 bg-blue-500 hover:bg-blue-600 text-white rounded-lg font-medium transition-colors disabled:opacity-50"
                  >
                    {loading ? 'Đang tính...' : 'Tính toán'}
                  </button>
                </div>
              )}

              {activeTab === 'routing' && (
                <div className="space-y-3">
                  <div>
                    <label className="text-sm text-gray-300 block mb-1">Chuỗi lưu lượng đến (m³/s, phân cách bằng dấu phẩy)</label>
                    <input
                      type="text"
                      value={routing.inflow.join(',')}
                      onChange={(e) => setRouting({ ...routing, inflow: e.target.value.split(',').map(Number) })}
                      className="w-full px-3 py-2 glass rounded-lg text-white"
                      placeholder="100,150,200,250,300"
                    />
                  </div>
                  <div>
                    <label className="text-sm text-gray-300 block mb-1">Hằng số K (giây)</label>
                    <input
                      type="number"
                      value={routing.K}
                      onChange={(e) => setRouting({ ...routing, K: Number(e.target.value) })}
                      className="w-full px-3 py-2 glass rounded-lg text-white"
                    />
                  </div>
                  <div>
                    <label className="text-sm text-gray-300 block mb-1">Hệ số X (0-0.5)</label>
                    <input
                      type="number"
                      step="0.1"
                      value={routing.X}
                      onChange={(e) => setRouting({ ...routing, X: Number(e.target.value) })}
                      className="w-full px-3 py-2 glass rounded-lg text-white"
                    />
                  </div>
                  <button
                    onClick={calculateRouting}
                    disabled={loading}
                    className="w-full py-3 bg-blue-500 hover:bg-blue-600 text-white rounded-lg font-medium transition-colors disabled:opacity-50"
                  >
                    {loading ? 'Đang tính...' : 'Tính toán'}
                  </button>
                </div>
              )}

              {activeTab === 'travel' && (
                <div className="space-y-3">
                  <div>
                    <label className="text-sm text-gray-300 block mb-1">Khoảng cách (km)</label>
                    <input
                      type="number"
                      value={travel.distance}
                      onChange={(e) => setTravel({ ...travel, distance: Number(e.target.value) })}
                      className="w-full px-3 py-2 glass rounded-lg text-white"
                    />
                  </div>
                  <div>
                    <label className="text-sm text-gray-300 block mb-1">Độ dốc (m/m)</label>
                    <input
                      type="number"
                      step="0.0001"
                      value={travel.slope}
                      onChange={(e) => setTravel({ ...travel, slope: Number(e.target.value) })}
                      className="w-full px-3 py-2 glass rounded-lg text-white"
                    />
                  </div>
                  <div>
                    <label className="text-sm text-gray-300 block mb-1">Hệ số Manning (n)</label>
                    <input
                      type="number"
                      step="0.001"
                      value={travel.manning_n}
                      onChange={(e) => setTravel({ ...travel, manning_n: Number(e.target.value) })}
                      className="w-full px-3 py-2 glass rounded-lg text-white"
                    />
                  </div>
                  <div>
                    <label className="text-sm text-gray-300 block mb-1">Bán kính thủy lực (m)</label>
                    <input
                      type="number"
                      step="0.1"
                      value={travel.hydraulic_radius}
                      onChange={(e) => setTravel({ ...travel, hydraulic_radius: Number(e.target.value) })}
                      className="w-full px-3 py-2 glass rounded-lg text-white"
                    />
                  </div>
                  <button
                    onClick={calculateTravel}
                    disabled={loading}
                    className="w-full py-3 bg-blue-500 hover:bg-blue-600 text-white rounded-lg font-medium transition-colors disabled:opacity-50"
                  >
                    {loading ? 'Đang tính...' : 'Tính toán'}
                  </button>
                </div>
              )}

              {activeTab === 'wave' && (
                <div className="space-y-3">
                  <div>
                    <label className="text-sm text-gray-300 block mb-1">Lưu lượng (m³/s)</label>
                    <input
                      type="number"
                      value={wave.discharge}
                      onChange={(e) => setWave({ ...wave, discharge: Number(e.target.value) })}
                      className="w-full px-3 py-2 glass rounded-lg text-white"
                    />
                  </div>
                  <div>
                    <label className="text-sm text-gray-300 block mb-1">Bề rộng (m)</label>
                    <input
                      type="number"
                      value={wave.width}
                      onChange={(e) => setWave({ ...wave, width: Number(e.target.value) })}
                      className="w-full px-3 py-2 glass rounded-lg text-white"
                    />
                  </div>
                  <div>
                    <label className="text-sm text-gray-300 block mb-1">Độ sâu (m)</label>
                    <input
                      type="number"
                      value={wave.depth}
                      onChange={(e) => setWave({ ...wave, depth: Number(e.target.value) })}
                      className="w-full px-3 py-2 glass rounded-lg text-white"
                    />
                  </div>
                  <button
                    onClick={calculateWave}
                    disabled={loading}
                    className="w-full py-3 bg-blue-500 hover:bg-blue-600 text-white rounded-lg font-medium transition-colors disabled:opacity-50"
                  >
                    {loading ? 'Đang tính...' : 'Tính toán'}
                  </button>
                </div>
              )}
            </div>

            {/* Result Section */}
            <div>
              <h3 className="text-lg font-semibold text-white mb-4">Kết quả</h3>
              {result ? (
                <div className="glass rounded-lg p-4 space-y-4">
                  <div className="p-3 bg-blue-500/20 rounded-lg border border-blue-500/30">
                    <div className="text-xs text-blue-300 mb-1">Công thức</div>
                    <div className="font-mono text-sm text-white">{result.formula}</div>
                  </div>

                  <div className="space-y-2">
                    {Object.entries(result.result || {}).map(([key, value]: [string, any]) => (
                      <div key={key} className="p-2 glass-card rounded">
                        <div className="text-xs text-gray-400">{key.replace(/_/g, ' ')}</div>
                        <div className="text-white font-medium">
                          {typeof value === 'object' ? JSON.stringify(value, null, 2) : value}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              ) : (
                <div className="glass rounded-lg p-8 text-center text-gray-400">
                  <div className="text-4xl mb-2">📊</div>
                  <p>Nhập tham số và nhấn Tính toán để xem kết quả</p>
                </div>
              )}
            </div>
          </div>
        </div>
      </motion.div>
    </motion.div>
  );
}
