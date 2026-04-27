import { useState } from 'react';
import { TabType } from '@/types/inventory';
import { useInventory } from '@/hooks/useInventory';
import AppHeader from '@/components/AppHeader';
import StockTable from '@/components/StockTable';
import LeftoverTable from '@/components/LeftoverTable';
import BOQUpload from '@/components/BOQUpload';
import MatchDashboard from '@/components/MatchDashboard';
import MatchPriorityDialog, { MatchPriority } from '@/components/MatchPriorityDialog';
import { useToast } from '@/hooks/use-toast';

const Index = () => {
  const [activeTab, setActiveTab] = useState<TabType>('stock');
  const [priorityOpen, setPriorityOpen] = useState(false);
  const {
    stock, leftovers, boqItems, matchResults, customShapes, stockLedger,
    setBOQ, runMatching,
    addStockItem, updateStockItem, deleteStockItem,
    addLeftoverItem, updateLeftoverItem, deleteLeftoverItem,
    addCustomShape,
    addStockLedgerEntry,
  } = useInventory();
  const { toast } = useToast();

  const handleRunMatch = () => {
    if (boqItems.length === 0) {
      toast({ title: 'No BOQ items', description: 'Please upload or add BOQ items first.', variant: 'destructive' });
      return;
    }
    setPriorityOpen(true);
  };

  const handleConfirmMatch = (priority: MatchPriority) => {
    const results = runMatching(priority);
    toast({ title: 'Matching Complete', description: `${results.length} items processed (${priority === 'stock' ? 'Stock' : 'Leftovers'} prioritized).` });
    setActiveTab('dashboard');
  };

  return (
    <div className="min-h-screen bg-background">
      <AppHeader activeTab={activeTab} onTabChange={setActiveTab} />
      <main className="max-w-7xl mx-auto px-6 py-8">
        {activeTab === 'stock' && (
          <StockTable
            items={stock}
            ledgerByStockId={stockLedger}
            onAddItem={addStockItem}
            onUpdateItem={updateStockItem}
            onDeleteItem={deleteStockItem}
            onAddLedgerEntry={addStockLedgerEntry}
          />
        )}
        {activeTab === 'leftover' && (
          <LeftoverTable
            items={leftovers}
            stockItems={stock}
            onAddItem={addLeftoverItem}
            onUpdateItem={updateLeftoverItem}
            onDeleteItem={deleteLeftoverItem}
            customShapes={customShapes}
            onAddCustomShape={addCustomShape}
          />
        )}
        {activeTab === 'boq' && <BOQUpload boqItems={boqItems} setBOQ={setBOQ} onRunMatch={handleRunMatch} />}
        {activeTab === 'dashboard' && <MatchDashboard results={matchResults} />}
      </main>
      <MatchPriorityDialog open={priorityOpen} onOpenChange={setPriorityOpen} onConfirm={handleConfirmMatch} />
    </div>
  );
};

export default Index;
