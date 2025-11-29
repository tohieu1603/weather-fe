'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Droplets, Activity, Waves, Calculator, BookOpen, ChevronRight, Info, Code2 } from 'lucide-react';

interface HydraulicFormulasProps {
  onClose: () => void;
}

export default function HydraulicFormulas({ onClose }: HydraulicFormulasProps) {
  const [activeTab, setActiveTab] = useState<'rational' | 'scs' | 'manning' | 'muskingum'>('rational');

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 bg-black/70 backdrop-blur-sm z-[3000] flex items-center justify-center p-4"
        onClick={onClose}
      >
        <motion.div
          initial={{ scale: 0.95, opacity: 0, y: 20 }}
          animate={{ scale: 1, opacity: 1, y: 0 }}
          exit={{ scale: 0.95, opacity: 0, y: 20 }}
          onClick={(e) => e.stopPropagation()}
          className="w-full max-w-6xl max-h-[92vh] overflow-hidden rounded-2xl shadow-2xl"
          style={{
            background: 'linear-gradient(135deg, rgba(15, 23, 42, 0.98) 0%, rgba(30, 41, 59, 0.98) 100%)'
          }}
        >
          {/* Header with Gradient */}
          <div className="relative overflow-hidden">
            <div className="absolute inset-0 bg-gradient-to-r from-cyan-600/20 via-blue-600/20 to-purple-600/20"></div>
            <div className="relative px-8 py-6 border-b border-white/10">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-3xl font-bold text-white mb-2 drop-shadow-lg flex items-center gap-3">
                    <Calculator className="w-8 h-8 text-cyan-400" />
                    Công Thức Thủy Văn Cốt Lõi
                  </h2>
                  <p className="text-sm text-gray-300 flex items-center gap-2">
                    <Info className="w-4 h-4" />
                    Phương pháp chuẩn quốc tế 2024 - USDA NRCS, WSDOT, HEC-RAS
                  </p>
                </div>
                <button
                  onClick={onClose}
                  className="p-3 hover:bg-white/10 rounded-xl transition-all duration-200 group"
                >
                  <X className="w-6 h-6 text-white group-hover:rotate-90 transition-transform duration-200" />
                </button>
              </div>
            </div>
          </div>

          {/* Modern Tab Navigation */}
          <div className="px-8 py-4 bg-black/20 border-b border-white/10">
            <div className="flex gap-3">
              <button
                onClick={() => setActiveTab('rational')}
                className={`flex items-center gap-2 px-6 py-3 rounded-xl font-semibold text-sm transition-all duration-300 ${
                  activeTab === 'rational'
                    ? 'bg-gradient-to-r from-cyan-500 to-blue-500 text-white shadow-lg shadow-cyan-500/50 scale-105'
                    : 'bg-white/5 text-gray-300 hover:bg-white/10'
                }`}
              >
                <Droplets className="w-5 h-5" />
                Rational Method
                {activeTab === 'rational' && <ChevronRight className="w-4 h-4" />}
              </button>
              <button
                onClick={() => setActiveTab('scs')}
                className={`flex items-center gap-2 px-6 py-3 rounded-xl font-semibold text-sm transition-all duration-300 ${
                  activeTab === 'scs'
                    ? 'bg-gradient-to-r from-green-500 to-emerald-500 text-white shadow-lg shadow-green-500/50 scale-105'
                    : 'bg-white/5 text-gray-300 hover:bg-white/10'
                }`}
              >
                <Activity className="w-5 h-5" />
                SCS Curve Number
                {activeTab === 'scs' && <ChevronRight className="w-4 h-4" />}
              </button>
              <button
                onClick={() => setActiveTab('manning')}
                className={`flex items-center gap-2 px-6 py-3 rounded-xl font-semibold text-sm transition-all duration-300 ${
                  activeTab === 'manning'
                    ? 'bg-gradient-to-r from-purple-500 to-pink-500 text-white shadow-lg shadow-purple-500/50 scale-105'
                    : 'bg-white/5 text-gray-300 hover:bg-white/10'
                }`}
              >
                <Waves className="w-5 h-5" />
                Manning Equation
                {activeTab === 'manning' && <ChevronRight className="w-4 h-4" />}
              </button>
              <button
                onClick={() => setActiveTab('muskingum')}
                className={`flex items-center gap-2 px-6 py-3 rounded-xl font-semibold text-sm transition-all duration-300 ${
                  activeTab === 'muskingum'
                    ? 'bg-gradient-to-r from-orange-500 to-red-500 text-white shadow-lg shadow-orange-500/50 scale-105'
                    : 'bg-white/5 text-gray-300 hover:bg-white/10'
                }`}
              >
                <BookOpen className="w-5 h-5" />
                Muskingum Routing
                {activeTab === 'muskingum' && <ChevronRight className="w-4 h-4" />}
              </button>
            </div>
          </div>

          {/* Content Area */}
          <div className="px-8 py-6 overflow-y-auto max-h-[calc(92vh-200px)] custom-scrollbar">
            {/* RATIONAL METHOD */}
            {activeTab === 'rational' && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="space-y-6"
              >
                {/* Main Formula */}
                <div className="rounded-2xl overflow-hidden bg-gradient-to-br from-cyan-500/10 to-blue-500/10 border border-cyan-500/30">
                  <div className="p-6 bg-gradient-to-r from-cyan-600/20 to-blue-600/20 border-b border-cyan-500/20">
                    <h3 className="text-2xl font-bold text-white mb-2">Rational Method</h3>
                    <p className="text-sm text-gray-300">Phương pháp tính lưu lượng đỉnh cho lưu vực nhỏ (&lt; 20 acres / 8 ha)</p>
                  </div>

                  <div className="p-6">
                    {/* Main Equation */}
                    <div className="mb-6 p-6 bg-gradient-to-br from-cyan-900/30 to-blue-900/30 rounded-xl border-2 border-cyan-400/40">
                      <div className="text-center mb-4">
                        <div className="inline-block px-6 py-3 bg-cyan-500/20 rounded-lg border border-cyan-400/50">
                          <p className="text-4xl font-bold text-cyan-300 font-mono">Q = C × i × A</p>
                        </div>
                      </div>
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
                        <div className="p-4 bg-white/5 rounded-lg border border-white/10">
                          <div className="text-cyan-400 font-bold mb-2">Q = Peak Discharge</div>
                          <div className="text-gray-300">Lưu lượng đỉnh (cfs hoặc m³/s)</div>
                        </div>
                        <div className="p-4 bg-white/5 rounded-lg border border-white/10">
                          <div className="text-cyan-400 font-bold mb-2">C = Runoff Coefficient</div>
                          <div className="text-gray-300">Hệ số dòng chảy (không thứ nguyên, 0-1)</div>
                        </div>
                        <div className="p-4 bg-white/5 rounded-lg border border-white/10">
                          <div className="text-cyan-400 font-bold mb-2">i = Rainfall Intensity</div>
                          <div className="text-gray-300">Cường độ mưa (in/hr hoặc mm/hr)</div>
                        </div>
                      </div>
                      <div className="mt-4 p-4 bg-white/5 rounded-lg border border-white/10">
                        <div className="text-cyan-400 font-bold mb-2">A = Drainage Area</div>
                        <div className="text-gray-300">Diện tích lưu vực (acres hoặc ha)</div>
                      </div>
                    </div>

                    {/* Runoff Coefficients Table */}
                    <div className="mb-6">
                      <h4 className="text-xl font-bold text-white mb-4 flex items-center gap-2">
                        <Code2 className="w-5 h-5 text-cyan-400" />
                        Hệ Số Dòng Chảy (C) Theo Loại Bề Mặt
                      </h4>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {[
                          { type: 'Mái nhà / Roofs', value: '0.75 - 0.95', color: 'red' },
                          { type: 'Bê tông / Asphalt / Concrete', value: '0.70 - 0.95', color: 'orange' },
                          { type: 'Đá lát / Brick pavement', value: '0.70 - 0.85', color: 'yellow' },
                          { type: 'Khu dân cư mật độ cao', value: '0.50 - 0.70', color: 'cyan' },
                          { type: 'Khu dân cư mật độ thấp', value: '0.30 - 0.50', color: 'blue' },
                          { type: 'Công viên / Parks', value: '0.10 - 0.25', color: 'green' },
                          { type: 'Đồng cỏ / Lawns (đất sét)', value: '0.13 - 0.22', color: 'emerald' },
                          { type: 'Đồng cỏ / Lawns (đất cát)', value: '0.05 - 0.10', color: 'teal' },
                          { type: 'Rừng / Forests', value: '0.05 - 0.20', color: 'lime' },
                          { type: 'Đất nông nghiệp', value: '0.10 - 0.30', color: 'amber' }
                        ].map((item, idx) => (
                          <motion.div
                            key={idx}
                            initial={{ opacity: 0, x: -20 }}
                            animate={{ opacity: 1, x: 0 }}
                            transition={{ delay: idx * 0.03 }}
                            className={`p-4 bg-${item.color}-500/10 rounded-lg border border-${item.color}-500/30 hover:border-${item.color}-500/50 transition-all duration-300`}
                          >
                            <div className="flex justify-between items-center">
                              <span className="text-white font-semibold">{item.type}</span>
                              <span className={`text-${item.color}-300 font-bold font-mono text-lg`}>{item.value}</span>
                            </div>
                          </motion.div>
                        ))}
                      </div>
                    </div>

                    {/* Python Code */}
                    <div className="bg-gradient-to-br from-gray-900 to-gray-800 rounded-xl p-5 shadow-lg border border-gray-700">
                      <div className="flex items-center gap-2 mb-3">
                        <div className="flex gap-1.5">
                          <div className="w-3 h-3 rounded-full bg-red-500"></div>
                          <div className="w-3 h-3 rounded-full bg-yellow-500"></div>
                          <div className="w-3 h-3 rounded-full bg-green-500"></div>
                        </div>
                        <span className="text-xs font-mono text-gray-400 ml-2">rational_method.py</span>
                      </div>
                      <pre className="text-sm overflow-x-auto font-mono leading-relaxed">
<span className="text-purple-400">def</span> <span className="text-blue-400">rational_method</span><span className="text-gray-300">(</span><span className="text-orange-300">C</span><span className="text-gray-300">, </span><span className="text-orange-300">i</span><span className="text-gray-300">, </span><span className="text-orange-300">A</span><span className="text-gray-300">):</span>
    <span className="text-gray-500">"""
    Rational Method: Q = C * i * A

    Parameters:
    - C: Runoff coefficient (dimensionless, 0-1)
    - i: Rainfall intensity (in/hr or mm/hr)
    - A: Drainage area (acres or hectares)

    Returns:
    - Q: Peak discharge (cfs or m³/s)
    """</span>
    <span className="text-orange-300">Q</span> <span className="text-gray-300">= </span><span className="text-orange-300">C</span> <span className="text-gray-300">*</span> <span className="text-orange-300">i</span> <span className="text-gray-300">*</span> <span className="text-orange-300">A</span>
    <span className="text-purple-400">return</span> <span className="text-orange-300">Q</span>

<span className="text-gray-500"># Example: Urban residential area</span>
<span className="text-orange-300">C</span> <span className="text-gray-300">= </span><span className="text-green-400">0.6</span>  <span className="text-gray-500"># Medium density residential</span>
<span className="text-orange-300">i</span> <span className="text-gray-300">= </span><span className="text-green-400">3.5</span>  <span className="text-gray-500"># in/hr (10-year storm)</span>
<span className="text-orange-300">A</span> <span className="text-gray-300">= </span><span className="text-green-400">15.0</span> <span className="text-gray-500"># acres</span>

<span className="text-orange-300">peak_discharge</span> <span className="text-gray-300">= </span><span className="text-blue-400">rational_method</span><span className="text-gray-300">(</span><span className="text-orange-300">C</span><span className="text-gray-300">, </span><span className="text-orange-300">i</span><span className="text-gray-300">, </span><span className="text-orange-300">A</span><span className="text-gray-300">)</span>
<span className="text-blue-400">print</span><span className="text-gray-300">(</span><span className="text-green-300">{`f"Peak Discharge: {peak_discharge} cfs"`}</span><span className="text-gray-300">)</span>
                      </pre>
                    </div>

                    {/* Notes */}
                    <div className="mt-6 p-5 bg-yellow-500/10 rounded-xl border border-yellow-500/30">
                      <h4 className="text-yellow-300 font-bold mb-3">⚠️ Lưu ý quan trọng:</h4>
                      <ul className="text-sm text-yellow-100 space-y-2 ml-6 list-disc">
                        <li>Chỉ áp dụng cho lưu vực nhỏ (&lt; 20 acres / 8 ha)</li>
                        <li>Giả định mưa đồng đều trên toàn bộ lưu vực</li>
                        <li>Thời gian mưa ≥ thời gian tập trung (time of concentration)</li>
                        <li>Nguồn: WSDOT Hydraulics Manual M 23-03.11, Chapter 2 (April 2025)</li>
                      </ul>
                    </div>
                  </div>
                </div>
              </motion.div>
            )}

            {/* SCS CURVE NUMBER */}
            {activeTab === 'scs' && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="space-y-6"
              >
                <div className="rounded-2xl overflow-hidden bg-gradient-to-br from-green-500/10 to-emerald-500/10 border border-green-500/30">
                  <div className="p-6 bg-gradient-to-r from-green-600/20 to-emerald-600/20 border-b border-green-500/20">
                    <h3 className="text-2xl font-bold text-white mb-2">SCS Curve Number Method</h3>
                    <p className="text-sm text-gray-300">Phương pháp USDA NRCS để tính dòng chảy bề mặt</p>
                  </div>

                  <div className="p-6">
                    {/* Main Equations */}
                    <div className="mb-6 space-y-4">
                      <div className="p-6 bg-gradient-to-br from-green-900/30 to-emerald-900/30 rounded-xl border-2 border-green-400/40">
                        <h4 className="text-lg font-bold text-green-300 mb-4">Công thức chính:</h4>
                        <div className="space-y-4">
                          <div className="p-4 bg-black/20 rounded-lg border border-green-400/30">
                            <p className="text-2xl font-bold text-green-300 font-mono text-center">Q = (P - I<sub>a</sub>)² / (P - I<sub>a</sub> + S)</p>
                            <p className="text-sm text-gray-300 text-center mt-2">Dòng chảy bề mặt (Runoff)</p>
                          </div>
                          <div className="p-4 bg-black/20 rounded-lg border border-green-400/30">
                            <p className="text-2xl font-bold text-green-300 font-mono text-center">S = (1000 / CN) - 10</p>
                            <p className="text-sm text-gray-300 text-center mt-2">Potential Maximum Retention</p>
                          </div>
                          <div className="p-4 bg-black/20 rounded-lg border border-green-400/30">
                            <p className="text-2xl font-bold text-green-300 font-mono text-center">I<sub>a</sub> = 0.2S</p>
                            <p className="text-sm text-gray-300 text-center mt-2">Initial Abstraction (mất mát ban đầu)</p>
                          </div>
                        </div>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="p-4 bg-white/5 rounded-lg border border-white/10">
                          <div className="text-green-400 font-bold mb-2">Q = Runoff depth (inches hoặc mm)</div>
                          <div className="text-gray-300 text-sm">Độ sâu dòng chảy bề mặt</div>
                        </div>
                        <div className="p-4 bg-white/5 rounded-lg border border-white/10">
                          <div className="text-green-400 font-bold mb-2">P = Rainfall depth (inches hoặc mm)</div>
                          <div className="text-gray-300 text-sm">Tổng lượng mưa</div>
                        </div>
                        <div className="p-4 bg-white/5 rounded-lg border border-white/10">
                          <div className="text-green-400 font-bold mb-2">S = Maximum retention (inches hoặc mm)</div>
                          <div className="text-gray-300 text-sm">Khả năng giữ nước tối đa</div>
                        </div>
                        <div className="p-4 bg-white/5 rounded-lg border border-white/10">
                          <div className="text-green-400 font-bold mb-2">CN = Curve Number (30-100)</div>
                          <div className="text-gray-300 text-sm">Hệ số đường cong</div>
                        </div>
                      </div>
                    </div>

                    {/* CN Values Table */}
                    <div className="mb-6">
                      <h4 className="text-xl font-bold text-white mb-4">Curve Number (CN) theo loại đất và che phủ</h4>
                      <div className="overflow-x-auto">
                        <table className="w-full text-sm border-collapse">
                          <thead>
                            <tr className="bg-green-500/20">
                              <th className="border border-green-500/30 px-4 py-3 text-left text-white font-bold">Loại che phủ</th>
                              <th className="border border-green-500/30 px-4 py-3 text-center text-white font-bold">HSG A</th>
                              <th className="border border-green-500/30 px-4 py-3 text-center text-white font-bold">HSG B</th>
                              <th className="border border-green-500/30 px-4 py-3 text-center text-white font-bold">HSG C</th>
                              <th className="border border-green-500/30 px-4 py-3 text-center text-white font-bold">HSG D</th>
                            </tr>
                          </thead>
                          <tbody>
                            {[
                              { type: 'Mặt nước (Lakes, ponds)', a: 100, b: 100, c: 100, d: 100 },
                              { type: 'Bê tông / Asphalt', a: 98, b: 98, c: 98, d: 98 },
                              { type: 'Khu dân cư mật độ cao', a: 77, b: 85, c: 90, d: 92 },
                              { type: 'Khu dân cư mật độ trung bình', a: 61, b: 75, c: 83, d: 87 },
                              { type: 'Khu dân cư mật độ thấp', a: 54, b: 70, c: 80, d: 85 },
                              { type: 'Đất trồng (straight row)', a: 72, b: 81, c: 88, d: 91 },
                              { type: 'Đất trồng (contoured)', a: 67, b: 78, c: 85, d: 89 },
                              { type: 'Đồng cỏ (Good condition)', a: 39, b: 61, c: 74, d: 80 },
                              { type: 'Đồng cỏ (Poor condition)', a: 68, b: 79, c: 86, d: 89 },
                              { type: 'Rừng (Good condition)', a: 30, b: 55, c: 70, d: 77 },
                              { type: 'Rừng (Poor condition)', a: 45, b: 66, c: 77, d: 83 }
                            ].map((row, idx) => (
                              <tr key={idx} className="hover:bg-white/5">
                                <td className="border border-white/10 px-4 py-2 text-white">{row.type}</td>
                                <td className="border border-white/10 px-4 py-2 text-center text-green-300 font-bold">{row.a}</td>
                                <td className="border border-white/10 px-4 py-2 text-center text-yellow-300 font-bold">{row.b}</td>
                                <td className="border border-white/10 px-4 py-2 text-center text-orange-300 font-bold">{row.c}</td>
                                <td className="border border-white/10 px-4 py-2 text-center text-red-300 font-bold">{row.d}</td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                      <div className="mt-3 p-3 bg-blue-500/10 rounded border border-blue-500/30">
                        <p className="text-xs text-blue-200">
                          <strong>HSG</strong> = Hydrologic Soil Group:
                          <strong className="text-green-300 ml-2">A</strong> = Thấm cao (cát),
                          <strong className="text-yellow-300 ml-2">B</strong> = Thấm trung bình,
                          <strong className="text-orange-300 ml-2">C</strong> = Thấm thấp,
                          <strong className="text-red-300 ml-2">D</strong> = Thấm rất thấp (sét)
                        </p>
                      </div>
                    </div>

                    {/* Python Code */}
                    <div className="bg-gradient-to-br from-gray-900 to-gray-800 rounded-xl p-5 shadow-lg border border-gray-700">
                      <div className="flex items-center gap-2 mb-3">
                        <div className="flex gap-1.5">
                          <div className="w-3 h-3 rounded-full bg-red-500"></div>
                          <div className="w-3 h-3 rounded-full bg-yellow-500"></div>
                          <div className="w-3 h-3 rounded-full bg-green-500"></div>
                        </div>
                        <span className="text-xs font-mono text-gray-400 ml-2">scs_curve_number.py</span>
                      </div>
                      <pre className="text-sm overflow-x-auto font-mono leading-relaxed">
<span className="text-purple-400">def</span> <span className="text-blue-400">scs_runoff</span><span className="text-gray-300">(</span><span className="text-orange-300">P</span><span className="text-gray-300">, </span><span className="text-orange-300">CN</span><span className="text-gray-300">):</span>
    <span className="text-gray-500">"""
    SCS Curve Number Method

    Parameters:
    - P: Rainfall depth (inches or mm)
    - CN: Curve Number (30-100)

    Returns:
    - Q: Runoff depth (same units as P)
    """</span>
    <span className="text-gray-500"># Calculate potential maximum retention</span>
    <span className="text-orange-300">S</span> <span className="text-gray-300">= (</span><span className="text-green-400">1000</span> <span className="text-gray-300">/</span> <span className="text-orange-300">CN</span><span className="text-gray-300">) - </span><span className="text-green-400">10</span>

    <span className="text-gray-500"># Initial abstraction (typically 0.2S)</span>
    <span className="text-orange-300">Ia</span> <span className="text-gray-300">= </span><span className="text-green-400">0.2</span> <span className="text-gray-300">*</span> <span className="text-orange-300">S</span>

    <span className="text-gray-500"># Calculate runoff (only if P &gt; Ia)</span>
    <span className="text-purple-400">if</span> <span className="text-orange-300">P</span> <span className="text-gray-300">&lt;= </span><span className="text-orange-300">Ia</span><span className="text-gray-300">:</span>
        <span className="text-purple-400">return</span> <span className="text-green-400">0</span>

    <span className="text-orange-300">Q</span> <span className="text-gray-300">= ((</span><span className="text-orange-300">P</span> <span className="text-gray-300">-</span> <span className="text-orange-300">Ia</span><span className="text-gray-300">)</span> <span className="text-gray-300">**</span> <span className="text-green-400">2</span><span className="text-gray-300">) / (</span><span className="text-orange-300">P</span> <span className="text-gray-300">-</span> <span className="text-orange-300">Ia</span> <span className="text-gray-300">+</span> <span className="text-orange-300">S</span><span className="text-gray-300">)</span>
    <span className="text-purple-400">return</span> <span className="text-orange-300">Q</span>

<span className="text-gray-500"># Example: Urban medium density residential, Soil Group B</span>
<span className="text-orange-300">P</span> <span className="text-gray-300">= </span><span className="text-green-400">5.0</span>   <span className="text-gray-500"># inches rainfall</span>
<span className="text-orange-300">CN</span> <span className="text-gray-300">= </span><span className="text-green-400">75</span>    <span className="text-gray-500"># From table above</span>

<span className="text-orange-300">runoff</span> <span className="text-gray-300">= </span><span className="text-blue-400">scs_runoff</span><span className="text-gray-300">(</span><span className="text-orange-300">P</span><span className="text-gray-300">, </span><span className="text-orange-300">CN</span><span className="text-gray-300">)</span>
<span className="text-blue-400">print</span><span className="text-gray-300">(</span><span className="text-green-300">{`f"Runoff: {runoff:.2f} inches"`}</span><span className="text-gray-300">)</span>
                      </pre>
                    </div>

                    {/* Notes */}
                    <div className="mt-6 p-5 bg-yellow-500/10 rounded-xl border border-yellow-500/30">
                      <h4 className="text-yellow-300 font-bold mb-3">📚 Nguồn tham khảo:</h4>
                      <ul className="text-sm text-yellow-100 space-y-2 ml-6 list-disc">
                        <li>USDA Natural Resources Conservation Service (NRCS)</li>
                        <li>HEC-RAS Technical Reference Manual</li>
                        <li>CN values phụ thuộc vào: loại đất, che phủ, điều kiện ẩm tiền kỳ (AMC)</li>
                        <li>Áp dụng rộng rãi cho mọi kích thước lưu vực</li>
                      </ul>
                    </div>
                  </div>
                </div>
              </motion.div>
            )}

            {/* MANNING EQUATION */}
            {activeTab === 'manning' && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="space-y-6"
              >
                <div className="rounded-2xl overflow-hidden bg-gradient-to-br from-purple-500/10 to-pink-500/10 border border-purple-500/30">
                  <div className="p-6 bg-gradient-to-r from-purple-600/20 to-pink-600/20 border-b border-purple-500/20">
                    <h3 className="text-2xl font-bold text-white mb-2">Manning's Equation</h3>
                    <p className="text-sm text-gray-300">Công thức tính vận tốc dòng chảy trong kênh hở</p>
                  </div>

                  <div className="p-6">
                    {/* Main Equations */}
                    <div className="mb-6 space-y-4">
                      <div className="p-6 bg-gradient-to-br from-purple-900/30 to-pink-900/30 rounded-xl border-2 border-purple-400/40">
                        <h4 className="text-lg font-bold text-purple-300 mb-4">Hệ đơn vị SI (Metric):</h4>
                        <div className="p-4 bg-black/20 rounded-lg border border-purple-400/30 mb-4">
                          <p className="text-3xl font-bold text-purple-300 font-mono text-center">V = (1/n) × R<sup>2/3</sup> × S<sup>1/2</sup></p>
                        </div>
                        <h4 className="text-lg font-bold text-purple-300 mb-4 mt-6">Hệ đơn vị Imperial (US):</h4>
                        <div className="p-4 bg-black/20 rounded-lg border border-purple-400/30">
                          <p className="text-3xl font-bold text-purple-300 font-mono text-center">V = (1.486/n) × R<sup>2/3</sup> × S<sup>1/2</sup></p>
                        </div>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="p-4 bg-white/5 rounded-lg border border-white/10">
                          <div className="text-purple-400 font-bold mb-2">V = Velocity (m/s or ft/s)</div>
                          <div className="text-gray-300 text-sm">Vận tốc dòng chảy</div>
                        </div>
                        <div className="p-4 bg-white/5 rounded-lg border border-white/10">
                          <div className="text-purple-400 font-bold mb-2">n = Manning's roughness coefficient</div>
                          <div className="text-gray-300 text-sm">Hệ số nhám Manning</div>
                        </div>
                        <div className="p-4 bg-white/5 rounded-lg border border-white/10">
                          <div className="text-purple-400 font-bold mb-2">R = Hydraulic radius (m or ft)</div>
                          <div className="text-gray-300 text-sm">Bán kính thủy lực = A/P</div>
                        </div>
                        <div className="p-4 bg-white/5 rounded-lg border border-white/10">
                          <div className="text-purple-400 font-bold mb-2">S = Slope (m/m or ft/ft)</div>
                          <div className="text-gray-300 text-sm">Độ dốc đáy kênh</div>
                        </div>
                      </div>
                    </div>

                    {/* Manning's n values */}
                    <div className="mb-6">
                      <h4 className="text-xl font-bold text-white mb-4">Hệ Số Nhám Manning (n)</h4>
                      <div className="grid gap-3">
                        {[
                          { type: 'Kênh bê tông trơn', value: '0.011 - 0.013', color: 'from-blue-500/20 to-cyan-500/20', border: 'blue-500/30' },
                          { type: 'Kênh bê tông thường', value: '0.013 - 0.017', color: 'from-cyan-500/20 to-teal-500/20', border: 'cyan-500/30' },
                          { type: 'Lòng sông đá trơn', value: '0.025 - 0.035', color: 'from-teal-500/20 to-green-500/20', border: 'teal-500/30' },
                          { type: 'Lòng sông tự nhiên sạch', value: '0.030 - 0.040', color: 'from-green-500/20 to-lime-500/20', border: 'green-500/30' },
                          { type: 'Lòng sông có cỏ nhỏ', value: '0.035 - 0.050', color: 'from-lime-500/20 to-yellow-500/20', border: 'lime-500/30' },
                          { type: 'Lòng sông có cây cỏ dày', value: '0.045 - 0.070', color: 'from-yellow-500/20 to-orange-500/20', border: 'yellow-500/30' },
                          { type: 'Lòng sông có đá và cây', value: '0.050 - 0.080', color: 'from-orange-500/20 to-red-500/20', border: 'orange-500/30' },
                          { type: 'Kênh đất không có cỏ', value: '0.020 - 0.030', color: 'from-purple-500/20 to-pink-500/20', border: 'purple-500/30' },
                          { type: 'Kênh đất có cỏ thưa', value: '0.030 - 0.040', color: 'from-pink-500/20 to-rose-500/20', border: 'pink-500/30' },
                          { type: 'Kênh có cây bụi dày', value: '0.100 - 0.200', color: 'from-red-500/20 to-red-600/20', border: 'red-500/30' }
                        ].map((item, idx) => (
                          <motion.div
                            key={idx}
                            initial={{ opacity: 0, x: -20 }}
                            animate={{ opacity: 1, x: 0 }}
                            transition={{ delay: idx * 0.04 }}
                            className={`p-4 bg-gradient-to-r ${item.color} rounded-lg border border-${item.border} hover:scale-[1.02] transition-all duration-300`}
                          >
                            <div className="flex justify-between items-center">
                              <span className="text-white font-semibold">{item.type}</span>
                              <span className="text-white font-bold font-mono text-lg bg-black/30 px-3 py-1 rounded">{item.value}</span>
                            </div>
                          </motion.div>
                        ))}
                      </div>
                    </div>

                    {/* Python Code */}
                    <div className="bg-gradient-to-br from-gray-900 to-gray-800 rounded-xl p-5 shadow-lg border border-gray-700">
                      <div className="flex items-center gap-2 mb-3">
                        <div className="flex gap-1.5">
                          <div className="w-3 h-3 rounded-full bg-red-500"></div>
                          <div className="w-3 h-3 rounded-full bg-yellow-500"></div>
                          <div className="w-3 h-3 rounded-full bg-green-500"></div>
                        </div>
                        <span className="text-xs font-mono text-gray-400 ml-2">manning_equation.py</span>
                      </div>
                      <pre className="text-sm overflow-x-auto font-mono leading-relaxed">
<span className="text-purple-400">import</span> <span className="text-orange-300">math</span>

<span className="text-purple-400">def</span> <span className="text-blue-400">manning_velocity</span><span className="text-gray-300">(</span><span className="text-orange-300">n</span><span className="text-gray-300">, </span><span className="text-orange-300">R</span><span className="text-gray-300">, </span><span className="text-orange-300">S</span><span className="text-gray-300">, </span><span className="text-orange-300">unit</span><span className="text-gray-300">=</span><span className="text-green-300">'SI'</span><span className="text-gray-300">):</span>
    <span className="text-gray-500">"""
    Manning's Equation for open channel flow

    Parameters:
    - n: Manning's roughness coefficient
    - R: Hydraulic radius (m or ft)
    - S: Channel slope (m/m or ft/ft)
    - unit: 'SI' for metric, 'Imperial' for US units

    Returns:
    - V: Velocity (m/s or ft/s)
    """</span>
    <span className="text-purple-400">if</span> <span className="text-orange-300">unit</span> <span className="text-gray-300">==</span> <span className="text-green-300">'SI'</span><span className="text-gray-300">:</span>
        <span className="text-orange-300">k</span> <span className="text-gray-300">= </span><span className="text-green-400">1.0</span>
    <span className="text-purple-400">else</span><span className="text-gray-300">:</span>
        <span className="text-orange-300">k</span> <span className="text-gray-300">= </span><span className="text-green-400">1.486</span>  <span className="text-gray-500"># Imperial units</span>

    <span className="text-orange-300">V</span> <span className="text-gray-300">= (</span><span className="text-orange-300">k</span> <span className="text-gray-300">/</span> <span className="text-orange-300">n</span><span className="text-gray-300">) *</span> <span className="text-gray-300">(</span><span className="text-orange-300">R</span> <span className="text-gray-300">**</span> <span className="text-gray-300">(</span><span className="text-green-400">2</span><span className="text-gray-300">/</span><span className="text-green-400">3</span><span className="text-gray-300">))</span> <span className="text-gray-300">*</span> <span className="text-orange-300">math</span><span className="text-gray-300">.</span><span className="text-blue-400">sqrt</span><span className="text-gray-300">(</span><span className="text-orange-300">S</span><span className="text-gray-300">)</span>
    <span className="text-purple-400">return</span> <span className="text-orange-300">V</span>

<span className="text-gray-500"># Example: Natural clean stream channel</span>
<span className="text-orange-300">n</span> <span className="text-gray-300">= </span><span className="text-green-400">0.035</span>    <span className="text-gray-500"># Manning's n</span>
<span className="text-orange-300">R</span> <span className="text-gray-300">= </span><span className="text-green-400">2.5</span>      <span className="text-gray-500"># Hydraulic radius (m)</span>
<span className="text-orange-300">S</span> <span className="text-gray-300">= </span><span className="text-green-400">0.001</span>    <span className="text-gray-500"># Channel slope (0.1%)</span>

<span className="text-orange-300">velocity</span> <span className="text-gray-300">= </span><span className="text-blue-400">manning_velocity</span><span className="text-gray-300">(</span><span className="text-orange-300">n</span><span className="text-gray-300">, </span><span className="text-orange-300">R</span><span className="text-gray-300">, </span><span className="text-orange-300">S</span><span className="text-gray-300">, </span><span className="text-green-300">'SI'</span><span className="text-gray-300">)</span>
<span className="text-orange-300">discharge</span> <span className="text-gray-300">= </span><span className="text-orange-300">velocity</span> <span className="text-gray-300">*</span> <span className="text-orange-300">area</span>  <span className="text-gray-500"># Q = V * A</span>

<span className="text-blue-400">print</span><span className="text-gray-300">(</span><span className="text-green-300">{`f"Velocity: {velocity:.2f} m/s"`}</span><span className="text-gray-300">)</span>
                      </pre>
                    </div>

                    {/* Notes */}
                    <div className="mt-6 p-5 bg-yellow-500/10 rounded-xl border border-yellow-500/30">
                      <h4 className="text-yellow-300 font-bold mb-3">⚠️ Lưu ý:</h4>
                      <ul className="text-sm text-yellow-100 space-y-2 ml-6 list-disc">
                        <li>Áp dụng cho dòng chảy đều (uniform flow) trong kênh hở</li>
                        <li>Hệ số nhám n phụ thuộc vào vật liệu lòng kênh, thảm thực vật</li>
                        <li>Bán kính thủy lực R = A/P (diện tích / chu vi ướt)</li>
                        <li>Sử dụng rộng rãi trong thiết kế kênh thoát nước, sông</li>
                      </ul>
                    </div>
                  </div>
                </div>
              </motion.div>
            )}

            {/* MUSKINGUM ROUTING */}
            {activeTab === 'muskingum' && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="space-y-6"
              >
                <div className="rounded-2xl overflow-hidden bg-gradient-to-br from-orange-500/10 to-red-500/10 border border-orange-500/30">
                  <div className="p-6 bg-gradient-to-r from-orange-600/20 to-red-600/20 border-b border-orange-500/20">
                    <h3 className="text-2xl font-bold text-white mb-2">Muskingum Routing Method</h3>
                    <p className="text-sm text-gray-300">Phương pháp truyền lũ trong sông (Flood routing)</p>
                  </div>

                  <div className="p-6">
                    {/* Main Equations */}
                    <div className="mb-6 space-y-4">
                      <div className="p-6 bg-gradient-to-br from-orange-900/30 to-red-900/30 rounded-xl border-2 border-orange-400/40">
                        <h4 className="text-lg font-bold text-orange-300 mb-4">Phương trình chính:</h4>
                        <div className="space-y-4">
                          <div className="p-4 bg-black/20 rounded-lg border border-orange-400/30">
                            <p className="text-2xl font-bold text-orange-300 font-mono text-center">O₂ = C₁I₂ + C₂I₁ + C₃O₁</p>
                          </div>
                          <div className="text-sm text-gray-300 text-center">Trong đó:</div>
                          <div className="grid grid-cols-3 gap-3">
                            <div className="p-3 bg-black/20 rounded border border-orange-400/30">
                              <p className="text-lg font-bold text-orange-300 font-mono text-center">C₁ = (Δt - 2KX) / D</p>
                            </div>
                            <div className="p-3 bg-black/20 rounded border border-orange-400/30">
                              <p className="text-lg font-bold text-orange-300 font-mono text-center">C₂ = (Δt + 2KX) / D</p>
                            </div>
                            <div className="p-3 bg-black/20 rounded border border-orange-400/30">
                              <p className="text-lg font-bold text-orange-300 font-mono text-center">C₃ = (2K(1-X) - Δt) / D</p>
                            </div>
                          </div>
                          <div className="p-4 bg-black/20 rounded-lg border border-orange-400/30">
                            <p className="text-2xl font-bold text-orange-300 font-mono text-center">D = 2K(1-X) + Δt</p>
                          </div>
                        </div>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="p-4 bg-white/5 rounded-lg border border-white/10">
                          <div className="text-orange-400 font-bold mb-2">O₁, O₂ = Outflow tại thời điểm 1, 2</div>
                          <div className="text-gray-300 text-sm">Lưu lượng ra tại 2 thời điểm</div>
                        </div>
                        <div className="p-4 bg-white/5 rounded-lg border border-white/10">
                          <div className="text-orange-400 font-bold mb-2">I₁, I₂ = Inflow tại thời điểm 1, 2</div>
                          <div className="text-gray-300 text-sm">Lưu lượng vào tại 2 thời điểm</div>
                        </div>
                        <div className="p-4 bg-white/5 rounded-lg border border-white/10">
                          <div className="text-orange-400 font-bold mb-2">K = Storage coefficient (hours)</div>
                          <div className="text-gray-300 text-sm">Hệ số lưu trữ (thời gian truyền sóng)</div>
                        </div>
                        <div className="p-4 bg-white/5 rounded-lg border border-white/10">
                          <div className="text-orange-400 font-bold mb-2">X = Weighting factor (0-0.5)</div>
                          <div className="text-gray-300 text-sm">Hệ số trọng số (X=0: hồ chứa, X=0.5: sóng động lực)</div>
                        </div>
                      </div>
                    </div>

                    {/* Parameter Guidelines */}
                    <div className="mb-6">
                      <h4 className="text-xl font-bold text-white mb-4">Giá trị K và X điển hình</h4>
                      <div className="grid gap-3">
                        <div className="p-4 bg-gradient-to-r from-green-500/20 to-emerald-500/20 rounded-lg border border-green-500/30">
                          <div className="flex justify-between items-center mb-2">
                            <span className="text-white font-bold">Hồ chứa (Reservoir)</span>
                            <span className="text-green-300 font-bold font-mono">X = 0.0</span>
                          </div>
                          <p className="text-sm text-gray-300">K = thời gian lưu nước trong hồ (vài giờ đến vài ngày)</p>
                        </div>
                        <div className="p-4 bg-gradient-to-r from-blue-500/20 to-cyan-500/20 rounded-lg border border-blue-500/30">
                          <div className="flex justify-between items-center mb-2">
                            <span className="text-white font-bold">Sông tự nhiên (Natural streams)</span>
                            <span className="text-cyan-300 font-bold font-mono">X = 0.2 - 0.3</span>
                          </div>
                          <p className="text-sm text-gray-300">K = 0.5 - 2.0 lần thời gian truyền đỉnh lũ</p>
                        </div>
                        <div className="p-4 bg-gradient-to-r from-purple-500/20 to-pink-500/20 rounded-lg border border-purple-500/30">
                          <div className="flex justify-between items-center mb-2">
                            <span className="text-white font-bold">Dòng chảy động lực (Kinematic wave)</span>
                            <span className="text-pink-300 font-bold font-mono">X = 0.5</span>
                          </div>
                          <p className="text-sm text-gray-300">K = thời gian truyền sóng qua đoạn sông</p>
                        </div>
                      </div>
                    </div>

                    {/* Stability Condition */}
                    <div className="mb-6 p-5 bg-red-500/10 rounded-xl border border-red-500/30">
                      <h4 className="text-red-300 font-bold mb-3">⚠️ Điều kiện ổn định:</h4>
                      <div className="space-y-2 text-sm text-red-100">
                        <div className="flex items-center gap-2">
                          <span className="font-mono bg-black/30 px-3 py-1 rounded">C₁ + C₂ + C₃ = 1.0</span>
                          <span>(Bảo toàn khối lượng)</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <span className="font-mono bg-black/30 px-3 py-1 rounded">C₁, C₂, C₃ ≥ 0</span>
                          <span>(Các hệ số phải dương)</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <span className="font-mono bg-black/30 px-3 py-1 rounded">Δt ≤ 2K(1-X)</span>
                          <span>(Giới hạn bước thời gian)</span>
                        </div>
                      </div>
                    </div>

                    {/* Python Code */}
                    <div className="bg-gradient-to-br from-gray-900 to-gray-800 rounded-xl p-5 shadow-lg border border-gray-700">
                      <div className="flex items-center gap-2 mb-3">
                        <div className="flex gap-1.5">
                          <div className="w-3 h-3 rounded-full bg-red-500"></div>
                          <div className="w-3 h-3 rounded-full bg-yellow-500"></div>
                          <div className="w-3 h-3 rounded-full bg-green-500"></div>
                        </div>
                        <span className="text-xs font-mono text-gray-400 ml-2">muskingum_routing.py</span>
                      </div>
                      <pre className="text-sm overflow-x-auto font-mono leading-relaxed">
<span className="text-purple-400">def</span> <span className="text-blue-400">muskingum_routing</span><span className="text-gray-300">(</span><span className="text-orange-300">inflow</span><span className="text-gray-300">, </span><span className="text-orange-300">K</span><span className="text-gray-300">, </span><span className="text-orange-300">X</span><span className="text-gray-300">, </span><span className="text-orange-300">dt</span><span className="text-gray-300">):</span>
    <span className="text-gray-500">"""
    Muskingum Flood Routing

    Parameters:
    - inflow: List of inflow values (m³/s)
    - K: Storage coefficient (hours)
    - X: Weighting factor (0-0.5)
    - dt: Time step (hours)

    Returns:
    - outflow: List of outflow values (m³/s)
    """</span>
    <span className="text-gray-500"># Calculate routing coefficients</span>
    <span className="text-orange-300">D</span> <span className="text-gray-300">= </span><span className="text-green-400">2</span> <span className="text-gray-300">*</span> <span className="text-orange-300">K</span> <span className="text-gray-300">* (</span><span className="text-green-400">1</span> <span className="text-gray-300">-</span> <span className="text-orange-300">X</span><span className="text-gray-300">) +</span> <span className="text-orange-300">dt</span>
    <span className="text-orange-300">C1</span> <span className="text-gray-300">= (</span><span className="text-orange-300">dt</span> <span className="text-gray-300">-</span> <span className="text-green-400">2</span> <span className="text-gray-300">*</span> <span className="text-orange-300">K</span> <span className="text-gray-300">*</span> <span className="text-orange-300">X</span><span className="text-gray-300">) /</span> <span className="text-orange-300">D</span>
    <span className="text-orange-300">C2</span> <span className="text-gray-300">= (</span><span className="text-orange-300">dt</span> <span className="text-gray-300">+</span> <span className="text-green-400">2</span> <span className="text-gray-300">*</span> <span className="text-orange-300">K</span> <span className="text-gray-300">*</span> <span className="text-orange-300">X</span><span className="text-gray-300">) /</span> <span className="text-orange-300">D</span>
    <span className="text-orange-300">C3</span> <span className="text-gray-300">= (</span><span className="text-green-400">2</span> <span className="text-gray-300">*</span> <span className="text-orange-300">K</span> <span className="text-gray-300">* (</span><span className="text-green-400">1</span> <span className="text-gray-300">-</span> <span className="text-orange-300">X</span><span className="text-gray-300">) -</span> <span className="text-orange-300">dt</span><span className="text-gray-300">) /</span> <span className="text-orange-300">D</span>

    <span className="text-gray-500"># Check stability</span>
    <span className="text-purple-400">if</span> <span className="text-orange-300">C1</span> <span className="text-gray-300">&lt;</span> <span className="text-green-400">0</span> <span className="text-purple-400">or</span> <span className="text-orange-300">C2</span> <span className="text-gray-300">&lt;</span> <span className="text-green-400">0</span> <span className="text-purple-400">or</span> <span className="text-orange-300">C3</span> <span className="text-gray-300">&lt;</span> <span className="text-green-400">0</span><span className="text-gray-300">:</span>
        <span className="text-purple-400">raise</span> <span className="text-blue-400">ValueError</span><span className="text-gray-300">(</span><span className="text-green-300">"Unstable coefficients! Reduce dt or adjust K, X"</span><span className="text-gray-300">)</span>

    <span className="text-gray-500"># Route the flood</span>
    <span className="text-orange-300">outflow</span> <span className="text-gray-300">= [</span><span className="text-orange-300">inflow</span><span className="text-gray-300">[</span><span className="text-green-400">0</span><span className="text-gray-300">]]</span>
    <span className="text-purple-400">for</span> <span className="text-orange-300">i</span> <span className="text-purple-400">in</span> <span className="text-blue-400">range</span><span className="text-gray-300">(</span><span className="text-green-400">1</span><span className="text-gray-300">,</span> <span className="text-blue-400">len</span><span className="text-gray-300">(</span><span className="text-orange-300">inflow</span><span className="text-gray-300">)):</span>
        <span className="text-orange-300">O2</span> <span className="text-gray-300">= </span><span className="text-orange-300">C1</span> <span className="text-gray-300">*</span> <span className="text-orange-300">inflow</span><span className="text-gray-300">[</span><span className="text-orange-300">i</span><span className="text-gray-300">] +</span> <span className="text-orange-300">C2</span> <span className="text-gray-300">*</span> <span className="text-orange-300">inflow</span><span className="text-gray-300">[</span><span className="text-orange-300">i</span><span className="text-gray-300">-</span><span className="text-green-400">1</span><span className="text-gray-300">] +</span> <span className="text-orange-300">C3</span> <span className="text-gray-300">*</span> <span className="text-orange-300">outflow</span><span className="text-gray-300">[</span><span className="text-orange-300">i</span><span className="text-gray-300">-</span><span className="text-green-400">1</span><span className="text-gray-300">]</span>
        <span className="text-orange-300">outflow</span><span className="text-gray-300">.</span><span className="text-blue-400">append</span><span className="text-gray-300">(</span><span className="text-orange-300">O2</span><span className="text-gray-300">)</span>

    <span className="text-purple-400">return</span> <span className="text-orange-300">outflow</span>

<span className="text-gray-500"># Example: Natural stream routing</span>
<span className="text-orange-300">inflow_series</span> <span className="text-gray-300">= [</span><span className="text-green-400">100</span><span className="text-gray-300">,</span> <span className="text-green-400">150</span><span className="text-gray-300">,</span> <span className="text-green-400">250</span><span className="text-gray-300">,</span> <span className="text-green-400">400</span><span className="text-gray-300">,</span> <span className="text-green-400">500</span><span className="text-gray-300">,</span> <span className="text-green-400">450</span><span className="text-gray-300">,</span> <span className="text-green-400">350</span><span className="text-gray-300">,</span> <span className="text-green-400">250</span><span className="text-gray-300">,</span> <span className="text-green-400">150</span><span className="text-gray-300">,</span> <span className="text-green-400">100</span><span className="text-gray-300">]</span>
<span className="text-orange-300">K</span> <span className="text-gray-300">= </span><span className="text-green-400">12.0</span>   <span className="text-gray-500"># hours</span>
<span className="text-orange-300">X</span> <span className="text-gray-300">= </span><span className="text-green-400">0.25</span>  <span className="text-gray-500"># Natural stream</span>
<span className="text-orange-300">dt</span> <span className="text-gray-300">= </span><span className="text-green-400">6.0</span>   <span className="text-gray-500"># hours</span>

<span className="text-orange-300">outflow_series</span> <span className="text-gray-300">= </span><span className="text-blue-400">muskingum_routing</span><span className="text-gray-300">(</span><span className="text-orange-300">inflow_series</span><span className="text-gray-300">,</span> <span className="text-orange-300">K</span><span className="text-gray-300">,</span> <span className="text-orange-300">X</span><span className="text-gray-300">,</span> <span className="text-orange-300">dt</span><span className="text-gray-300">)</span>
<span className="text-blue-400">print</span><span className="text-gray-300">(</span><span className="text-green-300">{`f"Routed outflow: {outflow_series}"`}</span><span className="text-gray-300">)</span>
                      </pre>
                    </div>

                    {/* Notes */}
                    <div className="mt-6 p-5 bg-yellow-500/10 rounded-xl border border-yellow-500/30">
                      <h4 className="text-yellow-300 font-bold mb-3">📚 Ứng dụng:</h4>
                      <ul className="text-sm text-yellow-100 space-y-2 ml-6 list-disc">
                        <li>Truyền lũ qua đoạn sông để dự báo mực nước hạ lưu</li>
                        <li>Thiết kế hồ chứa điều tiết lũ</li>
                        <li>Đánh giá tác động của đập thủy điện đến dòng chảy hạ lưu</li>
                        <li>K và X thường được hiệu chỉnh từ dữ liệu thực đo</li>
                      </ul>
                    </div>
                  </div>
                </div>
              </motion.div>
            )}
          </div>

          {/* Footer - Data Sources */}
          <div className="px-8 py-4 bg-black/30 border-t border-white/10">
            <div className="text-xs text-gray-400 flex items-center gap-2 justify-center">
              <Info className="w-3 h-3" />
              <span>Nguồn: WSDOT Hydraulics Manual 2025, USDA NRCS, HEC-RAS Technical Reference, North Carolina DEMLR</span>
            </div>
          </div>
        </motion.div>
      </motion.div>

      <style jsx>{`
        .custom-scrollbar::-webkit-scrollbar {
          width: 8px;
        }
        .custom-scrollbar::-webkit-scrollbar-track {
          background: rgba(255, 255, 255, 0.05);
          border-radius: 4px;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb {
          background: rgba(255, 255, 255, 0.2);
          border-radius: 4px;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover {
          background: rgba(255, 255, 255, 0.3);
        }
      `}</style>
    </AnimatePresence>
  );
}
