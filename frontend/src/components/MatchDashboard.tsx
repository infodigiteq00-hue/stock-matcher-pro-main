import { MatchResult } from '@/types/inventory';
import { motion } from 'framer-motion';
import { CheckCircle2, AlertCircle, Clock, Package, TrendingUp, ShoppingCart } from 'lucide-react';

export default function MatchDashboard({ results }: { results: MatchResult[] }) {
  const complete = results.filter(r => r.status === 'Complete').length;
  const partial = results.filter(r => r.status === 'Partial').length;
  const pending = results.filter(r => r.status === 'Pending').length;
  const totalRequired = results.reduce((s, r) => s + r.boqItem.quantity, 0);
  const totalFromStock = results.reduce((s, r) => s + r.fromStock, 0);
  const totalFromLeftover = results.reduce((s, r) => s + r.fromLeftover, 0);
  const totalToPurchase = results.reduce((s, r) => s + r.toPurchase, 0);

  if (results.length === 0) {
    return (
      <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} className="flex flex-col items-center justify-center py-24 text-center">
        <div className="w-16 h-16 rounded-2xl bg-secondary flex items-center justify-center mb-4">
          <TrendingUp size={28} className="text-muted-foreground" />
        </div>
        <h2 className="text-xl font-semibold text-foreground">No Results Yet</h2>
        <p className="text-sm text-muted-foreground mt-2 max-w-md">Upload a BOQ and run the matching engine to see your stock allocation results here.</p>
      </motion.div>
    );
  }

  const statusIcon = (s: string) => {
    if (s === 'Complete') return <CheckCircle2 size={16} className="text-success" />;
    if (s === 'Partial') return <AlertCircle size={16} className="text-warning" />;
    return <Clock size={16} className="text-destructive" />;
  };

  const statusBadge = (s: string) => {
    const styles = {
      Complete: 'bg-success/10 text-success',
      Partial: 'bg-warning/10 text-warning',
      Pending: 'bg-destructive/10 text-destructive',
    }[s] || '';
    return (
      <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-medium ${styles}`}>
        {statusIcon(s)} {s}
      </span>
    );
  };

  const cards = [
    { label: 'Total Items', value: results.length, icon: <Package size={20} />, color: 'bg-primary/10 text-primary' },
    { label: 'From Stock', value: totalFromStock, icon: <CheckCircle2 size={20} />, color: 'bg-success/10 text-success' },
    { label: 'From Leftovers', value: totalFromLeftover, icon: <TrendingUp size={20} />, color: 'bg-warning/10 text-warning' },
    { label: 'To Purchase', value: totalToPurchase, icon: <ShoppingCart size={20} />, color: 'bg-destructive/10 text-destructive' },
  ];

  return (
    <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} className="space-y-6">
      <div>
        <h2 className="text-xl font-semibold text-foreground">Matching Results</h2>
        <p className="text-sm text-muted-foreground mt-1">
          {complete} complete · {partial} partial · {pending} pending
        </p>
      </div>

      {/* Summary cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {cards.map((card, i) => (
          <motion.div
            key={card.label}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.08 }}
            className="glass-card rounded-2xl p-5"
          >
            <div className={`w-10 h-10 rounded-xl flex items-center justify-center mb-3 ${card.color}`}>
              {card.icon}
            </div>
            <p className="text-2xl font-bold text-foreground">{card.value}</p>
            <p className="text-xs text-muted-foreground mt-1">{card.label}</p>
          </motion.div>
        ))}
      </div>

      {/* Fulfillment bar */}
      <div className="glass-card rounded-2xl p-5">
        <p className="text-sm font-medium text-foreground mb-3">Overall Fulfillment</p>
        <div className="h-3 bg-secondary rounded-full overflow-hidden flex">
          {totalFromStock > 0 && (
            <motion.div
              initial={{ width: 0 }}
              animate={{ width: `${(totalFromStock / totalRequired) * 100}%` }}
              transition={{ duration: 0.8, ease: 'easeOut' }}
              className="bg-success h-full"
            />
          )}
          {totalFromLeftover > 0 && (
            <motion.div
              initial={{ width: 0 }}
              animate={{ width: `${(totalFromLeftover / totalRequired) * 100}%` }}
              transition={{ duration: 0.8, ease: 'easeOut', delay: 0.2 }}
              className="bg-warning h-full"
            />
          )}
        </div>
        <div className="flex gap-6 mt-3 text-xs text-muted-foreground">
          <span className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded-full bg-success" /> Stock ({Math.round((totalFromStock / totalRequired) * 100)}%)</span>
          <span className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded-full bg-warning" /> Leftover ({Math.round((totalFromLeftover / totalRequired) * 100)}%)</span>
          <span className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded-full bg-destructive" /> Purchase ({Math.round((totalToPurchase / totalRequired) * 100)}%)</span>
        </div>
      </div>

      {/* Results table */}
      <div className="glass-card rounded-2xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b bg-secondary/50">
                <th className="text-left py-3 px-4 font-medium text-muted-foreground">Item Name</th>
                <th className="text-left py-3 px-4 font-medium text-muted-foreground">Material</th>
                <th className="text-right py-3 px-4 font-medium text-muted-foreground">Required</th>
                <th className="text-right py-3 px-4 font-medium text-muted-foreground">From Stock</th>
                <th className="text-right py-3 px-4 font-medium text-muted-foreground">From Leftover</th>
                <th className="text-right py-3 px-4 font-medium text-muted-foreground">To Purchase</th>
                <th className="text-left py-3 px-4 font-medium text-muted-foreground">Status</th>
              </tr>
            </thead>
            <tbody>
              {results.map((r, i) => (
                <motion.tr
                  key={i}
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: i * 0.04 }}
                  className="border-b border-border/50 hover:bg-secondary/30 transition-colors"
                >
                  <td className="py-3 px-4 font-medium text-foreground">{r.boqItem.itemName}</td>
                  <td className="py-3 px-4">
                    <span className="px-2 py-0.5 rounded-md bg-primary/10 text-primary text-xs font-medium">{r.boqItem.material}</span>
                  </td>
                  <td className="py-3 px-4 text-right text-foreground">{r.boqItem.quantity}</td>
                  <td className="py-3 px-4 text-right font-medium text-success">{r.fromStock || '—'}</td>
                  <td className="py-3 px-4 text-right font-medium text-warning">{r.fromLeftover || '—'}</td>
                  <td className="py-3 px-4 text-right font-medium text-destructive">{r.toPurchase || '—'}</td>
                  <td className="py-3 px-4">{statusBadge(r.status)}</td>
                </motion.tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </motion.div>
  );
}
