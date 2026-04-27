import { useState } from 'react';
import { LeftoverItem, StockItem } from '@/types/inventory';
import { motion } from 'framer-motion';
import { Plus, Pencil, Trash2, FileText, Search } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import AddLeftoverDialog from './AddLeftoverDialog';
import CertificateViewerDialog from './CertificateViewerDialog';


interface Props {
  items: LeftoverItem[];
  stockItems: StockItem[];
  onAddItem: (item: Omit<LeftoverItem, 'id'>) => void;
  onUpdateItem: (id: string, updates: Partial<LeftoverItem>) => void;
  onDeleteItem: (id: string) => void;
  customShapes: string[];
  onAddCustomShape: (shape: string) => void;
}

export default function LeftoverTable({ items, stockItems, onAddItem, onUpdateItem, onDeleteItem, customShapes, onAddCustomShape }: Props) {
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editItem, setEditItem] = useState<LeftoverItem | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [viewerOpen, setViewerOpen] = useState(false);
  const [viewerFileName, setViewerFileName] = useState('');
  const [viewerFileUrl, setViewerFileUrl] = useState('');
  const [viewerIsPdf, setViewerIsPdf] = useState(false);

  const handleEdit = (item: LeftoverItem) => {
    setEditItem(item);
    setDialogOpen(true);
  };

  const handleDialogClose = (open: boolean) => {
    setDialogOpen(open);
    if (!open) setEditItem(null);
  };

  // Find parent stock item's certificates by parentItemRef
  const getParentCerts = (parentRef: string) => {
    const parent = stockItems.find(s => s.id === parentRef);
    return parent?.certificates || [];
  };

  const openCertificateViewer = (name: string, url: string, mimeType?: string) => {
    const isPdfFile =
      (mimeType && mimeType.toLowerCase().includes('pdf')) ||
      name.toLowerCase().endsWith('.pdf') ||
      url.startsWith('data:application/pdf');

    setViewerFileName(name);
    setViewerFileUrl(url);
    setViewerIsPdf(Boolean(isPdfFile));
    setViewerOpen(true);
  };

  const normalizedQuery = searchQuery.trim().toLowerCase();
  const filteredItems = normalizedQuery
    ? items.filter((item) => {
        const parentStockItem = stockItems.find((stockItem) => stockItem.id === item.parentItemRef);
        const sizeTokens = [
          `${item.length}x${item.width}x${item.thickness}`,
          `${item.length}×${item.width}×${item.thickness}`,
          `l${item.length} w${item.width} t${item.thickness}`,
          `l/w/t ${item.length}/${item.width}/${item.thickness}`,
        ];

        const searchableParts = [
          item.id,
          item.parentItemRef,
          parentStockItem?.itemName ?? '',
          item.material,
          item.shapeType,
          ...sizeTokens,
        ];

        return searchableParts.some((part) => part.toLowerCase().includes(normalizedQuery));
      })
    : items;

  return (
    <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-semibold text-foreground">Leftover Inventory</h2>
          <p className="text-sm text-muted-foreground mt-1">{filteredItems.length} of {items.length} leftover pieces shown</p>
        </div>
        <Button onClick={() => { setEditItem(null); setDialogOpen(true); }} size="sm" className="gap-2">
          <Plus size={14} /> Add Item
        </Button>
      </div>
      <div className="relative max-w-md">
        <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
        <Input
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          placeholder="Search by ref/name, material, shape, or L/W/T"
          className="pl-9"
        />
      </div>
      <AddLeftoverDialog
        open={dialogOpen}
        onOpenChange={handleDialogClose}
        onAdd={onAddItem}
        customShapes={customShapes}
        onAddCustomShape={onAddCustomShape}
        editItem={editItem}
        onUpdate={onUpdateItem}
      />
      <div className="glass-card rounded-2xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b bg-secondary/50">
                <th className="text-left py-3 px-4 font-medium text-muted-foreground">ID</th>
                <th className="text-left py-3 px-4 font-medium text-muted-foreground">Parent Ref</th>
                <th className="text-left py-3 px-4 font-medium text-muted-foreground">Material</th>
                <th className="text-left py-3 px-4 font-medium text-muted-foreground">Size (L×W×T)</th>
                <th className="text-right py-3 px-4 font-medium text-muted-foreground">Qty</th>
                <th className="text-left py-3 px-4 font-medium text-muted-foreground">Shape</th>
                <th className="text-left py-3 px-4 font-medium text-muted-foreground">From Project</th>
                <th className="text-left py-3 px-4 font-medium text-muted-foreground">Certs</th>
                <th className="text-center py-3 px-4 font-medium text-muted-foreground">Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredItems.map((item, i) => {
                const certs = getParentCerts(item.parentItemRef);
                return (
                  <motion.tr
                    key={item.id}
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: i * 0.03 }}
                    className="border-b border-border/50 hover:bg-secondary/30 transition-colors"
                  >
                    <td className="py-3 px-4 font-mono text-xs text-muted-foreground">{item.id}</td>
                    <td className="py-3 px-4 font-mono text-xs text-primary">{item.parentItemRef}</td>
                    <td className="py-3 px-4">
                      <span className="inline-flex items-center px-2 py-0.5 rounded-md bg-primary/10 text-primary text-xs font-medium">
                        {item.material}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-muted-foreground">{item.length}×{item.width}×{item.thickness}</td>
                    <td className="py-3 px-4 text-right font-medium text-foreground">{item.quantity}</td>
                    <td className="py-3 px-4">
                      <span className="px-2 py-0.5 rounded-md bg-accent text-accent-foreground text-xs">{item.shapeType}</span>
                    </td>
                    <td className="py-3 px-4 text-muted-foreground">{item.createdFrom}</td>
                    <td className="py-3 px-4">
                      {certs.length > 0 ? (
                        <div className="group relative">
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-primary/10 text-primary text-xs font-medium cursor-pointer">
                            <FileText size={12} /> {certs.length}
                          </span>
                          <div className="absolute z-50 hidden group-hover:block top-full left-0 mt-1 p-2 bg-popover border rounded-lg shadow-lg max-w-xs">
                            <p className="text-xs text-muted-foreground mb-1">From {item.parentItemRef}:</p>
                            <div className="space-y-1">
                              {certs.map((cert, ci) => (
                                <button
                                  key={ci}
                                  type="button"
                                  className="block text-xs text-primary hover:underline truncate"
                                  onClick={() => {
                                    openCertificateViewer(cert.name, cert.url, cert.mimeType);
                                  }}
                                >
                                  {cert.name}
                                </button>
                              ))}
                            </div>
                          </div>
                        </div>
                      ) : (
                        <span className="text-xs text-muted-foreground">—</span>
                      )}
                    </td>
                    <td className="py-3 px-4">
                      <div className="flex items-center justify-center gap-1">
                        <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => handleEdit(item)}>
                          <Pencil size={13} />
                        </Button>
                        <Button variant="ghost" size="icon" className="h-7 w-7 text-destructive hover:text-destructive" onClick={() => onDeleteItem(item.id)}>
                          <Trash2 size={13} />
                        </Button>
                      </div>
                    </td>
                  </motion.tr>
                );
              })}
              {filteredItems.length === 0 && (
                <tr>
                  <td colSpan={9} className="py-8 px-4 text-center text-sm text-muted-foreground">
                    No leftover items match your search.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
      <CertificateViewerDialog
        open={viewerOpen}
        onOpenChange={setViewerOpen}
        fileName={viewerFileName}
        fileUrl={viewerFileUrl}
        isPdf={viewerIsPdf}
      />
    </motion.div>
  );
}
