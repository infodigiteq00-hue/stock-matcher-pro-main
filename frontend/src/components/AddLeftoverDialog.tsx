import { useEffect, useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { LeftoverItem } from '@/types/inventory';
import { Plus } from 'lucide-react';

const DEFAULT_SHAPES = ['Plate', 'Pipe', 'Rod', 'Beam', 'Channel'];

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onAdd: (item: Omit<LeftoverItem, 'id'>) => void;
  customShapes: string[];
  onAddCustomShape: (shape: string) => void;
  editItem?: LeftoverItem | null;
  onUpdate?: (id: string, updates: Partial<LeftoverItem>) => void;
}

const initialForm = {
  parentItemRef: '',
  material: '',
  length: 0,
  width: 0,
  thickness: 0,
  quantity: 1,
  shapeType: 'Plate',
  remainingArea: 0,
  createdFrom: '',
};

export default function AddLeftoverDialog({ open, onOpenChange, onAdd, customShapes, onAddCustomShape, editItem, onUpdate }: Props) {
  const toFormState = (item: LeftoverItem) => ({
    parentItemRef: item.parentItemRef,
    material: item.material,
    length: item.length,
    width: item.width,
    thickness: item.thickness,
    quantity: item.quantity,
    shapeType: item.shapeType,
    remainingArea: item.remainingArea,
    createdFrom: item.createdFrom,
  });

  const [form, setForm] = useState(initialForm);

  const [showCustomInput, setShowCustomInput] = useState(false);
  const [customShapeInput, setCustomShapeInput] = useState('');

  useEffect(() => {
    if (!open) {
      setForm(initialForm);
      setShowCustomInput(false);
      setCustomShapeInput('');
      return;
    }

    if (editItem) {
      setForm(toFormState(editItem));
      setShowCustomInput(false);
      setCustomShapeInput('');
      return;
    }

    setForm(initialForm);
    setShowCustomInput(false);
    setCustomShapeInput('');
  }, [open, editItem]);

  const allShapes = [...DEFAULT_SHAPES, ...customShapes];

  const handleSubmit = () => {
    if (!form.material || !form.parentItemRef) return;
    const area = (form.length * form.width) / 1_000_000;
    if (editItem && onUpdate) {
      onUpdate(editItem.id, { ...form, remainingArea: area });
    } else {
      onAdd({ ...form, remainingArea: area });
    }
    setForm(initialForm);
    onOpenChange(false);
  };

  const handleAddCustomShape = () => {
    const trimmed = customShapeInput.trim();
    if (trimmed && !allShapes.includes(trimmed)) {
      onAddCustomShape(trimmed);
      setForm(prev => ({ ...prev, shapeType: trimmed }));
    }
    setCustomShapeInput('');
    setShowCustomInput(false);
  };

  const update = (field: string, value: string | number) => setForm(prev => ({ ...prev, [field]: value }));

  const handleOpenChange = (isOpen: boolean) => {
    onOpenChange(isOpen);
  };

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>{editItem ? 'Edit Leftover Item' : 'Add Leftover Item'}</DialogTitle>
          <DialogDescription className="sr-only">Fill in the leftover item details</DialogDescription>
        </DialogHeader>
        <div className="grid gap-4 py-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Parent Item Ref</Label>
              <Input value={form.parentItemRef} onChange={e => update('parentItemRef', e.target.value)} placeholder="STK-001" />
            </div>
            <div className="space-y-2">
              <Label>Material</Label>
              <Input value={form.material} onChange={e => update('material', e.target.value)} placeholder="SS316" />
            </div>
          </div>
          <div className="grid grid-cols-3 gap-4">
            <div className="space-y-2">
              <Label>Length (mm)</Label>
              <Input type="number" value={form.length || ''} onChange={e => update('length', +e.target.value)} />
            </div>
            <div className="space-y-2">
              <Label>Width (mm)</Label>
              <Input type="number" value={form.width || ''} onChange={e => update('width', +e.target.value)} />
            </div>
            <div className="space-y-2">
              <Label>Thickness (mm)</Label>
              <Input type="number" value={form.thickness || ''} onChange={e => update('thickness', +e.target.value)} />
            </div>
          </div>
          <div className="grid grid-cols-3 gap-4">
            <div className="space-y-2">
              <Label>Quantity</Label>
              <Input type="number" value={form.quantity} onChange={e => update('quantity', +e.target.value)} />
            </div>
            <div className="space-y-2">
              <Label>Shape Type</Label>
              {showCustomInput ? (
                <div className="flex gap-1">
                  <Input
                    value={customShapeInput}
                    onChange={e => setCustomShapeInput(e.target.value)}
                    placeholder="Custom shape"
                    className="text-sm"
                    onKeyDown={e => e.key === 'Enter' && handleAddCustomShape()}
                    autoFocus
                  />
                  <Button size="sm" variant="outline" onClick={handleAddCustomShape} className="shrink-0 px-2">
                    <Plus size={14} />
                  </Button>
                </div>
              ) : (
                <div className="flex gap-1">
                  <Select value={form.shapeType} onValueChange={v => update('shapeType', v)}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      {allShapes.map(s => (
                        <SelectItem key={s} value={s}>{s}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <Button size="sm" variant="ghost" onClick={() => setShowCustomInput(true)} className="shrink-0 px-2" title="Add custom shape">
                    <Plus size={14} />
                  </Button>
                </div>
              )}
            </div>
            <div className="space-y-2">
              <Label>From Project</Label>
              <Input value={form.createdFrom} onChange={e => update('createdFrom', e.target.value)} placeholder="Project Alpha" />
            </div>
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => handleOpenChange(false)}>Cancel</Button>
          <Button onClick={handleSubmit}>{editItem ? 'Save Changes' : 'Add Item'}</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
