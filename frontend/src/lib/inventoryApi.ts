import { BOQItem, LeftoverItem, MatchResult, StockItem, StockLedgerEntry } from '@/types/inventory';
import { toApiUrl } from "./apiBase";

export interface InventorySnapshot {
  stock: StockItem[];
  leftovers: LeftoverItem[];
  boqItems: BOQItem[];
  matchResults: MatchResult[];
  customShapes: string[];
  stockLedger: Record<string, StockLedgerEntry[]>;
}

const INVENTORY_API_PATH = toApiUrl("/api/inventory");

const getInventoryHeaders = (): HeadersInit => {
  const authRole = localStorage.getItem("authRole") || "";
  const authUserRaw = localStorage.getItem("authUser");
  let userId = "";

  if (authUserRaw) {
    try {
      const parsed = JSON.parse(authUserRaw) as { id?: string };
      userId = typeof parsed?.id === "string" ? parsed.id : "";
    } catch {
      userId = "";
    }
  }

  return {
    "x-user-role": authRole,
    "x-user-id": userId,
  };
};

export async function loadInventorySnapshot(): Promise<InventorySnapshot> {
  const response = await fetch(INVENTORY_API_PATH, {
    headers: getInventoryHeaders(),
  });
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
      ...getInventoryHeaders(),
    },
    body: JSON.stringify(snapshot),
  });

  if (!response.ok) {
    throw new Error(`Failed to save inventory: ${response.status}`);
  }
}
