import { motion } from 'framer-motion';
import { TabType } from '@/types/inventory';
import { Package, Layers, Upload, BarChart3, Menu } from 'lucide-react';
import { useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { HoverCard, HoverCardContent, HoverCardTrigger } from '@/components/ui/hover-card';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Sheet, SheetClose, SheetContent, SheetDescription, SheetHeader, SheetTitle, SheetTrigger } from '@/components/ui/sheet';

const tabs: { key: TabType; label: string; icon: React.ReactNode }[] = [
  { key: 'stock', label: 'Stock', icon: <Package size={18} /> },
  { key: 'leftover', label: 'Leftovers', icon: <Layers size={18} /> },
  { key: 'boq', label: 'BOQ Upload', icon: <Upload size={18} /> },
  { key: 'dashboard', label: 'Dashboard', icon: <BarChart3 size={18} /> },
];

export default function AppHeader({ activeTab, onTabChange }: { activeTab: TabType; onTabChange: (t: TabType) => void }) {
  const navigate = useNavigate();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

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

  const handleTabSelect = (tab: TabType) => {
    onTabChange(tab);
    setMobileMenuOpen(false);
  };

  return (
    <header className="sticky top-0 z-50 glass-card border-b">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-3 sm:py-4 flex items-center justify-between gap-3 sm:gap-4">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 sm:w-9 sm:h-9 rounded-lg bg-primary flex items-center justify-center shrink-0">
            <Package size={18} className="text-primary-foreground" />
          </div>
          <div className="min-w-0">
            <h1 className="text-base sm:text-lg font-semibold tracking-tight text-foreground truncate">StoreManager</h1>
            <p className="text-[11px] sm:text-xs text-muted-foreground hidden sm:block">
              New Age Inventory Management & Stock Matching System
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2 sm:gap-3">
          <nav className="hidden md:flex items-center gap-1 bg-secondary rounded-xl p-1">
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
              <button className="hidden md:flex items-center rounded-xl border bg-card p-2 text-left hover:bg-accent transition-colors">
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

          <Sheet open={mobileMenuOpen} onOpenChange={setMobileMenuOpen}>
            <SheetTrigger asChild>
              <button
                type="button"
                className="md:hidden inline-flex h-10 w-10 items-center justify-center rounded-xl border bg-card hover:bg-accent transition-colors"
                aria-label="Open menu"
              >
                <Menu size={18} />
              </button>
            </SheetTrigger>
            <SheetContent side="right" className="w-[85vw] max-w-sm px-4">
              <SheetHeader className="pr-8">
                <SheetTitle className="text-base">Menu</SheetTitle>
                <SheetDescription className="text-xs sm:text-sm">
                  Switch sections and manage your account.
                </SheetDescription>
              </SheetHeader>

              <div className="mt-5 space-y-2">
                {tabs.map((tab) => (
                  <Button
                    key={tab.key}
                    type="button"
                    variant={activeTab === tab.key ? "default" : "outline"}
                    className="w-full justify-start text-sm"
                    onClick={() => handleTabSelect(tab.key)}
                  >
                    <span className="inline-flex items-center gap-2">
                      {tab.icon}
                      <span>{tab.label}</span>
                    </span>
                  </Button>
                ))}
              </div>

              <div className="mt-6 rounded-xl border bg-card p-3 space-y-1">
                <p className="text-sm font-semibold break-words">{displayName}</p>
                <p className="text-xs text-muted-foreground break-all">{displayEmail}</p>
                <p className="text-xs text-muted-foreground capitalize">Role: {authRole}</p>
              </div>

              <SheetClose asChild>
                <Button type="button" variant="destructive" className="mt-4 w-full" onClick={handleLogout}>
                  Logout
                </Button>
              </SheetClose>
            </SheetContent>
          </Sheet>
        </div>
      </div>
    </header>
  );
}
