'use client';

import { useMemo, useState } from "react";
import { Wind, CloudRain, Thermometer, Waves, Gauge } from "lucide-react";

type OverlayOption = {
  id: string;
  title: string;
  hint: string;
};

type ModelOption = {
  id: string;
  label: string;
};

type PresetOption = {
  id: string;
  label: string;
  overlay: string;
  model?: string;
  level?: string;
  hourOffset?: number;
  icon: JSX.Element;
};

const focusArea = { lat: 15.8, lon: 112, zoom: 5.4 };

const overlays: OverlayOption[] = [
  { id: "wind", title: "Gió", hint: "Luồng gió + jet stream" },
  { id: "temp", title: "Nhiệt độ", hint: "Phân bố nhiệt bề mặt" },
  { id: "rain", title: "Mưa", hint: "Mây đối lưu & mưa" },
  { id: "clouds", title: "Mây", hint: "Mây cao + thấp" },
  { id: "waves", title: "Sóng", hint: "Chiều cao sóng biển" },
  { id: "pressure", title: "Áp suất", hint: "Isobar & xoáy" },
];

const models: ModelOption[] = [
  { id: "ecmwf", label: "ECMWF" },
  { id: "gfs", label: "GFS" },
];

const levels = [
  { id: "surface", label: "Mặt đất" },
  { id: "850h", label: "850 hPa" },
  { id: "700h", label: "700 hPa" },
];

const overlayTitleById = overlays.reduce<Record<string, string>>((acc, item) => {
  acc[item.id] = item.title;
  return acc;
}, {});

const presets: PresetOption[] = [
  {
    id: "wind-surface",
    label: "Gió bề mặt",
    overlay: "wind",
    model: "ecmwf",
    level: "surface",
    hourOffset: 0,
    icon: <Wind className="h-5 w-5" />,
  },
  {
    id: "rain-24h",
    label: "Mưa + mây",
    overlay: "rain",
    model: "gfs",
    level: "surface",
    hourOffset: 24,
    icon: <CloudRain className="h-5 w-5" />,
  },
  {
    id: "temp-surface",
    label: "Nhiệt độ bề mặt",
    overlay: "temp",
    model: "ecmwf",
    level: "surface",
    hourOffset: 0,
    icon: <Thermometer className="h-5 w-5" />,
  },
  {
    id: "pressure-jet",
    label: "Áp suất & xoáy",
    overlay: "pressure",
    model: "ecmwf",
    level: "850h",
    hourOffset: 0,
    icon: <Gauge className="h-5 w-5" />,
  },
  {
    id: "waves-sea",
    label: "Sóng biển",
    overlay: "waves",
    model: "gfs",
    level: "surface",
    hourOffset: 0,
    icon: <Waves className="h-5 w-5" />,
  },
];

const buildWindySrc = ({
  overlay,
  model,
  level,
  hourOffset,
}: {
  overlay: string;
  model: string;
  level: string;
  hourOffset: number;
}) => {
  const target = new Date();
  target.setHours(target.getHours() + hourOffset);
  const time = `${target.toISOString().slice(0, 13)}00`;

  return `https://embed.windy.com/embed2.html?lat=${focusArea.lat}&lon=${focusArea.lon}&zoom=${focusArea.zoom}&level=${level}&overlay=${overlay}&product=${model}&menu=&message=true&type=map&location=coordinates&detail=true&detailLat=${focusArea.lat}&detailLon=${focusArea.lon}&metricWind=kt&metricTemp=C&calendar=now&pressure=true&lang=vi&time=${time}`;
};

const Chip = ({
  active,
  label,
  hint,
  onClick,
}: {
  active: boolean;
  label: string;
  hint?: string;
  onClick: () => void;
}) => (
  <button
    onClick={onClick}
    className={`rounded-full px-4 py-2 text-sm transition-all ${
      active
        ? "bg-cyan-500 text-slate-950 shadow-lg shadow-cyan-500/30"
        : "bg-white/5 text-slate-200 hover:bg-white/10"
    }`}
    aria-pressed={active}
  >
    <span className="font-semibold">{label}</span>
    {hint ? <span className="ml-2 text-xs text-slate-300">{hint}</span> : null}
  </button>
);

