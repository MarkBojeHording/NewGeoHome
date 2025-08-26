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
const calculateGeneQuality = (gene: string): number => {
  const scoring: Record<string, number> = { 'G': 5, 'Y': 3, 'H': 1, 'W': -2, 'X': -2 }
  return gene.split('').reduce((score: number, letter: string) => score + (scoring[letter] || 0), 0)
}

// Find best gene for a plant type using same logic as gene calculator
const findBestGeneForPlant = (genesArray: string[]): string | null => {
  if (!genesArray || genesArray.length === 0) return null
  
  let bestGene = genesArray[0]
  let bestScore = calculateGeneQuality(bestGene)
  let bestGYCount = bestGene.split('').filter((g: string) => ['G', 'Y'].includes(g)).length
  
  genesArray.forEach((gene: string) => {
    const score = calculateGeneQuality(gene)
    const gyCount = gene.split('').filter((g: string) => ['G', 'Y'].includes(g)).length
    
    // Update best if this gene has a higher score, or same score but more G/Y genes
    if (score > bestScore || (score === bestScore && gyCount > bestGYCount)) {
      bestScore = score
      bestGene = gene
      bestGYCount = gyCount
    }
  })
  
  return bestGene
}

interface PlantGeneData {
  bestGene: string | null
  progress: number
}

interface GeneDataResult {
  hemp: PlantGeneData
  blueberry: PlantGeneData
  yellowberry: PlantGeneData
  redberry: PlantGeneData
  pumpkin: PlantGeneData
}

