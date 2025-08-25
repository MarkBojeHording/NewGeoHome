import { useState, useEffect } from 'react'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Checkbox } from '@/components/ui/checkbox'
import { Button } from '@/components/ui/button'
import { Progress } from '@/components/ui/progress'

interface ProgressionModalProps {
  isOpen: boolean
  onClose: () => void
}


// Calculate gene quality score like the gene calculator does
const calculateGeneQuality = (gene) => {
  const scoring = { 'G': 5, 'Y': 3, 'H': 1, 'W': -2, 'X': -2 }
  return gene.split('').reduce((score, letter) => score + (scoring[letter] || 0), 0)
}

// Find best gene for a plant type using same logic as gene calculator
const findBestGeneForPlant = (genesArray) => {
  if (!genesArray || genesArray.length === 0) return null
  
  let bestGene = genesArray[0]
  let bestScore = calculateGeneQuality(bestGene)
  let bestGYCount = bestGene.split('').filter(g => ['G', 'Y'].includes(g)).length
  
  genesArray.forEach(gene => {
    const score = calculateGeneQuality(gene)
    const gyCount = gene.split('').filter(g => ['G', 'Y'].includes(g)).length
    
    // Update best if this gene has a higher score, or same score but more G/Y genes
    if (score > bestScore || (score === bestScore && gyCount > bestGYCount)) {
      bestScore = score
      bestGene = gene
      bestGYCount = gyCount
    }
  })
  
  return bestGene
}

// Read from the actual gene data storage to get best genes and progress
const getGeneCalculatorData = () => {
  try {
    // Read the actual gene data
    const geneDataStored = localStorage.getItem('rustGeneCalculatorData')
    const progressStored = localStorage.getItem('rustGeneProgress')
    
    const result = {
      hemp: { bestGene: null, progress: 0 },
      blueberry: { bestGene: null, progress: 0 },
      yellowberry: { bestGene: null, progress: 0 },
      redberry: { bestGene: null, progress: 0 },
      pumpkin: { bestGene: null, progress: 0 }
    }
    
    // Get progress percentages
    if (progressStored) {
      const progressData = JSON.parse(progressStored)
      Object.keys(progressData).forEach(plantType => {
        if (result[plantType]) {
          result[plantType].progress = progressData[plantType] || 0
        }
      })
    }
    
    // Get actual best gene strings
    if (geneDataStored) {
      const geneData = JSON.parse(geneDataStored)
      const { plantGenes, currentPlant, genes } = geneData
      
      if (plantGenes) {
        Object.keys(plantGenes).forEach(plantType => {
          if (result[plantType]) {
            // Use genes array for current plant, plantGenes array for others
            const genesArray = (plantType === currentPlant) ? genes : plantGenes[plantType]
            const bestGene = findBestGeneForPlant(genesArray)
            result[plantType].bestGene = bestGene
          }
        })
      }
    }
    
    return result
  } catch (e) {
    console.error('Failed to read gene data:', e)
    return {
      hemp: { bestGene: null, progress: 0 },
      blueberry: { bestGene: null, progress: 0 },
      yellowberry: { bestGene: null, progress: 0 },
      redberry: { bestGene: null, progress: 0 },
      pumpkin: { bestGene: null, progress: 0 }
    }
  }
}

