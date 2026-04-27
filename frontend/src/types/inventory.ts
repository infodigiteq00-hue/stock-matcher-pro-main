export interface StockItem {
  id: string;
  itemName: string;
  material: string;
  length: number;
  width: number;
  thickness: number;
  quantity: number;
  unit: string;
  location: string;
  allocated: number;
  remarks?: string;
  certificates?: CertificateFile[];
}

export interface CertificateFile {
  name: string;
  url: string;
  mimeType?: string;
  uploadedAt: string;
}

export interface LeftoverItem {
  id: string;
  parentItemRef: string;
  material: string;
  length: number;
  width: number;
  thickness: number;
  quantity: number;
  shapeType: string;
  remainingArea: number;
  createdFrom: string;
}

export interface BOQItem {
  itemName: string;
  material: string;
  length: number;
  width: number;
  thickness: number;
  quantity: number;
  unit: string;
}

export interface MatchResult {
  boqItem: BOQItem;
  fromStock: number;
  fromLeftover: number;
  toPurchase: number;
  status: 'Complete' | 'Partial' | 'Pending';
  stockSource?: string;
  leftoverSource?: string;
}

export type StockLedgerTransactionType = 'Issue' | 'Return' | 'Addition' | 'Opening';

export interface StockLedgerEntry {
  id: string;
  stockItemId: string;
  dateTime: string;
  transactionType: StockLedgerTransactionType;
  quantityChange: number;
  balanceAfterTransaction: number;
  givenTo: string;
  projectReference: string;
  entryCreatedBy: string;
  remarks: string;
}

export type TabType = 'stock' | 'leftover' | 'boq' | 'dashboard';
