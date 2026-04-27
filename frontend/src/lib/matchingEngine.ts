import { StockItem, LeftoverItem, BOQItem, MatchResult } from '@/types/inventory';

export type MatchPriority = 'stock' | 'leftover';

export function runMatchingEngine(
  boqItems: BOQItem[],
  stock: StockItem[],
  leftovers: LeftoverItem[],
  priority: MatchPriority = 'stock'
): { results: MatchResult[]; updatedStock: StockItem[]; updatedLeftovers: LeftoverItem[] } {
  const updatedStock = stock.map(s => ({ ...s }));
  const updatedLeftovers = leftovers.map(l => ({ ...l }));
  const results: MatchResult[] = [];

  for (const boq of boqItems) {
    let remaining = boq.quantity;
    let fromStock = 0;
    let fromLeftover = 0;
    let stockSource = '';
    let leftoverSource = '';

    const checkStock = () => {
      for (const item of updatedStock) {
        if (remaining <= 0) break;
        if (
          item.material.toLowerCase() === boq.material.toLowerCase() &&
          item.length >= boq.length &&
          item.width >= boq.width &&
          item.thickness >= boq.thickness
        ) {
          const available = item.quantity - item.allocated;
          if (available > 0) {
            const take = Math.min(available, remaining);
            item.allocated += take;
            fromStock += take;
            remaining -= take;
            stockSource = item.id;
          }
        }
      }
    };

    const checkLeftovers = () => {
      for (const lo of updatedLeftovers) {
        if (remaining <= 0) break;
        if (
          lo.material.toLowerCase() === boq.material.toLowerCase() &&
          lo.length >= boq.length &&
          lo.width >= boq.width &&
          lo.thickness >= boq.thickness
        ) {
          const available = lo.quantity;
          if (available > 0) {
            const take = Math.min(available, remaining);
            lo.quantity -= take;
            fromLeftover += take;
            remaining -= take;
            leftoverSource = lo.id;
            if (lo.quantity > 0) {
              lo.remainingArea = (lo.length * lo.width) / 1_000_000;
            }
          }
        }
      }
    };

    if (priority === 'stock') {
      checkStock();
      checkLeftovers();
    } else {
      checkLeftovers();
      checkStock();
    }

    const toPurchase = remaining;
    const status: MatchResult['status'] =
      toPurchase === 0 ? 'Complete' : fromStock + fromLeftover > 0 ? 'Partial' : 'Pending';

    results.push({
      boqItem: boq,
      fromStock,
      fromLeftover,
      toPurchase,
      status,
      stockSource: stockSource || undefined,
      leftoverSource: leftoverSource || undefined,
    });
  }

  return { results, updatedStock, updatedLeftovers };
}
