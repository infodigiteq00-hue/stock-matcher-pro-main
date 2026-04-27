import { useState, useCallback } from 'react';
import { BOQItem } from '@/types/inventory';
import { motion, AnimatePresence } from 'framer-motion';
import { Upload, FileSpreadsheet, Plus, Trash2, Play } from 'lucide-react';
import * as XLSX from 'xlsx';

interface Props {
  boqItems: BOQItem[];
  setBOQ: (items: BOQItem[]) => void;
  onRunMatch: () => void;
}

const emptyItem = (): BOQItem => ({ itemName: '', material: '', length: 0, width: 0, thickness: 0, quantity: 1, unit: 'Nos' });

export default function BOQUpload({ boqItems, setBOQ, onRunMatch }: Props) {
  const [isDragging, setIsDragging] = useState(false);
  const [fileName, setFileName] = useState('');

  const parseExcel = useCallback((file: File) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      const data = new Uint8Array(e.target?.result as ArrayBuffer);
      const wb = XLSX.read(data, { type: 'array' });
      const ws = wb.Sheets[wb.SheetNames[0]];
      const json = XLSX.utils.sheet_to_json<Record<string, unknown>>(ws);

      const items: BOQItem[] = json.map(row => ({
        itemName: String(row['Item Name'] || row['itemName'] || ''),
        material: String(row['Material'] || row['material'] || ''),
        length: Number(row['Length'] || row['length'] || 0),
        width: Number(row['Width'] || row['width'] || 0),
        thickness: Number(row['Thickness'] || row['thickness'] || 0),
        quantity: Number(row['Quantity'] || row['quantity'] || 1),
        unit: String(row['Unit'] || row['unit'] || 'Nos'),
      }));

      setBOQ(items);
      setFileName(file.name);
    };
    reader.readAsArrayBuffer(file);
  }, [setBOQ]);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    const file = e.dataTransfer.files[0];
    if (file) parseExcel(file);
  }, [parseExcel]);

  const handleFileInput = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) parseExcel(file);
  }, [parseExcel]);

  const addManualRow = () => setBOQ([...boqItems, emptyItem()]);
  const removeRow = (i: number) => setBOQ(boqItems.filter((_, idx) => idx !== i));
  const updateRow = (i: number, field: keyof BOQItem, value: string | number) => {
    const updated = [...boqItems];
    updated[i] = { ...updated[i], [field]: value };
    setBOQ(updated);
  };

  const loadSample = () => {
    setBOQ([
      { itemName: 'Steel Plate', material: 'SS316', length: 1500, width: 800, thickness: 10, quantity: 5, unit: 'Nos' },
      { itemName: 'MS Beam', material: 'MS', length: 5000, width: 200, thickness: 8, quantity: 10, unit: 'Nos' },
      { itemName: 'SS Pipe', material: 'SS304', length: 2000, width: 100, thickness: 5, quantity: 20, unit: 'Nos' },
      { itemName: 'Steel Plate', material: 'SS316', length: 2000, width: 1000, thickness: 10, quantity: 8, unit: 'Nos' },
      { itemName: 'Carbon Steel Rod', material: 'CS', length: 1200, width: 50, thickness: 50, quantity: 15, unit: 'Nos' },
      { itemName: 'Aluminium Sheet', material: 'AL6061', length: 800, width: 500, thickness: 3, quantity: 6, unit: 'Nos' },
    ]);
    setFileName('sample_boq.xlsx');
  };

  return (
    <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-semibold text-foreground">BOQ Upload</h2>
          <p className="text-sm text-muted-foreground mt-1">Upload an Excel file or enter items manually</p>
        </div>
        <button onClick={loadSample} className="text-sm text-primary hover:underline font-medium">
          Load Sample Data
        </button>
      </div>

      {/* Drop zone */}
      <div
        onDragOver={(e) => { e.preventDefault(); setIsDragging(true); }}
        onDragLeave={() => setIsDragging(false)}
        onDrop={handleDrop}
        className={`relative glass-card rounded-2xl border-2 border-dashed transition-all cursor-pointer ${
          isDragging ? 'border-primary bg-primary/5 scale-[1.01]' : 'border-border hover:border-primary/40'
        }`}
      >
        <label className="flex flex-col items-center justify-center py-12 cursor-pointer">
          <input type="file" accept=".xlsx,.xls,.csv" onChange={handleFileInput} className="hidden" />
          <div className={`w-14 h-14 rounded-2xl flex items-center justify-center mb-4 transition-colors ${
            isDragging ? 'bg-primary text-primary-foreground' : 'bg-secondary text-muted-foreground'
          }`}>
            {fileName ? <FileSpreadsheet size={24} /> : <Upload size={24} />}
          </div>
          {fileName ? (
            <div className="text-center">
              <p className="font-medium text-foreground">{fileName}</p>
              <p className="text-sm text-muted-foreground mt-1">{boqItems.length} items loaded</p>
            </div>
          ) : (
            <div className="text-center">
              <p className="font-medium text-foreground">Drop your BOQ file here</p>
              <p className="text-sm text-muted-foreground mt-1">Excel (.xlsx, .xls) or CSV</p>
            </div>
          )}
        </label>
      </div>

      {/* Manual entry table */}
      {boqItems.length > 0 && (
        <div className="glass-card rounded-2xl overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b bg-secondary/50">
                  <th className="text-left py-3 px-3 font-medium text-muted-foreground">Item Name</th>
                  <th className="text-left py-3 px-3 font-medium text-muted-foreground">Material</th>
                  <th className="text-right py-3 px-3 font-medium text-muted-foreground">Length</th>
                  <th className="text-right py-3 px-3 font-medium text-muted-foreground">Width</th>
                  <th className="text-right py-3 px-3 font-medium text-muted-foreground">Thickness</th>
                  <th className="text-right py-3 px-3 font-medium text-muted-foreground">Qty</th>
                  <th className="text-left py-3 px-3 font-medium text-muted-foreground">Unit</th>
                  <th className="py-3 px-3"></th>
                </tr>
              </thead>
              <tbody>
                <AnimatePresence>
                  {boqItems.map((item, i) => (
                    <motion.tr
                      key={i}
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: 'auto' }}
                      exit={{ opacity: 0, height: 0 }}
                      className="border-b border-border/50"
                    >
                      <td className="py-2 px-3"><input className="w-full bg-transparent border-none outline-none text-foreground" value={item.itemName} onChange={e => updateRow(i, 'itemName', e.target.value)} /></td>
                      <td className="py-2 px-3"><input className="w-full bg-transparent border-none outline-none text-foreground" value={item.material} onChange={e => updateRow(i, 'material', e.target.value)} /></td>
                      <td className="py-2 px-3"><input type="number" className="w-20 bg-transparent border-none outline-none text-right text-foreground" value={item.length} onChange={e => updateRow(i, 'length', +e.target.value)} /></td>
                      <td className="py-2 px-3"><input type="number" className="w-20 bg-transparent border-none outline-none text-right text-foreground" value={item.width} onChange={e => updateRow(i, 'width', +e.target.value)} /></td>
                      <td className="py-2 px-3"><input type="number" className="w-20 bg-transparent border-none outline-none text-right text-foreground" value={item.thickness} onChange={e => updateRow(i, 'thickness', +e.target.value)} /></td>
                      <td className="py-2 px-3"><input type="number" className="w-16 bg-transparent border-none outline-none text-right text-foreground" value={item.quantity} onChange={e => updateRow(i, 'quantity', +e.target.value)} /></td>
                      <td className="py-2 px-3"><input className="w-16 bg-transparent border-none outline-none text-foreground" value={item.unit} onChange={e => updateRow(i, 'unit', e.target.value)} /></td>
                      <td className="py-2 px-3">
                        <button onClick={() => removeRow(i)} className="text-muted-foreground hover:text-destructive transition-colors"><Trash2 size={14} /></button>
                      </td>
                    </motion.tr>
                  ))}
                </AnimatePresence>
              </tbody>
            </table>
          </div>
          <div className="flex items-center justify-between p-4 border-t border-border/50">
            <button onClick={addManualRow} className="flex items-center gap-2 text-sm text-primary font-medium hover:underline">
              <Plus size={14} /> Add Row
            </button>
            <button
              onClick={onRunMatch}
              className="flex items-center gap-2 px-6 py-2.5 bg-primary text-primary-foreground rounded-xl text-sm font-semibold hover:opacity-90 transition-opacity shadow-lg shadow-primary/25"
            >
              <Play size={14} /> Run Matching
            </button>
          </div>
        </div>
      )}
    </motion.div>
  );
}
