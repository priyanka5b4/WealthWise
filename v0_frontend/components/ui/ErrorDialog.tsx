// components/ErrorDialog.tsx
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";

interface ErrorDialogProps {
  error: string | null;
  onClose: () => void;
}

export function ErrorDialog({ error, onClose }: ErrorDialogProps) {
  return (
    <Dialog open={!!error} onOpenChange={onClose}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Error Linking Account</DialogTitle>
        </DialogHeader>
        <div className="py-4 text-red-500">{error}</div>
        <DialogFooter>
          <Button onClick={onClose}>Close</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
