import React from 'react'
import { getActiveKits } from '@/lib/icons'

interface KitNeedsDisplayProps {
  kitResources: any
  size?: 'xs' | 'sm' | 'md'
  className?: string
}

/**
 * Dynamic display component that shows PNG icons with quantities for active kit requests
 * Only renders icons for kit types that have numbers entered
 * Designed as an "invisible container" that provides quick visual reference
 */
export function KitNeedsDisplay({ kitResources, size = 'xs', className = '' }: KitNeedsDisplayProps) {
  const activeKits = getActiveKits(kitResources)
  
  if (activeKits.length === 0) return null
  
  const sizeClasses = {
    xs: 'w-2 h-2',
    sm: 'w-4 h-4', 
    md: 'w-5 h-5'
  }
  
  const textSizeClasses = {
    xs: 'text-[8px]',
    sm: 'text-sm',
    md: 'text-base'
  }
  
  return (
    <div className={`flex items-center gap-0 ${className}`}>
      {activeKits.map(({ kitType, amount, iconData }) => (
        <div key={kitType} className="flex items-center">
          {iconData.png ? (
            <img 
              src={iconData.png} 
              alt={iconData.alt}
              className={`${sizeClasses[size]} object-contain`}
            />
          ) : (
            <span className={`${textSizeClasses[size]}`}>{iconData.emoji}</span>
          )}
          <span className={`${textSizeClasses[size]} font-medium text-white leading-none`}>
            {amount}
          </span>
        </div>
      ))}
    </div>
  )
}

export default KitNeedsDisplay