// Read from the actual gene data storage to get best genes and progress
const getGeneCalculatorData = (): GeneDataResult => {
  try {
    // Read data from main window localStorage (synced from popup via postMessage)
    const geneDataStored = localStorage.getItem('rustGeneCalculatorData')
    const progressStored = localStorage.getItem('rustGeneProgress')
    
    const result: GeneDataResult = {
      hemp: { bestGene: null, progress: 0 },
      blueberry: { bestGene: null, progress: 0 },
      yellowberry: { bestGene: null, progress: 0 },
      redberry: { bestGene: null, progress: 0 },
      pumpkin: { bestGene: null, progress: 0 }
    }
    
    // Get progress percentages
    if (progressStored) {
      const progressData = JSON.parse(progressStored)
      Object.keys(progressData).forEach((plantType: string) => {
        if (result[plantType as keyof GeneDataResult]) {
          result[plantType as keyof GeneDataResult].progress = progressData[plantType] || 0
        }
      })
    }
    
    // Get actual best gene strings
    if (geneDataStored) {
      const geneData = JSON.parse(geneDataStored)
      const { plantGenes, currentPlant, genes } = geneData
      
      if (plantGenes) {
        Object.keys(plantGenes).forEach((plantType: string) => {
          if (result[plantType as keyof GeneDataResult]) {
            // Use genes array for current plant, plantGenes array for others
            const genesArray = (plantType === currentPlant) ? genes : plantGenes[plantType]
            const bestGene = findBestGeneForPlant(genesArray)
            result[plantType as keyof GeneDataResult].bestGene = bestGene
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
  const [geneData, setGeneData] = useState<GeneDataResult>({
    hemp: { bestGene: null, progress: 0 },
    blueberry: { bestGene: null, progress: 0 },
    yellowberry: { bestGene: null, progress: 0 },
    redberry: { bestGene: null, progress: 0 },
    pumpkin: { bestGene: null, progress: 0 }
  })
  
  const weaponOptions = ['Spear', 'Bow', 'DB', 'P2', 'SAR', 'Tommy', 'MP-5', 'AK-47', 'M249']
  
  // Test function to add sample gene data to localStorage
  const addTestGeneData = () => {
    const testGeneData = {
      plantGenes: {
        hemp: ["GGYYYY", "GGGYYX", "GGGGYH"],
        blueberry: ["YYWWHX", "GGYWHY", "YGYWGH"],
        yellowberry: ["XWHGHY", "YYGYGG", "GGGGGY"],
        redberry: ["WWWXXY", "YHGHGY", "GYYYYY"],
        pumpkin: ["HHHHWW", "GGGGGG", "YGYGYW"]
      },
      currentPlant: "hemp",
      genes: ["GGYYYY", "GGGYYX", "GGGGYH"]
    }
    
    const testProgressData = {
      hemp: 85,
      blueberry: 42,
      yellowberry: 67,
      redberry: 23,
      pumpkin: 91
    }
    
    localStorage.setItem('rustGeneCalculatorData', JSON.stringify(testGeneData))
    localStorage.setItem('rustGeneProgress', JSON.stringify(testProgressData))
    
    // Update the data immediately
    const newData = getGeneCalculatorData()
    setGeneData(newData)
    console.log('Added test gene data:', newData)
  }
  
  const clearTestGeneData = () => {
    localStorage.removeItem('rustGeneCalculatorData')
    localStorage.removeItem('rustGeneProgress')
    
    // Reset the data
    const newData = getGeneCalculatorData()
    setGeneData(newData)
    console.log('Cleared gene data')
  }
  
  // Function to manually request data from open gene calculator popup
  const requestDataFromPopup = () => {
    try {
      // Check if there's a reference to the popup stored globally
      const popup = (window as any).geneCalculatorPopup
      if (popup && !popup.closed) {
        console.log('Found open gene calculator popup via stored reference, requesting data...')
        
        // Send a message to the popup requesting its current data
        popup.postMessage({
          type: 'REQUEST_GENE_DATA',
          timestamp: Date.now()
        }, '*')
        
        console.log('Sent data request to popup')
      } else {
        console.log('No open gene calculator popup found via stored reference')
        alert('Please open the Gene Calculator from the toolbar first, then try this button again.')
      }
    } catch (e) {
      console.error('Error requesting data from popup:', e)
      alert('Error communicating with Gene Calculator. Please close and reopen it.')
    }
  }
  
  // Load gene data when modal opens and update it
  useEffect(() => {
    if (!isOpen) return
    
    // Debug: Check what's actually in localStorage
    console.log('Checking localStorage for gene data...')
    console.log('All localStorage keys:', Object.keys(localStorage))
    
    // Check all localStorage items for anything gene-related
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i)
      if (key && (key.toLowerCase().includes('gene') || key.toLowerCase().includes('rust'))) {
        console.log(`Found gene-related key: ${key}:`, localStorage.getItem(key))
      }
    }
    
    console.log('rustGeneCalculatorData:', localStorage.getItem('rustGeneCalculatorData'))
    console.log('rustGeneProgress:', localStorage.getItem('rustGeneProgress'))
    
    // Load initial data
    const initialData = getGeneCalculatorData()
    setGeneData(initialData)
    console.log('Initial gene data:', initialData)
    
    // Listen for postMessage updates from the gene calculator popup
    const handleMessageFromPopup = (event: MessageEvent) => {
      console.log('Received postMessage:', event.data)
      
      if (event.data.type === 'GENE_DATA_UPDATE' || event.data.type === 'GENE_PROGRESS_UPDATE') {
        console.log('Processing gene data update from popup:', event.data)
        
        // Store the data in main window localStorage
        if (event.data.type === 'GENE_DATA_UPDATE' && event.data.data.geneData) {
          localStorage.setItem('rustGeneCalculatorData', JSON.stringify(event.data.data.geneData))
          console.log('Stored gene data to localStorage')
        }
        if (event.data.type === 'GENE_PROGRESS_UPDATE' && event.data.data.progressData) {
          localStorage.setItem('rustGeneProgress', JSON.stringify(event.data.data.progressData))
          console.log('Stored progress data to localStorage')
        }
        
        // Update the displayed data
        const newData = getGeneCalculatorData()
        setGeneData(newData)
        console.log('Updated gene data from popup message:', newData)
      }
    }
    
    // Listen for localStorage changes (fallback)
    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === 'rustGeneProgress' || e.key === 'rustGeneCalculatorData') {
        const newData = getGeneCalculatorData()
        setGeneData(newData)
        console.log('Updated gene data from storage event:', newData)
      }
    }
    
    // Also poll for changes as backup
    const interval = setInterval(() => {
      const newData = getGeneCalculatorData()
      setGeneData(newData)
    }, 3000) // Check every 3 seconds
    
    window.addEventListener('message', handleMessageFromPopup)
    window.addEventListener('storage', handleStorageChange)
    
    return () => {
      window.removeEventListener('message', handleMessageFromPopup)
      window.removeEventListener('storage', handleStorageChange)
      clearInterval(interval)
    }
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
              {/* Check if any gene data exists */}
              {!localStorage.getItem('rustGeneCalculatorData') && !localStorage.getItem('rustGeneProgress') ? (
                <div className="text-center p-4 space-y-3">
                  <div className="text-orange-400 text-sm font-mono">No gene data found</div>
                  <div className="text-gray-400 text-xs">Open the Gene Calculator from the toolbar to start tracking your gene progress</div>
                  <div className="space-y-1">
                    <button 
                      onClick={addTestGeneData}
                      className="w-full px-2 py-1 bg-blue-600 hover:bg-blue-700 text-white text-xs rounded font-mono"
                    >
                      Test with Sample Data
                    </button>
                    <button 
                      onClick={requestDataFromPopup}
                      className="w-full px-2 py-1 bg-purple-600 hover:bg-purple-700 text-white text-xs rounded font-mono"
                    >
                      Get Data from Popup
                    </button>
                  </div>
                </div>
              ) : (
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
              )}
              
              {/* Clear data button when data exists */}
              {(localStorage.getItem('rustGeneCalculatorData') || localStorage.getItem('rustGeneProgress')) && (
                <div className="mt-2 text-center">
                  <button 
                    onClick={clearTestGeneData}
                    className="px-2 py-1 bg-red-600 hover:bg-red-700 text-white text-xs rounded font-mono"
                  >
                    Clear Data
                  </button>
                </div>
              )}
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