import { useEffect, useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { StockItem, CertificateFile } from '@/types/inventory';
import { Upload, X, FileText } from 'lucide-react';

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onAdd: (item: Omit<StockItem, 'id' | 'allocated'>) => void;
  editItem?: StockItem | null;
  onUpdate?: (id: string, updates: Partial<StockItem>) => void;
}

const initialForm = {
  itemName: '',
  material: '',
  length: 0,
  width: 0,
  thickness: 0,
  quantity: 1,
  unit: 'Nos',
  location: '',
  remarks: '',
  certificates: [] as CertificateFile[],
};

export default function AddStockDialog({ open, onOpenChange, onAdd, editItem, onUpdate }: Props) {
  const toFormState = (item: StockItem) => ({
    itemName: item.itemName,
    material: item.material,
    length: item.length,
    width: item.width,
    thickness: item.thickness,
    quantity: item.quantity,
    unit: item.unit,
    location: item.location,
    remarks: item.remarks || '',
    certificates: item.certificates || [],
  });

  const [form, setForm] = useState(initialForm);

  useEffect(() => {
    if (!open) {
      setForm(initialForm);
      return;
    }

    if (editItem) {
      setForm(toFormState(editItem));
      return;
    }

    setForm(initialForm);
  }, [open, editItem]);

  const handleSubmit = () => {
    if (!form.itemName || !form.material) return;
    if (editItem && onUpdate) {
      onUpdate(editItem.id, form);
    } else {
      onAdd(form);
    }
    setForm(initialForm);
    onOpenChange(false);
  };

  const update = (field: string, value: string | number) => setForm(prev => ({ ...prev, [field]: value }));

  const toDataUrl = (file: File) =>
    new Promise<string>((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(typeof reader.result === 'string' ? reader.result : '');
      reader.onerror = () => reject(new Error(`Failed to read ${file.name}`));
      reader.readAsDataURL(file);
    });

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files) return;

    try {
      const filesList = Array.from(files);
      const newCerts = await Promise.all(
        filesList.map(async (file) => ({
          name: file.name,
          // Data URL avoids blob preview issues in some environments.
          url: await toDataUrl(file),
          mimeType: file.type,
          uploadedAt: new Date().toISOString(),
        }))
      );

      setForm(prev => ({ ...prev, certificates: [...prev.certificates, ...newCerts] }));
    } catch (error) {
      console.error('Failed to upload certificates', error);
    }

    e.target.value = '';
  };

  const removeCert = (index: number) => {
    setForm(prev => ({
      ...prev,
      certificates: prev.certificates.filter((_, i) => i !== index),
    }));
  };

  const handleOpenChange = (isOpen: boolean) => {
    onOpenChange(isOpen);
  };

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="sm:max-w-lg max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{editItem ? 'Edit Stock Item' : 'Add Stock Item'}</DialogTitle>
          <DialogDescription className="sr-only">Fill in the stock item details</DialogDescription>
        </DialogHeader>
        <div className="grid gap-4 py-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Item Name</Label>
              <Input value={form.itemName} onChange={e => update('itemName', e.target.value)} placeholder="Steel Plate" />
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
              <Label>Unit</Label>
              <Input value={form.unit} onChange={e => update('unit', e.target.value)} placeholder="Nos" />
            </div>
            <div className="space-y-2">
              <Label>Location</Label>
              <Input value={form.location} onChange={e => update('location', e.target.value)} placeholder="Warehouse A" />
            </div>
          </div>

          {/* Remarks */}
          <div className="space-y-2">
            <Label>Remarks / Notes <span className="text-muted-foreground text-xs">(optional)</span></Label>
            <Textarea
              value={form.remarks}
              onChange={e => setForm(prev => ({ ...prev, remarks: e.target.value }))}
              placeholder="Any additional notes about this stock item..."
              className="resize-none"
              rows={2}
            />
          </div>

          {/* Certificates Upload */}
          <div className="space-y-2">
            <Label>Certificates / Documents <span className="text-muted-foreground text-xs">(optional)</span></Label>
            <label className="flex items-center gap-2 px-4 py-3 border-2 border-dashed rounded-xl cursor-pointer hover:border-primary/50 hover:bg-secondary/30 transition-colors">
              <Upload size={16} className="text-muted-foreground" />
              <span className="text-sm text-muted-foreground">Click to upload certificates</span>
              <input type="file" multiple accept=".pdf,application/pdf" className="hidden" onChange={handleFileUpload} />
            </label>
            {form.certificates.length > 0 && (
              <div className="space-y-1.5 mt-2">
                {form.certificates.map((cert, i) => (
                  <div key={i} className="flex items-center gap-2 px-3 py-2 bg-secondary/50 rounded-lg text-sm">
                    <FileText size={14} className="text-primary shrink-0" />
                    <span className="truncate flex-1 text-foreground">{cert.name}</span>
                    <button onClick={() => removeCert(i)} className="text-muted-foreground hover:text-destructive transition-colors">
                      <X size={14} />
                    </button>
                  </div>
                ))}
              </div>
            )}
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
