'use client'

interface Wave3DBannerProps {
  text: string
  className?: string
}

export default function Wave3DBanner({ text, className = '' }: Wave3DBannerProps) {
  return (
    <div className={`relative overflow-hidden bg-black ${className}`}>
      {/* Marquee Text */}
      <div className="flex items-center justify-center h-full">
        <div className="marquee-track w-full overflow-hidden">
          <div className="marquee-rail">
            <span className="marquee-item text-sm font-bold text-white whitespace-nowrap px-4">
              {text} · {text} · {text}
            </span>
            <span className="marquee-item text-sm font-bold text-white whitespace-nowrap px-4" aria-hidden="true">
              {text} · {text} · {text}
            </span>
          </div>
        </div>
      </div>
    </div>
  )
}
