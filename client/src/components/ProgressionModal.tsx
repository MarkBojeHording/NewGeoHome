import { useState } from 'react'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Checkbox } from '@/components/ui/checkbox'
import { Button } from '@/components/ui/button'

interface ProgressionModalProps {
  isOpen: boolean
  onClose: () => void
}

export function ProgressionModal({ isOpen, onClose }: ProgressionModalProps) {
  const [inGroupWeapon, setInGroupWeapon] = useState('')
  const [aloneWeapon, setAloneWeapon] = useState('')
  const [counteringWeapon, setCounteringWeapon] = useState('')
  const [inGroupDisplay, setInGroupDisplay] = useState(false)
  const [aloneDisplay, setAloneDisplay] = useState(false)
  const [counteringDisplay, setCounteringDisplay] = useState(false)

  const weaponOptions = ['Spear', 'Bow', 'DB', 'P2', 'SAR', 'Tommy', 'MP-5', 'AK-47', 'M249']

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

        <div className="flex flex-col h-full p-6 gap-6">
          {/* Recommended Kit Level Container */}
          <div className="border-2 border-orange-500/50 p-6 bg-gray-800/50">
            <h3 className="text-orange-400 font-mono text-xl mb-6 text-center tracking-wider">
              RECOMMENDED KIT LEVEL
            </h3>
            
            <div className="flex justify-center gap-8">
              <div className="flex flex-col items-center">
                <label className="text-orange-400 mb-2 font-mono">In a group</label>
                <div className="flex items-center gap-3">
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
                  <div className="flex items-center gap-2">
                    <Checkbox 
                      checked={inGroupDisplay} 
                      onCheckedChange={(checked) => setInGroupDisplay(checked === true)}
                      className="border-orange-500/50 data-[state=checked]:bg-orange-500"
                    />
                    <span className="text-orange-200 text-sm">Display on map</span>
                  </div>
                </div>
              </div>

              <div className="flex flex-col items-center">
                <label className="text-orange-400 mb-2 font-mono">Alone</label>
                <div className="flex items-center gap-3">
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
                  <div className="flex items-center gap-2">
                    <Checkbox 
                      checked={aloneDisplay} 
                      onCheckedChange={(checked) => setAloneDisplay(checked === true)}
                      className="border-orange-500/50 data-[state=checked]:bg-orange-500"
                    />
                    <span className="text-orange-200 text-sm">Display on map</span>
                  </div>
                </div>
              </div>

              <div className="flex flex-col items-center">
                <label className="text-orange-400 mb-2 font-mono">Countering</label>
                <div className="flex items-center gap-3">
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
                  <div className="flex items-center gap-2">
                    <Checkbox 
                      checked={counteringDisplay} 
                      onCheckedChange={(checked) => setCounteringDisplay(checked === true)}
                      className="border-orange-500/50 data-[state=checked]:bg-orange-500"
                    />
                    <span className="text-orange-200 text-sm">Display on map</span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Bottom Section with Left Container and Message Container */}
          <div className="flex gap-6 flex-1">
            {/* Left Side Container - Taller than Wide */}
            <div className="border-2 border-orange-500/50 p-6 bg-gray-800/50 w-64 flex-shrink-0">
              {/* Empty container for future use */}
            </div>

            {/* Message Container */}
            <div className="border-2 border-orange-500/50 p-8 bg-gray-800/50 flex-1 flex items-center justify-center">
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