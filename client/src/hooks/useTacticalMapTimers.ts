import { useState, useEffect, useCallback } from 'react'
import { DECAY_TIMES } from '@/lib/tactical-map-constants'
import { formatTime } from '@/lib/tactical-map-utils'

export const useLocationTimers = () => {
  const [timers, setTimers] = useState({})

  const addTimer = useCallback((locationId, timerData) => {
    setTimers(prev => ({
      ...prev,
      [locationId]: [...(prev[locationId] || []), timerData]
    }))
  }, [])

  const removeTimer = useCallback((timerId) => {
    setTimers(prev => {
      const newTimers = { ...prev }
      Object.keys(newTimers).forEach(locationId => {
        newTimers[locationId] = newTimers[locationId].filter(timer => timer.id !== timerId)
        if (newTimers[locationId].length === 0) {
          delete newTimers[locationId]
        }
      })
      return newTimers
    })
  }, [])

  const getDecayInfo = useCallback((tcData) => {
    if (!tcData?.material) return null
    
    const material = tcData.material.toLowerCase()
    const decayConfig = DECAY_TIMES[material]
    if (!decayConfig) return null

    const upkeep = parseInt(tcData.upkeep) || 0
    const decayHours = Math.min(upkeep / decayConfig.max, 1) * decayConfig.hours
    const decaySeconds = Math.floor(decayHours * 3600)

    return {
      hours: decayHours,
      seconds: decaySeconds,
      material,
      upkeep,
      formatted: formatTime(decaySeconds)
    }
  }, [])

  useEffect(() => {
    const interval = setInterval(() => {
      setTimers(prev => {
        const newTimers = { ...prev }
        let hasChanges = false

        Object.keys(newTimers).forEach(locationId => {
          const timersArray = newTimers[locationId]
          if (timersArray && timersArray.length > 0) {
            const updatedTimers = timersArray.map(timer => {
              if (timer.remaining > 0) {
                hasChanges = true
                return { ...timer, remaining: timer.remaining - 1 }
              } else if (timer.remaining === 0 && timer.onComplete) {
                timer.onComplete()
                return null
              }
              return timer
            }).filter(timer => timer !== null && timer.remaining > 0)
            
            if (updatedTimers.length !== timersArray.length) {
              hasChanges = true
            }
            
            if (updatedTimers.length === 0) {
              delete newTimers[locationId]
            } else {
              newTimers[locationId] = updatedTimers
            }
          }
        })

        return hasChanges ? newTimers : prev
      })
    }, 1000)

    return () => clearInterval(interval)
  }, [])

  return {
    timers,
    addTimer,
    removeTimer,
    getDecayInfo
  }
}