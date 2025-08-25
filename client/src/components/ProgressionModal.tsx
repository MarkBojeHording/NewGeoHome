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

interface GeneData {
  hemp: number
  blueberry: number
  yellowberry: number
  redberry: number
  pumpkin: number
}

interface PlantGenesData {
  [plantType: string]: string[]
}

interface BestGeneData {
  hemp: string | null
  blueberry: string | null
  yellowberry: string | null
  redberry: string | null
  pumpkin: string | null
}

// Gene storage utilities
const getGeneProgress = (): GeneData => {
  const stored = localStorage.getItem('rustGeneProgress')
  if (stored) {
    try {
      return JSON.parse(stored)
    } catch (e) {
      console.error('Failed to parse gene progress:', e)
    }
  }
  return {
    hemp: 0,
    blueberry: 0,
    yellowberry: 0,
    redberry: 0,
    pumpkin: 0
  }
}

// Get gene calculator data to find best genes
const getGeneCalculatorData = () => {
  const stored = localStorage.getItem('rustGeneCalculatorData')
  if (stored) {
    try {
      return JSON.parse(stored)
    } catch (e) {
      console.error('Failed to parse gene calculator data:', e)
    }
  }
  return null
}

// Calculate gene quality score
const calculateGeneQuality = (geneString: string): number => {
  const geneQualityScores = {
    'G': 3,  // Growth - highest priority
    'Y': 3,  // Yield - highest priority
    'H': 1,  // Hardiness - good but less valuable
    'W': -2, // Water consumption (bad)
    'X': -2  // Null/empty (bad)
  }
  return geneString.split('').reduce((score, gene) => score + (geneQualityScores[gene as keyof typeof geneQualityScores] || 0), 0)
}

// Find best gene for a plant
const findBestGeneForPlant = (genes: string[]): string | null => {
  if (!genes || genes.length === 0) return null
  
  let bestGene = genes[0]
  let bestScore = calculateGeneQuality(bestGene)
  let bestGYCount = bestGene.split('').filter(g => ['G', 'Y'].includes(g)).length
  
  genes.forEach(gene => {
    const score = calculateGeneQuality(gene)
    const gyCount = gene.split('').filter(g => ['G', 'Y'].includes(g)).length
    
    if (score > bestScore || (score === bestScore && gyCount > bestGYCount)) {
      bestScore = score
      bestGene = gene
      bestGYCount = gyCount
    }
  })
  
  return bestGene
}

// Get best genes for all plants
const getBestGenes = (): BestGeneData => {
  const calculatorData = getGeneCalculatorData()
  const result: BestGeneData = {
    hemp: null,
    blueberry: null,
    yellowberry: null,
    redberry: null,
    pumpkin: null
  }
  
  if (calculatorData && calculatorData.plantGenes) {
    Object.keys(result).forEach(plantType => {
      const genes = calculatorData.plantGenes[plantType]
      result[plantType as keyof BestGeneData] = findBestGeneForPlant(genes)
    })
  }
  
  return result
}

export function ProgressionModal({ isOpen, onClose }: ProgressionModalProps) {
  const [inGroupWeapon, setInGroupWeapon] = useState('')
  const [aloneWeapon, setAloneWeapon] = useState('')
  const [counteringWeapon, setCounteringWeapon] = useState('')
  const [displayOnMap, setDisplayOnMap] = useState(false)
  const [geneProgress, setGeneProgress] = useState<GeneData>(getGeneProgress)
  const [bestGenes, setBestGenes] = useState<BestGeneData>(getBestGenes)

  const weaponOptions = ['Spear', 'Bow', 'DB', 'P2', 'SAR', 'Tommy', 'MP-5', 'AK-47', 'M249']

  // Listen for gene progress and best gene updates
  useEffect(() => {
    const handleStorageChange = () => {
      setGeneProgress(getGeneProgress())
      setBestGenes(getBestGenes())
    }
    
    window.addEventListener('storage', handleStorageChange)
    // Also check periodically in case updates come from same tab
    const interval = setInterval(handleStorageChange, 1000)
    
    return () => {
      window.removeEventListener('storage', handleStorageChange)
      clearInterval(interval)
    }
  }, [])

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
            <div className="border-2 border-orange-500/50 p-3 bg-gray-800/50 w-56 flex-shrink-0">
              <h3 className="text-orange-400 font-mono text-base tracking-wider mb-3 text-center">
                GENE PROGRESS
              </h3>
              <div className="space-y-3">
                {(Object.keys(geneProgress) as Array<keyof GeneData>).map((plant) => {
                  // Debug logging
                  console.log(`${plant} progress:`, geneProgress[plant], 'best gene:', bestGenes[plant]);
                  
                  return (
                    <div key={plant} className="space-y-1">
                      <div className="flex items-center gap-2">
                        <span className="text-base">{plantIcons[plant]}</span>
                        <span className="text-orange-200 text-xs font-mono">{plantNames[plant]}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <Progress 
                          value={geneProgress[plant]} 
                          max={100}
                          className="flex-1 h-2"
                        />
                        <span className="text-orange-400 text-xs font-mono w-8 text-right">
                          {Math.round(geneProgress[plant])}%
                        </span>
                      </div>
                      <div className="text-center min-h-[16px]">
                        {bestGenes[plant] ? (
                          <div className="inline-flex gap-0.5 bg-gray-900/50 px-1 py-0.5 rounded border border-orange-500/30">
                            {bestGenes[plant]!.split('').map((gene, index) => (
                              <span 
                                key={index}
                                className={`
                                  w-3 h-3 text-xs font-bold font-mono flex items-center justify-center rounded
                                  ${['G', 'Y', 'H'].includes(gene) ? 'bg-green-600 text-white' : 'bg-red-600 text-white'}
                                `}
                              >
                                {gene}
                              </span>
                            ))}
                          </div>
                        ) : (
                          <span className="text-gray-500 text-xs font-mono">No genes</span>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
              
              {/* Debug info */}
              <div className="mt-3 pt-2 border-t border-orange-500/20">
                <div className="text-xs text-gray-400">
                  <div>Progress data: {JSON.stringify(geneProgress).length > 50 ? 'Found' : 'Empty'}</div>
                  <div>Calculator data: {getGeneCalculatorData() ? 'Found' : 'Missing'}</div>
                </div>
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