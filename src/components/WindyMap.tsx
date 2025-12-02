'use client';

import { useMemo, useEffect, useState } from "react";
import Wave3DBanner from "./Wave3DBanner";

const focusArea = { lat: 15.8, lon: 112, zoom: 5.4 };

const buildWindySrc = (overlay: string) => {
  const target = new Date();
  const time = `${target.toISOString().slice(0, 13)}00`;

  return `https://embed.windy.com/embed2.html?lat=${focusArea.lat}&lon=${focusArea.lon}&zoom=${focusArea.zoom}&level=surface&overlay=${overlay}&product=ecmwf&menu=&message=true&type=map&location=coordinates&detail=false&detailLat=${focusArea.lat}&detailLon=${focusArea.lon}&metricWind=kt&metricTemp=C&calendar=now&pressure=true&lang=vi&time=${time}`;
};

interface WindyMapProps {
  onStationClick?: (station: any) => void;
  selectedStation?: any;
  hideNativeControls?: boolean;
  overlay?: string;
}

export default function WindyMap({ hideNativeControls = false, overlay: externalOverlay }: WindyMapProps) {
  const [overlay, setOverlay] = useState<string>(externalOverlay || "wind");

  // Sync overlay from parent
  useEffect(() => {
    if (externalOverlay && externalOverlay !== overlay) {
      setOverlay(externalOverlay);
    }
  }, [externalOverlay]);

  const windySrc = useMemo(() => buildWindySrc(overlay), [overlay]);

  return (
    <div
      className="relative overflow-hidden bg-slate-950 mt-2"
      style={{ minHeight: 'var(--app-height, 100dvh)' }}
    >
      <div className="pointer-events-none absolute inset-0">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_30%_30%,rgba(34,211,238,0.08),transparent_30%),radial-gradient(circle_at_70%_10%,rgba(14,165,233,0.07),transparent_25%)]" />
        <div className="absolute inset-x-0 top-0 h-32 bg-gradient-to-b from-white/10 via-transparent to-transparent blur-2xl" />
      </div>

      <div className="absolute inset-0">
        <iframe
          title="Windy weather map"
          className="h-full w-full"
          src={windySrc}
          allowFullScreen
        />
        <div className="pointer-events-none absolute inset-x-0 top-0 h-24 bg-gradient-to-b from-slate-950/60 via-transparent to-transparent" />
      </div>

      {/* Overlay to block Windy native controls when modal is open */}
      {hideNativeControls && (
        <div
          aria-hidden="true"
          className="absolute inset-0 z-20 pointer-events-auto"
        />
      )}

      {/* Banner chạy text Hoàng Sa Trường Sa */}
      <div
        className="pointer-events-none fixed left-1/2 z-40 w-[92vw] max-w-xl -translate-x-1/2 sm:w-[80vw]"
        style={{ top: 'calc(env(safe-area-inset-top, 0px) + 89px)' }}
      >
        <Wave3DBanner
          text="Hoàng Sa, Trường Sa là của Việt Nam"
          className="h-10 rounded-full ring-1 ring-cyan-400/30 shadow-lg shadow-cyan-500/30"
        />
      </div>

      <div className="pointer-events-none fixed inset-0 z-10 bg-gradient-to-t from-slate-950/60 via-transparent to-transparent" />
    </div>
  );
}
