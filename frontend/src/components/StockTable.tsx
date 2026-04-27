import { Fragment, useState } from 'react';
import { StockItem, StockLedgerEntry } from '@/types/inventory';
import { AnimatePresence, motion } from 'framer-motion';
import { ChevronDown, MapPin, Plus, Pencil, Trash2, FileText, Search } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import AddStockDialog from './AddStockDialog';
import CertificateViewerDialog from './CertificateViewerDialog';

interface Props {
  items: StockItem[];
  ledgerByStockId: Record<string, StockLedgerEntry[]>;
  onAddItem: (item: Omit<StockItem, 'id' | 'allocated'>) => void;
  onUpdateItem: (id: string, updates: Partial<StockItem>) => void;
  onDeleteItem: (id: string) => void;
  onAddLedgerEntry: (stockItemId: string, input: {
    transactionType: 'Issue' | 'Return' | 'Addition';
    quantity: number;
    givenTo?: string;
    projectReference?: string;
    entryCreatedBy?: string;
    remarks?: string;
  }) => { ok: boolean; message: string };
}

interface LedgerFilters {
  project: string;
  person: string;
  startDate: string;
  endDate: string;
}

const INITIAL_LEDGER_FILTERS: LedgerFilters = {
  project: '',
  person: '',
  startDate: '',
  endDate: '',
};

const LEDGER_PREVIEW_COUNT = 8;

interface ManualEntryForm {
  transactionType: 'Issue' | 'Return' | 'Addition';
  quantity: string;
  givenTo: string;
  projectReference: string;
  entryCreatedBy: string;
  remarks: string;
}

const INITIAL_MANUAL_ENTRY_FORM: ManualEntryForm = {
  transactionType: 'Issue',
  quantity: '',
  givenTo: '',
  projectReference: '',
  entryCreatedBy: 'User',
  remarks: '',
};

