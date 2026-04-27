import { useState, useCallback, useEffect, useRef } from 'react';
import { StockItem, LeftoverItem, BOQItem, MatchResult, StockLedgerEntry, StockLedgerTransactionType } from '@/types/inventory';
import { runMatchingEngine, MatchPriority } from '@/lib/matchingEngine';
import { InventorySnapshot, loadInventorySnapshot, saveInventorySnapshot } from '@/lib/inventoryApi';

const createLedgerId = () => `LDG-${Date.now()}-${Math.random().toString(36).slice(2, 8).toUpperCase()}`;

const createLedgerEntry = (
  stockItemId: string,
  transactionType: StockLedgerTransactionType,
  quantityChange: number,
  balanceAfterTransaction: number,
  extra?: Partial<Pick<StockLedgerEntry, 'givenTo' | 'projectReference' | 'entryCreatedBy' | 'remarks' | 'dateTime'>>
): StockLedgerEntry => ({
  id: createLedgerId(),
  stockItemId,
  dateTime: extra?.dateTime || new Date().toISOString(),
  transactionType,
  quantityChange,
  balanceAfterTransaction,
  givenTo: extra?.givenTo || '',
  projectReference: extra?.projectReference || '',
  entryCreatedBy: extra?.entryCreatedBy || 'System',
  remarks: extra?.remarks || '',
});

interface NewLedgerEntryInput {
  transactionType: Extract<StockLedgerTransactionType, 'Issue' | 'Return' | 'Addition'>;
  quantity: number;
  givenTo?: string;
  projectReference?: string;
  entryCreatedBy?: string;
  remarks?: string;
}

const createEmptySnapshot = (): InventorySnapshot => ({
  stock: [],
  leftovers: [],
  boqItems: [],
  matchResults: [],
  customShapes: [],
  stockLedger: {},
});

const getNextId = (ids: string[], prefix: string) => {
  const nextNumber = ids.reduce((max, id) => {
    if (!id.startsWith(`${prefix}-`)) return max;
    const parsed = Number(id.slice(prefix.length + 1));
    return Number.isFinite(parsed) ? Math.max(max, parsed) : max;
  }, 0) + 1;
  return `${prefix}-${String(nextNumber).padStart(3, '0')}`;
};

