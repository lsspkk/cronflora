interface DarkModeIconProps {
  isDark: boolean
  className?: string
}

export function DarkModeIcon({ isDark, className = 'w-5 h-5' }: DarkModeIconProps) {
  return (
    <div className={`${className} relative overflow-hidden rounded-full`}>
      {/* Left half - shows the face looking right */}
      <img
        src="/dark-white-mode.png"
        alt=""
        className="absolute h-full w-auto"
        style={{
          left: 0,
          filter: isDark ? 'invert(1)' : 'none',
        }}
      />
      {/* Right half - shows mirrored face looking left */}
      <img
        src="/dark-white-mode.png"
        alt=""
        className="absolute h-full w-auto"
        style={{
          right: 0,
          transform: 'scaleX(-1)',
          filter: isDark ? 'none' : 'invert(1)',
        }}
      />
    </div>
  )
}