export function ProgressionModal({ isOpen, onClose }: ProgressionModalProps) {
  const [inGroupWeapon, setInGroupWeapon] = useState('')
  const [aloneWeapon, setAloneWeapon] = useState('')
  const [counteringWeapon, setCounteringWeapon] = useState('')
  const [displayOnMap, setDisplayOnMap] = useState(false)
  const [geneData, setGeneData] = useState<any>({})
  
  const weaponOptions = ['Spear', 'Bow', 'DB', 'P2', 'SAR', 'Tommy', 'MP-5', 'AK-47', 'M249']
  
  // Load gene data when modal opens and listen for localStorage changes
  useEffect(() => {
    if (!isOpen) return
    
    // Load initial data
    const initialData = getGeneCalculatorData()
    setGeneData(initialData)
    
    // Listen for localStorage changes from the gene calculator
    const handleStorageChange = (e) => {
      if (e.key === 'rustGeneProgress') {
        const newData = getGeneCalculatorData()
        setGeneData(newData)
      }
    }
    
    window.addEventListener('storage', handleStorageChange)
    return () => window.removeEventListener('storage', handleStorageChange)
  }, [isOpen])

  const plantIcons = {
    hemp: '🌿',
    blueberry: '🫐', 
    yellowberry: '🟡',
    redberry: '🔴',
    pumpkin: '🎃'
  }

  const plantNames = {
    hemp: 'Hemp',
    blueberry: 'Blueberry',
    yellowberry: 'Yellow Berry', 
    redberry: 'Red Berry',
    pumpkin: 'Pumpkin'
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-5xl max-h-[90vh] bg-gray-900 border-2 border-orange-500 text-orange-50 shadow-2xl shadow-orange-800/50">
        <DialogHeader className="border-b border-orange-600/50 pb-3">
          <DialogTitle className="text-orange-400 font-mono text-lg tracking-wider text-center">
            [PROGRESSION SYSTEM]
          </DialogTitle>
          <DialogDescription className="sr-only">
            Progression tracker for managing team kit levels during wipe day
          </DialogDescription>
        </DialogHeader>

        <div className="flex flex-col h-full p-4 gap-4">
          {/* Recommended Kit Level Container */}
          <div className="border-2 border-orange-500/50 p-4 bg-gray-800/50">
            <div className="flex items-center justify-center gap-4 mb-4">
              <h3 className="text-orange-400 font-mono text-lg tracking-wider">
                RECOMMENDED KIT LEVEL
              </h3>
              <div className="flex items-center gap-2">
                <Checkbox 
                  checked={displayOnMap} 
                  onCheckedChange={(checked) => setDisplayOnMap(checked === true)}
                  className="border-orange-500/50 data-[state=checked]:bg-orange-500"
                />
                <span className="text-orange-200 text-sm">Display on map</span>
              </div>
            </div>
            
            <div className="flex justify-center gap-8">
              <div className="flex flex-col items-center">
                <label className="text-orange-400 mb-2 font-mono">In a group</label>
                <Select value={inGroupWeapon} onValueChange={setInGroupWeapon}>
                  <SelectTrigger className="w-40 bg-gray-800 border-orange-500/50 text-orange-100">
                    <SelectValue placeholder="Select weapon" />
                  </SelectTrigger>
                  <SelectContent className="bg-gray-800 border-orange-500/50">
                    {weaponOptions.map((weapon) => (
                      <SelectItem key={weapon} value={weapon} className="text-orange-100 hover:bg-orange-500/20">
                        {weapon}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="flex flex-col items-center">
                <label className="text-orange-400 mb-2 font-mono">Alone</label>
                <Select value={aloneWeapon} onValueChange={setAloneWeapon}>
                  <SelectTrigger className="w-40 bg-gray-800 border-orange-500/50 text-orange-100">
                    <SelectValue placeholder="Select weapon" />
                  </SelectTrigger>
                  <SelectContent className="bg-gray-800 border-orange-500/50">
                    {weaponOptions.map((weapon) => (
                      <SelectItem key={weapon} value={weapon} className="text-orange-100 hover:bg-orange-500/20">
                        {weapon}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="flex flex-col items-center">
                <label className="text-orange-400 mb-2 font-mono">Countering</label>
                <Select value={counteringWeapon} onValueChange={setCounteringWeapon}>
                  <SelectTrigger className="w-40 bg-gray-800 border-orange-500/50 text-orange-100">
                    <SelectValue placeholder="Select weapon" />
                  </SelectTrigger>
                  <SelectContent className="bg-gray-800 border-orange-500/50">
                    {weaponOptions.map((weapon) => (
                      <SelectItem key={weapon} value={weapon} className="text-orange-100 hover:bg-orange-500/20">
                        {weapon}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>

          {/* Bottom Section with Left Container and Message Container */}
          <div className="flex gap-4 flex-1">
            {/* Gene Progress Container */}
            <div className="border-2 border-orange-500/50 p-2 bg-gray-800/50 w-48 flex-shrink-0">
              <h3 className="text-orange-400 font-mono text-sm tracking-wider mb-2 text-center">
                GENE PROGRESS
              </h3>
              <div className="space-y-1">
                {Object.keys(plantNames).map((plant) => {
                  const plantKey = plant as keyof typeof plantNames
                  const plantData = geneData[plantKey]
                  const bestGene = plantData?.bestGene
                  const progressPercent = plantData?.progress || 0
                  
                  return (
                    <div key={plant} className="space-y-0.5">
                      <div className="flex items-center gap-1">
                        <span className="text-xs">{plantIcons[plantKey]}</span>
                        <span className="text-orange-200 text-xs font-mono">{plantNames[plantKey]}</span>
                      </div>
                      
                      {/* Compact progress bar */}
                      <div className="flex items-center gap-1">
                        <div className="flex-1 bg-gray-700 rounded-full h-1.5 overflow-hidden">
                          <div 
                            className="h-full bg-green-500 transition-all duration-300"
                            style={{ width: `${progressPercent}%` }}
                          />
                        </div>
                        <span className="text-green-400 text-xs font-mono w-7 text-right">
                          {Math.round(progressPercent)}%
                        </span>
                      </div>
                      
                      {/* Compact best gene display */}
                      {bestGene ? (
                        <div className="flex items-center justify-center gap-1">
                          <div className="inline-flex gap-0.5 bg-gray-900/70 px-1 py-0.5 rounded">
                            {bestGene.split('').map((letter: string, i: number) => (
                              <span 
                                key={i}
                                className={`
                                  w-3 h-3 text-xs font-bold font-mono flex items-center justify-center rounded
                                  ${['G', 'Y'].includes(letter) ? 'bg-green-600 text-white' : 
                                    letter === 'H' ? 'bg-blue-600 text-white' : 'bg-red-600 text-white'}
                                `}
                              >
                                {letter}
                              </span>
                            ))}
                          </div>
                          <span className="text-gray-400 text-xs">{(bestGene.match(/[GY]/g) || []).length}/6</span>
                        </div>
                      ) : (
                        <div className="text-center">
                          <span className="text-gray-500 text-xs">No genes</span>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Message Container */}
            <div className="border-2 border-orange-500/50 p-6 bg-gray-800/50 flex-1 flex items-center justify-center">
              <div className="text-center max-w-3xl">
                <p className="text-4xl font-mono text-orange-400 leading-relaxed tracking-wide">
                  The progression system is a check the box progression tracker to help teams keep their wipe day from getting chaotic. This feature is still under construction.
                </p>
              </div>
            </div>
          </div>

          {/* Done Button */}
          <div className="flex justify-end">
            <Button 
              onClick={onClose}
              className="bg-orange-600 hover:bg-orange-700 text-white font-mono tracking-wider px-8 py-2"
            >
              [DONE]
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}