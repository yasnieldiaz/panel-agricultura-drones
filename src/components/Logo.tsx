interface LogoProps {
  size?: 'sm' | 'md' | 'lg'
  showText?: boolean
}

export default function Logo({ size = 'md', showText = true }: LogoProps) {
  const sizes = {
    sm: 'w-8 h-8',
    md: 'w-10 h-10',
    lg: 'w-16 h-16'
  }

  const textSizes = {
    sm: 'text-base',
    md: 'text-xl',
    lg: 'text-2xl'
  }

  return (
    <div className="flex items-center gap-2">
      <img
        src="/logo.png"
        alt="Drone Service"
        className={`${sizes[size]} object-contain`}
      />
      {showText && (
        <span className={`font-bold gradient-text ${textSizes[size]}`}>
          Drone Service
        </span>
      )}
    </div>
  )
}