export function useInventory() {
  const defaults = createEmptySnapshot();

  const [stock, setStock] = useState<StockItem[]>(defaults.stock);
  const [leftovers, setLeftovers] = useState<LeftoverItem[]>(defaults.leftovers);
  const [boqItems, setBOQItems] = useState<BOQItem[]>([]);
  const [matchResults, setMatchResults] = useState<MatchResult[]>([]);
  const [customShapes, setCustomShapes] = useState<string[]>([]);
  const [stockLedger, setStockLedger] = useState<Record<string, StockLedgerEntry[]>>(defaults.stockLedger);

  const stockRef = useRef(stock);
  const leftoversRef = useRef(leftovers);
  const boqItemsRef = useRef(boqItems);
  const matchResultsRef = useRef(matchResults);
  const customShapesRef = useRef(customShapes);
  const stockLedgerRef = useRef(stockLedger);

  useEffect(() => {
    stockRef.current = stock;
    leftoversRef.current = leftovers;
    boqItemsRef.current = boqItems;
    matchResultsRef.current = matchResults;
    customShapesRef.current = customShapes;
    stockLedgerRef.current = stockLedger;
  }, [stock, leftovers, boqItems, matchResults, customShapes, stockLedger]);

  const persistSnapshot = useCallback(async (overrides: Partial<InventorySnapshot> = {}) => {
    await saveInventorySnapshot({
      stock: overrides.stock ?? stockRef.current,
      leftovers: overrides.leftovers ?? leftoversRef.current,
      boqItems: overrides.boqItems ?? boqItemsRef.current,
      matchResults: overrides.matchResults ?? matchResultsRef.current,
      customShapes: overrides.customShapes ?? customShapesRef.current,
      stockLedger: overrides.stockLedger ?? stockLedgerRef.current,
    });
  }, []);

  useEffect(() => {
    let active = true;

    const hydrateFromCsv = async () => {
      try {
        const snapshot = await loadInventorySnapshot();
        if (!active) return;
        setStock(snapshot.stock);
        setLeftovers(snapshot.leftovers);
        setBOQItems(snapshot.boqItems);
        setMatchResults(snapshot.matchResults);
        setCustomShapes(snapshot.customShapes);
        setStockLedger(snapshot.stockLedger);
      } catch (error) {
        console.error('Failed to load CSV snapshot.', error);
        // Do not overwrite server data on transient load errors.
      }
    };

    hydrateFromCsv();

    return () => {
      active = false;
    };
  }, [persistSnapshot]);

  const addStockItem = useCallback((item: Omit<StockItem, 'id' | 'allocated'>) => {
    const currentStock = stockRef.current;
    const currentLedger = stockLedgerRef.current;
    const id = getNextId(currentStock.map((stockItem) => stockItem.id), 'STK');
    const nextStock = [...currentStock, { ...item, id, allocated: 0 }];
    const nextLedger = {
      ...currentLedger,
      [id]: [
        ...(currentLedger[id] || []),
        createLedgerEntry(
          id,
          'Addition',
          item.quantity,
          item.quantity,
          {
            entryCreatedBy: 'User',
            remarks: 'Stock item added to inventory.',
          }
        ),
      ],
    };

    setStock(nextStock);
    setStockLedger(nextLedger);
    persistSnapshot({ stock: nextStock, stockLedger: nextLedger }).catch((error) => {
      console.error('Failed to persist stock addition.', error);
    });
  }, [persistSnapshot]);

  const updateStockItem = useCallback((id: string, updates: Partial<StockItem>) => {
    const currentStock = stockRef.current;
    const currentLedger = stockLedgerRef.current;
    const current = currentStock.find((item) => item.id === id);
    if (!current) return;

    const updated = { ...current, ...updates };
    const nextStock = currentStock.map((item) => item.id === id ? updated : item);
    const ledgerEntries: StockLedgerEntry[] = [];

    const quantityDelta = updated.quantity - current.quantity;
    if (quantityDelta > 0) {
      ledgerEntries.push(
        createLedgerEntry(
          id,
          'Addition',
          quantityDelta,
          updated.quantity - updated.allocated,
          {
            entryCreatedBy: 'User',
            remarks: 'Quantity increased from stock edit.',
          }
        )
      );
    }

    const allocatedDelta = updated.allocated - current.allocated;
    if (allocatedDelta > 0) {
      ledgerEntries.push(
        createLedgerEntry(
          id,
          'Issue',
          -allocatedDelta,
          updated.quantity - updated.allocated,
          {
            entryCreatedBy: 'System',
            remarks: 'Allocation updated from stock edit.',
          }
        )
      );
    } else if (allocatedDelta < 0) {
      ledgerEntries.push(
        createLedgerEntry(
          id,
          'Return',
          Math.abs(allocatedDelta),
          updated.quantity - updated.allocated,
          {
            entryCreatedBy: 'System',
            remarks: 'Return captured from stock edit.',
          }
        )
      );
    }

    const nextLedger = ledgerEntries.length > 0
      ? {
          ...currentLedger,
          [id]: [...(currentLedger[id] || []), ...ledgerEntries],
        }
      : currentLedger;

    setStock(nextStock);
    if (ledgerEntries.length > 0) {
      setStockLedger(nextLedger);
    }
    persistSnapshot({
      stock: nextStock,
      stockLedger: nextLedger,
    }).catch((error) => {
      console.error('Failed to persist stock update.', error);
    });
  }, [persistSnapshot]);

  const deleteStockItem = useCallback((id: string) => {
    const nextStock = stockRef.current.filter((item) => item.id !== id);
    setStock(nextStock);
    persistSnapshot({ stock: nextStock }).catch((error) => {
      console.error('Failed to persist stock deletion.', error);
    });
  }, [persistSnapshot]);

  const addLeftoverItem = useCallback((item: Omit<LeftoverItem, 'id'>) => {
    const currentLeftovers = leftoversRef.current;
    const id = getNextId(currentLeftovers.map((leftover) => leftover.id), 'LFT');
    const nextLeftovers = [...currentLeftovers, { ...item, id }];
    setLeftovers(nextLeftovers);
    persistSnapshot({ leftovers: nextLeftovers }).catch((error) => {
      console.error('Failed to persist leftover addition.', error);
    });
  }, [persistSnapshot]);

  const updateLeftoverItem = useCallback((id: string, updates: Partial<LeftoverItem>) => {
    const nextLeftovers = leftoversRef.current.map((item) => item.id === id ? { ...item, ...updates } : item);
    setLeftovers(nextLeftovers);
    persistSnapshot({ leftovers: nextLeftovers }).catch((error) => {
      console.error('Failed to persist leftover update.', error);
    });
  }, [persistSnapshot]);

  const deleteLeftoverItem = useCallback((id: string) => {
    const nextLeftovers = leftoversRef.current.filter((item) => item.id !== id);
    setLeftovers(nextLeftovers);
    persistSnapshot({ leftovers: nextLeftovers }).catch((error) => {
      console.error('Failed to persist leftover deletion.', error);
    });
  }, [persistSnapshot]);

  const addCustomShape = useCallback((shape: string) => {
    const currentShapes = customShapesRef.current;
    const nextShapes = currentShapes.includes(shape) ? currentShapes : [...currentShapes, shape];
    setCustomShapes(nextShapes);
    persistSnapshot({ customShapes: nextShapes }).catch((error) => {
      console.error('Failed to persist custom shape update.', error);
    });
  }, [persistSnapshot]);

  const setBOQ = useCallback((items: BOQItem[]) => {
    setBOQItems(items);
    persistSnapshot({ boqItems: items }).catch((error) => {
      console.error('Failed to persist BOQ items.', error);
    });
  }, [persistSnapshot]);

  const setBOQItemsWithPersistence = useCallback((items: BOQItem[]) => {
    setBOQItems(items);
    persistSnapshot({ boqItems: items }).catch((error) => {
      console.error('Failed to persist BOQ items.', error);
    });
  }, [persistSnapshot]);

  const runMatching = useCallback((priority: MatchPriority = 'stock') => {
    const currentStock = stockRef.current;
    const currentLeftovers = leftoversRef.current;
    const currentBoqItems = boqItemsRef.current;
    const currentLedger = stockLedgerRef.current;

    const { results, updatedStock, updatedLeftovers } = runMatchingEngine(currentBoqItems, currentStock, currentLeftovers, priority);
    const nextLedger = { ...currentLedger };

    for (const previousItem of currentStock) {
        const latestItem = updatedStock.find(item => item.id === previousItem.id);
        if (!latestItem) continue;

        const allocatedDelta = latestItem.allocated - previousItem.allocated;
        if (allocatedDelta > 0) {
          const matchingResult = results.find(r => r.stockSource === previousItem.id && r.fromStock > 0);
          const projectReference = matchingResult?.boqItem.itemName || '';

          nextLedger[previousItem.id] = [
            ...(nextLedger[previousItem.id] || []),
            createLedgerEntry(
              previousItem.id,
              'Issue',
              -allocatedDelta,
              latestItem.quantity - latestItem.allocated,
              {
                givenTo: '',
                projectReference,
                entryCreatedBy: 'System',
                remarks: `Allocated via BOQ run (${priority} priority).`,
              }
            ),
          ];
        }
      }

    setStock(updatedStock);
    setLeftovers(updatedLeftovers);
    setMatchResults(results);
    setStockLedger(nextLedger);
    persistSnapshot({
      stock: updatedStock,
      leftovers: updatedLeftovers,
      matchResults: results,
      stockLedger: nextLedger,
    }).catch((error) => {
      console.error('Failed to persist matching results.', error);
    });
    return results;
  }, [persistSnapshot]);

  const addStockLedgerEntry = useCallback((stockItemId: string, input: NewLedgerEntryInput) => {
    const currentStock = stockRef.current;
    const currentLedger = stockLedgerRef.current;
    const currentItem = currentStock.find(item => item.id === stockItemId);
    if (!currentItem) {
      return { ok: false, message: 'Stock item not found.' };
    }

    const quantity = Number(input.quantity);
    if (!Number.isFinite(quantity) || quantity <= 0) {
      return { ok: false, message: 'Quantity must be greater than zero.' };
    }

    const available = currentItem.quantity - currentItem.allocated;
    let updatedItem = currentItem;
    let quantityChange = 0;

    if (input.transactionType === 'Addition') {
      updatedItem = { ...currentItem, quantity: currentItem.quantity + quantity };
      quantityChange = quantity;
    } else if (input.transactionType === 'Issue') {
      if (quantity > available) {
        return { ok: false, message: `Cannot issue more than available stock (${available}).` };
      }
      updatedItem = { ...currentItem, allocated: currentItem.allocated + quantity };
      quantityChange = -quantity;
    } else if (input.transactionType === 'Return') {
      if (quantity > currentItem.allocated) {
        return { ok: false, message: `Cannot return more than issued stock (${currentItem.allocated}).` };
      }
      updatedItem = { ...currentItem, allocated: currentItem.allocated - quantity };
      quantityChange = quantity;
    }

    const balanceAfterTransaction = updatedItem.quantity - updatedItem.allocated;
    const ledgerEntry = createLedgerEntry(
      stockItemId,
      input.transactionType,
      quantityChange,
      balanceAfterTransaction,
      {
        givenTo: input.givenTo || '',
        projectReference: input.projectReference || '',
        entryCreatedBy: input.entryCreatedBy || 'User',
        remarks: input.remarks || '',
      }
    );

    const nextStock = currentStock.map((item) => item.id === stockItemId ? updatedItem : item);
    const nextLedger = {
      ...currentLedger,
      [stockItemId]: [...(currentLedger[stockItemId] || []), ledgerEntry],
    };

    setStock(nextStock);
    setStockLedger(nextLedger);
    persistSnapshot({
      stock: nextStock,
      stockLedger: nextLedger,
    }).catch((error) => {
      console.error('Failed to persist ledger entry.', error);
    });

    return { ok: true, message: 'Ledger entry added successfully.' };
  }, [persistSnapshot]);

  return {
    stock, leftovers, boqItems, matchResults, customShapes, stockLedger,
    addStockItem, updateStockItem, deleteStockItem,
    addLeftoverItem, updateLeftoverItem, deleteLeftoverItem,
    addCustomShape,
    addStockLedgerEntry,
    setBOQ, runMatching, setBOQItems: setBOQItemsWithPersistence,
  };
}
