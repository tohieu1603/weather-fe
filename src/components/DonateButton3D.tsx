'use client'

import { Heart } from 'lucide-react'

interface DonateButton3DProps {
  onClick: () => void
}

export default function DonateButton3D({ onClick }: DonateButton3DProps) {
  return (
    <button
      onClick={onClick}
      className="group relative p-2 bg-gradient-to-r from-pink-600 to-rose-600 hover:from-pink-500 hover:to-rose-500 rounded-lg shrink-0 transition-all duration-300 hover:scale-105 active:scale-95 hover:shadow-lg hover:shadow-pink-500/30"
      title="Ủng hộ dự án"
    >
      {/* Ping effect */}
      <span className="absolute inset-0 rounded-lg bg-pink-400 opacity-0 group-hover:opacity-30 group-hover:animate-ping" />

      {/* Icon */}
      <Heart className="relative w-4 h-4 text-white group-hover:scale-110 transition-transform duration-300" fill="currentColor" />
    </button>
  )
}