interface WindyMapProps {
  onStationClick?: (station: any) => void; // kept for compatibility with parent
  selectedStation?: any;
}

export default function WindyMap(_props: WindyMapProps) {
  const [overlay, setOverlay] = useState<string>("wind");
  const [model, setModel] = useState<string>("ecmwf");
  const [level, setLevel] = useState<string>("surface");
  const [hourOffset, setHourOffset] = useState<number>(0);
  const [showControls, setShowControls] = useState<boolean>(false);
  const [showInfo, setShowInfo] = useState<boolean>(false);

  const windySrc = useMemo(
    () => buildWindySrc({ overlay, model, level, hourOffset }),
    [overlay, model, level, hourOffset]
  );

  const applyPreset = (preset: PresetOption) => {
    setOverlay(preset.overlay);
    if (preset.model) setModel(preset.model);
    if (preset.level) setLevel(preset.level);
    if (typeof preset.hourOffset === "number") setHourOffset(preset.hourOffset);
  };

  const isPresetActive = (preset: PresetOption) =>
    overlay === preset.overlay &&
    (!preset.model || model === preset.model) &&
    (!preset.level || level === preset.level) &&
    (preset.hourOffset === undefined || hourOffset === preset.hourOffset);

  return (
    <div className="relative min-h-screen overflow-hidden bg-slate-950">
      <div className="pointer-events-none absolute inset-0">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_30%_30%,rgba(34,211,238,0.08),transparent_30%),radial-gradient(circle_at_70%_10%,rgba(14,165,233,0.07),transparent_25%)]" />
        <div className="absolute inset-x-0 top-0 h-32 bg-gradient-to-b from-white/10 via-transparent to-transparent blur-2xl" />
      </div>

      <div className="absolute inset-0">
        <iframe
          title="Windy weather map"
          className="h-full w-full"
          src={windySrc}
          frameBorder="0"
          allowFullScreen
        />
        <div className="pointer-events-none absolute inset-x-0 top-0 h-24 bg-gradient-to-b from-slate-950/60 via-transparent to-transparent" />
      </div>

      <button
        type="button"
        onClick={() => setShowControls((v) => !v)}
        className="glass fixed left-3 z-40 rounded-full px-4 py-2 text-sm font-semibold text-slate-100 shadow-lg shadow-black/30 sm:left-5"
        style={{ top: "80px" }}
      >
        {showControls ? "Ẩn điều khiển" : "Hiện điều khiển"}
      </button>

      {/* Banner chạy text Hoàng Sa Trường Sa - đặt lên che khu vực logo Windy */}
      <div
        className="pointer-events-none fixed left-1/2 z-40 w-[80vw] max-w-xl -translate-x-1/2"
        style={{ top: "72px" }}
      >
        <div className="marquee-track rounded-full bg-slate-950/90 px-4 py-2 text-center text-sm font-semibold text-slate-100 ring-1 ring-white/10 backdrop-blur">
          <div className="marquee-rail">
            <span className="marquee-item">
              Hoàng Sa, Trường Sa là của Việt Nam · Hoàng Sa, Trường Sa là của Việt Nam · Hoàng Sa, Trường Sa là của Việt Nam
            </span>
            <span className="marquee-item" aria-hidden="true">
              Hoàng Sa, Trường Sa là của Việt Nam · Hoàng Sa, Trường Sa là của Việt Nam · Hoàng Sa, Trường Sa là của Việt Nam
            </span>
          </div>
        </div>
      </div>

      <div
        className="glass fixed right-4 z-30 flex w-[60px] flex-col items-center gap-2 rounded-2xl p-2 shadow-lg shadow-black/30 sm:right-3"
        style={{ top: "180px" }} // lùi xuống thêm ~100px so với vị trí trước
      >
        <div className="flex flex-col items-center gap-2">
          {presets.map((preset) => {
            const active = isPresetActive(preset);
            const overlayTitle = overlayTitleById[preset.overlay] ?? preset.overlay;
            return (
              <button
                key={preset.id}
                type="button"
                title={`${preset.label} · ${overlayTitle}`}
                aria-label={`${preset.label} · ${overlayTitle}`}
                onClick={() => applyPreset(preset)}
                className={`flex h-12 w-12 items-center justify-center rounded-xl border transition-all ${
                  active
                    ? "border-cyan-400/70 bg-cyan-500/20 text-slate-50 shadow-md shadow-cyan-500/30"
                    : "border-white/10 bg-white/5 text-slate-200 hover:border-white/40 hover:bg-white/10"
                }`}
              >
                {preset.icon}
              </button>
            );
          })}
        </div>
      </div>

      {showControls ? (
        <header className="glass fixed top-5 left-5 right-5 z-20 flex flex-col gap-4 rounded-3xl p-5 md:right-auto md:max-w-3xl">
          <div className="flex flex-col gap-2">
            <div className="flex flex-wrap items-center gap-3">
              <span className="rounded-full bg-cyan-500/20 px-3 py-1 text-xs font-semibold uppercase tracking-wide text-cyan-200">
                Thời tiết trực tiếp
              </span>
              <span className="rounded-full bg-white/5 px-3 py-1 text-xs text-slate-200">
                Biển Đông · Châu Á
              </span>
              <span className="text-xs text-slate-300">Map full screen</span>
              <button
                type="button"
                onClick={() => setShowInfo((v) => !v)}
                className="ml-auto rounded-full bg-white/10 px-3 py-1 text-xs font-semibold text-slate-100 hover:bg-white/20"
              >
                {showInfo ? "Ẩn mô tả" : "Hiện mô tả"}
              </button>
            </div>
            {showInfo ? (
              <>
                <h1 className="text-balance text-2xl font-semibold leading-tight text-slate-50 sm:text-3xl">
                  Bản đồ gió & thời tiết Next.js 16 cho Việt Nam và Biển Đông
                </h1>
                <p className="max-w-3xl text-sm text-slate-200">
                  Chọn lớp phủ (gió/mưa/nhiệt độ/mây/sóng/áp suất), mô hình ECMWF/GFS, độ cao và tua thời gian 0–72h. Ảnh động hiển thị toàn màn hình, tương tự windy.com.
                </p>
              </>
            ) : null}
          </div>

          <div className="flex flex-wrap gap-2">
            {models.map((m) => (
              <Chip key={m.id} active={model === m.id} label={m.label} onClick={() => setModel(m.id)} />
            ))}
          </div>

          <div className="flex flex-wrap gap-2">
            {overlays.map((item) => (
              <Chip
                key={item.id}
                active={overlay === item.id}
                label={item.title}
                hint={item.hint}
                onClick={() => setOverlay(item.id)}
              />
            ))}
          </div>

          <div className="flex flex-wrap gap-2">
            {levels.map((lvl) => (
              <Chip key={lvl.id} active={level === lvl.id} label={lvl.label} onClick={() => setLevel(lvl.id)} />
            ))}
          </div>

          <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex items-center gap-3 text-sm text-slate-200">
              <span className="rounded-full bg-cyan-500/20 px-3 py-1 font-semibold text-cyan-100">+{hourOffset}h</span>
              <p className="text-slate-300">Tua thời gian dự báo (0 – 72h)</p>
            </div>
            <input
              type="range"
              min={0}
              max={72}
              step={3}
              value={hourOffset}
              onChange={(e) => setHourOffset(Number(e.target.value))}
              className="h-2 w-full rounded-full bg-white/10 accent-cyan-400 sm:w-64"
            />
          </div>
        </header>
      ) : null}

      <div className="pointer-events-none fixed inset-0 z-10 bg-gradient-to-t from-slate-950/60 via-transparent to-transparent" />
    </div>
  );
}
