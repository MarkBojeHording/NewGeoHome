import { useState } from 'react'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'

interface ProgressionModalProps {
  isOpen: boolean
  onClose: () => void
}

export function ProgressionModal({ isOpen, onClose }: ProgressionModalProps) {
  const [slot1, setSlot1] = useState('')
  const [slot2, setSlot2] = useState('')
  const [slot3, setSlot3] = useState('')

  const weaponOptions = ['Spear', 'Bow', 'DB', 'P2', 'SAR', 'Tommy', 'MP-5', 'AK-47', 'M249']

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] bg-gray-900 border-2 border-orange-500 text-orange-50 shadow-2xl shadow-orange-800/50">
        <DialogHeader className="border-b border-orange-600/50 pb-3">
          <DialogTitle className="text-orange-400 font-mono text-lg tracking-wider text-center">
            [PROGRESSION SYSTEM]
          </DialogTitle>
        </DialogHeader>

        <div className="flex flex-col h-full p-6">
          {/* Top section with 3 dropdowns */}
          <div className="flex justify-center gap-6 mb-8">
            <div className="flex flex-col items-center">
              <label className="text-orange-400 mb-2 font-mono">SLOT 1</label>
              <Select value={slot1} onValueChange={setSlot1}>
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
              <label className="text-orange-400 mb-2 font-mono">SLOT 2</label>
              <Select value={slot2} onValueChange={setSlot2}>
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
              <label className="text-orange-400 mb-2 font-mono">SLOT 3</label>
              <Select value={slot3} onValueChange={setSlot3}>
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

          {/* Middle section with large message */}
          <div className="flex-1 flex items-center justify-center">
            <div className="text-center max-w-3xl">
              <p className="text-4xl font-mono text-orange-400 leading-relaxed tracking-wide">
                The progression system is a check the box progression tracker to help teams keep their wipe day from getting chaotic. This feature is still under construction.
              </p>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}