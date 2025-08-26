import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import ServerBeaconMain from "./ServerBeaconMain";

interface ServerBeaconModalProps {
  isOpen: boolean
  onClose: () => void
}

export default function ServerBeaconModal({ isOpen, onClose }: ServerBeaconModalProps) {
  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-6xl h-[80vh] p-0">
        <DialogHeader className="p-6 pb-0">
          <DialogTitle>ServerBeacon Admin Control</DialogTitle>
        </DialogHeader>
        
        <div className="flex-1 overflow-auto p-6 pt-4">
          <ServerBeaconMain />
        </div>
      </DialogContent>
    </Dialog>
  );
}