export default function StockTable({ items, ledgerByStockId, onAddItem, onUpdateItem, onDeleteItem, onAddLedgerEntry }: Props) {
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editItem, setEditItem] = useState<StockItem | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [expandedItemId, setExpandedItemId] = useState<string | null>(null);
  const [showAllByStockId, setShowAllByStockId] = useState<Record<string, boolean>>({});
  const [filtersByStockId, setFiltersByStockId] = useState<Record<string, LedgerFilters>>({});
  const [entryFormByStockId, setEntryFormByStockId] = useState<Record<string, ManualEntryForm>>({});
  const [markEntryItemId, setMarkEntryItemId] = useState<string | null>(null);
  const [viewerOpen, setViewerOpen] = useState(false);
  const [viewerFileName, setViewerFileName] = useState('');
  const [viewerFileUrl, setViewerFileUrl] = useState('');
  const [viewerIsPdf, setViewerIsPdf] = useState(false);
  const { toast } = useToast();

  const handleEdit = (item: StockItem) => {
    setEditItem(item);
    setDialogOpen(true);
  };

  const handleDialogClose = (open: boolean) => {
    setDialogOpen(open);
    if (!open) setEditItem(null);
  };

  const getLedgerForItem = (stockItemId: string) =>
    [...(ledgerByStockId[stockItemId] || [])].sort((a, b) => new Date(b.dateTime).getTime() - new Date(a.dateTime).getTime());

  const getFilteredLedger = (stockItemId: string) => {
    const filters = filtersByStockId[stockItemId] || INITIAL_LEDGER_FILTERS;
    const ledger = getLedgerForItem(stockItemId);
    return ledger.filter((entry) => {
      const projectMatch = !filters.project || entry.projectReference.toLowerCase().includes(filters.project.toLowerCase());
      const personMatch = !filters.person || entry.givenTo.toLowerCase().includes(filters.person.toLowerCase());
      const entryDate = new Date(entry.dateTime).toISOString().slice(0, 10);
      const startMatch = !filters.startDate || entryDate >= filters.startDate;
      const endMatch = !filters.endDate || entryDate <= filters.endDate;
      return projectMatch && personMatch && startMatch && endMatch;
    });
  };

  const updateLedgerFilter = (stockItemId: string, field: keyof LedgerFilters, value: string) => {
    setFiltersByStockId((prev) => ({
      ...prev,
      [stockItemId]: {
        ...(prev[stockItemId] || INITIAL_LEDGER_FILTERS),
        [field]: value,
      },
    }));
  };

  const formatDateTime = (isoDate: string) =>
    new Date(isoDate).toLocaleString(undefined, {
      year: 'numeric',
      month: 'short',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
    });

  const getTypeClasses = (entry: StockLedgerEntry) => {
    if (entry.transactionType === 'Issue') return 'bg-destructive/10 text-destructive';
    if (entry.transactionType === 'Return' || entry.transactionType === 'Addition') return 'bg-success/10 text-success';
    return 'bg-muted text-muted-foreground';
  };

  const updateManualEntryForm = (stockItemId: string, field: keyof ManualEntryForm, value: string) => {
    setEntryFormByStockId((prev) => ({
      ...prev,
      [stockItemId]: {
        ...(prev[stockItemId] || INITIAL_MANUAL_ENTRY_FORM),
        [field]: value,
      },
    }));
  };

  const submitManualEntry = (stockItemId: string) => {
    const form = entryFormByStockId[stockItemId] || INITIAL_MANUAL_ENTRY_FORM;
    const quantity = Number(form.quantity);

    const result = onAddLedgerEntry(stockItemId, {
      transactionType: form.transactionType,
      quantity,
      givenTo: form.givenTo,
      projectReference: form.projectReference,
      entryCreatedBy: form.entryCreatedBy,
      remarks: form.remarks,
    });

    if (!result.ok) {
      toast({
        title: 'Unable to add ledger entry',
        description: result.message,
        variant: 'destructive',
      });
      return;
    }

    setEntryFormByStockId((prev) => ({
      ...prev,
      [stockItemId]: {
        ...INITIAL_MANUAL_ENTRY_FORM,
        entryCreatedBy: prev[stockItemId]?.entryCreatedBy || 'User',
      },
    }));
    setMarkEntryItemId(null);

    toast({
      title: 'Ledger entry added',
      description: result.message,
    });
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
        const sizeTokens = [
          `${item.length}x${item.width}x${item.thickness}`,
          `${item.length}×${item.width}×${item.thickness}`,
          `l${item.length} w${item.width} t${item.thickness}`,
          `l/w/t ${item.length}/${item.width}/${item.thickness}`,
        ];

        const searchableParts = [
          item.id,
          item.itemName,
          item.material,
          ...sizeTokens,
        ];

        return searchableParts.some((part) => part.toLowerCase().includes(normalizedQuery));
      })
    : items;

  return (
    <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-semibold text-foreground">Stock Inventory</h2>
          <p className="text-sm text-muted-foreground mt-1">{filteredItems.length} of {items.length} items shown</p>
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
          placeholder="Search by name, material, or L/W/T"
          className="pl-9"
        />
      </div>
      <AddStockDialog
        open={dialogOpen}
        onOpenChange={handleDialogClose}
        onAdd={onAddItem}
        editItem={editItem}
        onUpdate={onUpdateItem}
      />
      <div className="glass-card rounded-2xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b bg-secondary/50">
                <th className="text-left py-3 px-4 font-medium text-muted-foreground">ID</th>
                <th className="text-left py-3 px-4 font-medium text-muted-foreground">Item Name</th>
                <th className="text-left py-3 px-4 font-medium text-muted-foreground">Material</th>
                <th className="text-left py-3 px-4 font-medium text-muted-foreground">Size (L×W×T)</th>
                <th className="text-right py-3 px-4 font-medium text-muted-foreground">Qty</th>
                <th className="text-right py-3 px-4 font-medium text-muted-foreground">Available</th>
                <th className="text-left py-3 px-4 font-medium text-muted-foreground">Location</th>
                <th className="text-left py-3 px-4 font-medium text-muted-foreground">Certs</th>
                <th className="text-left py-3 px-4 font-medium text-muted-foreground">Remarks</th>
                <th className="text-center py-3 px-4 font-medium text-muted-foreground">Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredItems.map((item, i) => {
                const isExpanded = expandedItemId === item.id;
                const filteredLedger = getFilteredLedger(item.id);
                const allLedger = getLedgerForItem(item.id);
                const visibleLedger = (showAllByStockId[item.id] || false)
                  ? filteredLedger
                  : filteredLedger.slice(0, LEDGER_PREVIEW_COUNT);
                const currentStock = item.quantity - item.allocated;
                const totalIssued = allLedger
                  .filter((entry) => entry.transactionType === 'Issue')
                  .reduce((sum, entry) => sum + Math.abs(entry.quantityChange), 0);
                const totalPurchased = allLedger
                  .filter((entry) => entry.transactionType === 'Addition')
                  .reduce((sum, entry) => sum + entry.quantityChange, 0);

                return (
                  <Fragment key={item.id}>
                    <motion.tr
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      transition={{ delay: i * 0.03 }}
                      className="border-b border-border/50 hover:bg-secondary/30 transition-colors cursor-pointer"
                      onClick={() => setExpandedItemId((prev) => prev === item.id ? null : item.id)}
                    >
                      <td className="py-3 px-4 font-mono text-xs text-muted-foreground">
                        <span className="inline-flex items-center gap-1.5">
                          <ChevronDown size={14} className={`transition-transform ${isExpanded ? 'rotate-180' : ''}`} />
                          {item.id}
                        </span>
                      </td>
                      <td className="py-3 px-4 font-medium text-foreground">{item.itemName}</td>
                      <td className="py-3 px-4">
                        <span className="inline-flex items-center px-2 py-0.5 rounded-md bg-primary/10 text-primary text-xs font-medium">
                          {item.material}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-muted-foreground">{item.length}×{item.width}×{item.thickness}</td>
                      <td className="py-3 px-4 text-right font-medium text-foreground">{item.quantity} <span className="text-muted-foreground text-xs">{item.unit}</span></td>
                      <td className="py-3 px-4 text-right">
                        <span className={`font-medium ${currentStock > 0 ? 'text-success' : 'text-destructive'}`}>
                          {currentStock}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-muted-foreground">
                        <span className="flex items-center gap-1"><MapPin size={12} />{item.location}</span>
                      </td>
                      <td className="py-3 px-4">
                        {item.certificates && item.certificates.length > 0 ? (
                          <div className="group relative">
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-primary/10 text-primary text-xs font-medium cursor-pointer">
                              <FileText size={12} /> {item.certificates.length}
                            </span>
                            <div className="absolute z-50 hidden group-hover:block top-full left-0 mt-1 p-2 bg-popover border rounded-lg shadow-lg max-w-xs">
                              <div className="space-y-1">
                                {item.certificates.map((cert, ci) => (
                                  <button
                                    key={ci}
                                    type="button"
                                    className="block text-xs text-primary hover:underline truncate"
                                    onClick={(event) => {
                                      event.stopPropagation();
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
                      <td className="py-3 px-4 text-xs text-muted-foreground max-w-[120px] truncate" title={item.remarks}>
                        {item.remarks || '—'}
                      </td>
                      <td className="py-3 px-4">
                        <div className="flex items-center justify-center gap-1">
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-7 w-7"
                            onClick={(event) => {
                              event.stopPropagation();
                              handleEdit(item);
                            }}
                          >
                            <Pencil size={13} />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-7 w-7 text-destructive hover:text-destructive"
                            onClick={(event) => {
                              event.stopPropagation();
                              onDeleteItem(item.id);
                            }}
                          >
                            <Trash2 size={13} />
                          </Button>
                        </div>
                      </td>
                    </motion.tr>

                    <AnimatePresence>
                      {isExpanded && (
                        <motion.tr
                          key={`${item.id}-ledger`}
                          initial={{ opacity: 0 }}
                          animate={{ opacity: 1 }}
                          exit={{ opacity: 0 }}
                          className="bg-secondary/20"
                        >
                          <td colSpan={10} className="p-4">
                            <motion.div
                              initial={{ height: 0, opacity: 0 }}
                              animate={{ height: 'auto', opacity: 1 }}
                              exit={{ height: 0, opacity: 0 }}
                              transition={{ duration: 0.2, ease: 'easeOut' }}
                              className="overflow-hidden"
                            >
                              <div className="space-y-4">
                                <div className="flex flex-wrap gap-2 md:gap-4">
                                  <div className="px-3 py-2 rounded-lg bg-background border">
                                    <p className="text-[11px] uppercase tracking-wide text-muted-foreground">Current Stock</p>
                                    <p className="text-sm font-semibold text-foreground">{currentStock}</p>
                                  </div>
                                  <div className="px-3 py-2 rounded-lg bg-background border">
                                    <p className="text-[11px] uppercase tracking-wide text-muted-foreground">Total Issued</p>
                                    <p className="text-sm font-semibold text-destructive">{totalIssued}</p>
                                  </div>
                                  <div className="px-3 py-2 rounded-lg bg-background border">
                                    <p className="text-[11px] uppercase tracking-wide text-muted-foreground">Total Bought</p>
                                    <p className="text-sm font-semibold text-success">{totalPurchased}</p>
                                  </div>
                                  <div className="ml-auto">
                                    <Button
                                      size="sm"
                                      onClick={() => setMarkEntryItemId(item.id)}
                                    >
                                      Mark Entry
                                    </Button>
                                  </div>
                                </div>

                                <div className="grid grid-cols-1 md:grid-cols-4 gap-2">
                                  <Input
                                    value={(filtersByStockId[item.id] || INITIAL_LEDGER_FILTERS).project}
                                    onChange={(e) => updateLedgerFilter(item.id, 'project', e.target.value)}
                                    placeholder="Filter by project"
                                  />
                                  <Input
                                    value={(filtersByStockId[item.id] || INITIAL_LEDGER_FILTERS).person}
                                    onChange={(e) => updateLedgerFilter(item.id, 'person', e.target.value)}
                                    placeholder="Filter by person"
                                  />
                                  <Input
                                    type="date"
                                    value={(filtersByStockId[item.id] || INITIAL_LEDGER_FILTERS).startDate}
                                    onChange={(e) => updateLedgerFilter(item.id, 'startDate', e.target.value)}
                                  />
                                  <Input
                                    type="date"
                                    value={(filtersByStockId[item.id] || INITIAL_LEDGER_FILTERS).endDate}
                                    onChange={(e) => updateLedgerFilter(item.id, 'endDate', e.target.value)}
                                  />
                                </div>

                                <div className="border rounded-xl overflow-hidden bg-background">
                                  <div className="max-h-80 overflow-auto">
                                    <table className="w-full text-xs">
                                      <thead className="sticky top-0 z-10 bg-secondary/90 backdrop-blur-sm">
                                        <tr className="border-b">
                                          <th className="text-left py-2 px-3 font-medium text-muted-foreground">Date</th>
                                          <th className="text-left py-2 px-3 font-medium text-muted-foreground">Type</th>
                                          <th className="text-right py-2 px-3 font-medium text-muted-foreground">Qty Change</th>
                                          <th className="text-right py-2 px-3 font-medium text-muted-foreground">Balance</th>
                                          <th className="text-left py-2 px-3 font-medium text-muted-foreground">Given To</th>
                                          <th className="text-left py-2 px-3 font-medium text-muted-foreground">Project</th>
                                          <th className="text-left py-2 px-3 font-medium text-muted-foreground">Remarks</th>
                                        </tr>
                                      </thead>
                                      <tbody>
                                        {visibleLedger.map((entry, idx) => (
                                          <tr key={entry.id} className={`border-b border-border/50 ${idx === 0 ? 'bg-primary/5' : ''}`}>
                                            <td className="py-2 px-3 text-muted-foreground whitespace-nowrap">{formatDateTime(entry.dateTime)}</td>
                                            <td className="py-2 px-3">
                                              <span className={`inline-flex items-center px-2 py-0.5 rounded-md font-medium ${getTypeClasses(entry)}`}>
                                                {entry.transactionType}
                                              </span>
                                            </td>
                                            <td className={`py-2 px-3 text-right font-medium ${entry.quantityChange < 0 ? 'text-destructive' : entry.quantityChange > 0 ? 'text-success' : 'text-muted-foreground'}`}>
                                              {entry.quantityChange > 0 ? `+${entry.quantityChange}` : entry.quantityChange}
                                            </td>
                                            <td className="py-2 px-3 text-right font-medium text-foreground">{entry.balanceAfterTransaction}</td>
                                            <td className="py-2 px-3 text-muted-foreground">{entry.givenTo || '—'}</td>
                                            <td className="py-2 px-3 text-muted-foreground">{entry.projectReference || '—'}</td>
                                            <td className="py-2 px-3 text-muted-foreground">{entry.remarks || '—'}</td>
                                          </tr>
                                        ))}
                                        {visibleLedger.length === 0 && (
                                          <tr>
                                            <td colSpan={7} className="py-6 text-center text-muted-foreground">
                                              No ledger entries match these filters.
                                            </td>
                                          </tr>
                                        )}
                                      </tbody>
                                    </table>
                                  </div>
                                </div>

                                {filteredLedger.length > LEDGER_PREVIEW_COUNT && (
                                  <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={() => {
                                      setShowAllByStockId((prev) => ({
                                        ...prev,
                                        [item.id]: !prev[item.id],
                                      }));
                                    }}
                                  >
                                    {showAllByStockId[item.id] ? 'Show Less' : 'View More'}
                                  </Button>
                                )}
                              </div>
                            </motion.div>
                          </td>
                        </motion.tr>
                      )}
                    </AnimatePresence>
                  </Fragment>
                );
              })}
              {filteredItems.length === 0 && (
                <tr>
                  <td colSpan={10} className="py-8 px-4 text-center text-sm text-muted-foreground">
                    No stock items match your search.
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
      <Dialog open={Boolean(markEntryItemId)} onOpenChange={(open) => !open && setMarkEntryItemId(null)}>
        <DialogContent className="sm:max-w-2xl">
          <DialogHeader>
            <DialogTitle>Mark New Entry</DialogTitle>
            <DialogDescription className="sr-only">
              Add a new stock ledger transaction entry.
            </DialogDescription>
          </DialogHeader>
          {markEntryItemId && (
            <div className="space-y-3">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-2">
                <Select
                  value={(entryFormByStockId[markEntryItemId] || INITIAL_MANUAL_ENTRY_FORM).transactionType}
                  onValueChange={(value: 'Issue' | 'Return' | 'Addition') => updateManualEntryForm(markEntryItemId, 'transactionType', value)}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Issue">Issue</SelectItem>
                    <SelectItem value="Return">Return</SelectItem>
                    <SelectItem value="Addition">Addition</SelectItem>
                  </SelectContent>
                </Select>
                <Input
                  type="number"
                  min={0}
                  step="any"
                  value={(entryFormByStockId[markEntryItemId] || INITIAL_MANUAL_ENTRY_FORM).quantity}
                  onChange={(e) => updateManualEntryForm(markEntryItemId, 'quantity', e.target.value)}
                  placeholder="Quantity"
                />
                <Input
                  value={(entryFormByStockId[markEntryItemId] || INITIAL_MANUAL_ENTRY_FORM).entryCreatedBy}
                  onChange={(e) => updateManualEntryForm(markEntryItemId, 'entryCreatedBy', e.target.value)}
                  placeholder="Entry created by"
                />
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                <Input
                  value={(entryFormByStockId[markEntryItemId] || INITIAL_MANUAL_ENTRY_FORM).givenTo}
                  onChange={(e) => updateManualEntryForm(markEntryItemId, 'givenTo', e.target.value)}
                  placeholder="Given to (person)"
                />
                <Input
                  value={(entryFormByStockId[markEntryItemId] || INITIAL_MANUAL_ENTRY_FORM).projectReference}
                  onChange={(e) => updateManualEntryForm(markEntryItemId, 'projectReference', e.target.value)}
                  placeholder="Project reference"
                />
              </div>
              <div className="grid grid-cols-1 md:grid-cols-[1fr_auto] gap-2">
                <Input
                  value={(entryFormByStockId[markEntryItemId] || INITIAL_MANUAL_ENTRY_FORM).remarks}
                  onChange={(e) => updateManualEntryForm(markEntryItemId, 'remarks', e.target.value)}
                  placeholder="Remarks"
                />
                <Button
                  onClick={() => submitManualEntry(markEntryItemId)}
                  className="w-full md:w-auto"
                >
                  Mark Entry
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </motion.div>
  );
}
