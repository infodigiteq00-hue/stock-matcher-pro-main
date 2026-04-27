import { motion } from 'framer-motion';
import { TabType } from '@/types/inventory';
import { Package, Layers, Upload, BarChart3 } from 'lucide-react';
import { useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { HoverCard, HoverCardContent, HoverCardTrigger } from '@/components/ui/hover-card';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';

const tabs: { key: TabType; label: string; icon: React.ReactNode }[] = [
  { key: 'stock', label: 'Stock', icon: <Package size={18} /> },
  { key: 'leftover', label: 'Leftovers', icon: <Layers size={18} /> },
  { key: 'boq', label: 'BOQ Upload', icon: <Upload size={18} /> },
  { key: 'dashboard', label: 'Dashboard', icon: <BarChart3 size={18} /> },
];

export default function AppHeader({ activeTab, onTabChange }: { activeTab: TabType; onTabChange: (t: TabType) => void }) {
  const navigate = useNavigate();

  const authUser = useMemo(() => {
    try {
      const raw = localStorage.getItem('authUser');
      return raw ? JSON.parse(raw) : null;
    } catch {
      return null;
    }
  }, []);

  const authRole = localStorage.getItem('authRole') || 'user';
  const displayName = authUser?.fullName || 'User';
  const displayEmail = authUser?.email || 'No email';
  const initials = displayName
    .split(' ')
    .filter(Boolean)
    .slice(0, 2)
    .map((part: string) => part[0]?.toUpperCase() || '')
    .join('') || 'U';

  const handleLogout = () => {
    localStorage.removeItem('authUser');
    localStorage.removeItem('authRole');
    navigate('/login');
  };

  return (
    <header className="sticky top-0 z-50 glass-card border-b">
      <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-lg bg-primary flex items-center justify-center">
            <Package size={18} className="text-primary-foreground" />
          </div>
          <div>
            <h1 className="text-lg font-semibold tracking-tight text-foreground">StoreManager</h1>
            <p className="text-xs text-muted-foreground">New Age Inventory Management & Stock Matching System</p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <nav className="flex items-center gap-1 bg-secondary rounded-xl p-1">
            {tabs.map(tab => (
              <button
                key={tab.key}
                onClick={() => onTabChange(tab.key)}
                className={`relative flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                  activeTab === tab.key ? 'text-primary-foreground' : 'text-muted-foreground hover:text-foreground'
                }`}
              >
                {activeTab === tab.key && (
                  <motion.div
                    layoutId="activeTab"
                    className="absolute inset-0 bg-primary rounded-lg"
                    transition={{ type: 'spring', stiffness: 400, damping: 30 }}
                  />
                )}
                <span className="relative z-10 flex items-center gap-2">
                  {tab.icon}
                  <span className="hidden sm:inline">{tab.label}</span>
                </span>
              </button>
            ))}
          </nav>
          <HoverCard openDelay={120} closeDelay={80}>
            <HoverCardTrigger asChild>
              <button className="flex items-center rounded-xl border bg-card p-2 text-left hover:bg-accent transition-colors">
                <Avatar className="h-8 w-8">
                  <AvatarFallback className="text-xs font-semibold">{initials}</AvatarFallback>
                </Avatar>
              </button>
            </HoverCardTrigger>
            <HoverCardContent align="end" className="w-72">
              <div className="space-y-2">
                <p className="text-sm font-semibold">{displayName}</p>
                <p className="text-xs text-muted-foreground">{displayEmail}</p>
                <p className="text-xs text-muted-foreground capitalize">Role: {authRole}</p>
                <Button type="button" variant="destructive" className="w-full" onClick={handleLogout}>
                  Logout
                </Button>
              </div>
            </HoverCardContent>
          </HoverCard>
        </div>
      </div>
    </header>
  );
}
