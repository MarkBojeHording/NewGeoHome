import { useEffect } from 'react'

export const useBaseReportEvents = (setBaseReportData, setShowBaseReportModal) => {
  useEffect(() => {
    const handleBaseReportEvent = (event) => {
      const { baseId, baseName, baseCoords, baseType } = event.detail
      console.log('Received base report event:', { baseId, baseName, baseCoords, baseType })
      
      setBaseReportData({
        baseId,
        baseName,
        baseCoords,
        baseType
      })
      setShowBaseReportModal(true)
    }

    window.addEventListener('openBaseReport', handleBaseReportEvent)
    return () => window.removeEventListener('openBaseReport', handleBaseReportEvent)
  }, [setBaseReportData, setShowBaseReportModal])
}