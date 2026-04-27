import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Label } from '@/components/ui/label';
import { useState } from 'react';
import { Package, Layers } from 'lucide-react';

export type MatchPriority = 'stock' | 'leftover';

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onConfirm: (priority: MatchPriority) => void;
}

export default function MatchPriorityDialog({ open, onOpenChange, onConfirm }: Props) {
  const [priority, setPriority] = useState<MatchPriority>('stock');

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-sm">
        <DialogHeader>
          <DialogTitle>Matching Priority</DialogTitle>
          <DialogDescription>Choose which inventory to check first when fulfilling BOQ items.</DialogDescription>
        </DialogHeader>
        <RadioGroup value={priority} onValueChange={v => setPriority(v as MatchPriority)} className="grid gap-3 py-4">
          <label
            className={`flex items-center gap-4 rounded-xl border-2 p-4 cursor-pointer transition-all ${
              priority === 'stock' ? 'border-primary bg-primary/5' : 'border-border hover:border-primary/30'
            }`}
          >
            <RadioGroupItem value="stock" />
            <div className="flex items-center gap-3 flex-1">
              <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
                <Package size={18} className="text-primary" />
              </div>
              <div>
                <p className="font-medium text-foreground text-sm">Stock First</p>
                <p className="text-xs text-muted-foreground">Prioritize main stock inventory</p>
              </div>
            </div>
          </label>
          <label
            className={`flex items-center gap-4 rounded-xl border-2 p-4 cursor-pointer transition-all ${
              priority === 'leftover' ? 'border-primary bg-primary/5' : 'border-border hover:border-primary/30'
            }`}
          >
            <RadioGroupItem value="leftover" />
            <div className="flex items-center gap-3 flex-1">
              <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
                <Layers size={18} className="text-primary" />
              </div>
              <div>
                <p className="font-medium text-foreground text-sm">Leftovers First</p>
                <p className="text-xs text-muted-foreground">Use leftover pieces before stock</p>
              </div>
            </div>
          </label>
        </RadioGroup>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button>
          <Button onClick={() => { onConfirm(priority); onOpenChange(false); }}>Run Matching</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
