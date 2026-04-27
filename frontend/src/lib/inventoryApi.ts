import { BOQItem, LeftoverItem, MatchResult, StockItem, StockLedgerEntry } from '@/types/inventory';

export interface InventorySnapshot {
  stock: StockItem[];
  leftovers: LeftoverItem[];
  boqItems: BOQItem[];
  matchResults: MatchResult[];
  customShapes: string[];
  stockLedger: Record<string, StockLedgerEntry[]>;
}

const INVENTORY_API_PATH = '/api/inventory';

export async function loadInventorySnapshot(): Promise<InventorySnapshot> {
  const response = await fetch(INVENTORY_API_PATH);
  if (!response.ok) {
    throw new Error(`Failed to load inventory: ${response.status}`);
  }

  return response.json() as Promise<InventorySnapshot>;
}

export async function saveInventorySnapshot(snapshot: InventorySnapshot): Promise<void> {
  const response = await fetch(INVENTORY_API_PATH, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(snapshot),
  });

  if (!response.ok) {
    throw new Error(`Failed to save inventory: ${response.status}`);
  }
}
