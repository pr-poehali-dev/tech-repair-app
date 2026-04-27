import { useState } from 'react';
import { Toaster } from "@/components/ui/toaster";
import Icon from '@/components/ui/icon';
import OrdersPage from '@/components/OrdersPage';
import MastersPage from '@/components/MastersPage';
import StatsPage from '@/components/StatsPage';
import HistoryPage from '@/components/HistoryPage';
import NotificationsPage from '@/components/NotificationsPage';
import ProfilePage from '@/components/ProfilePage';

type Tab = 'orders' | 'masters' | 'stats' | 'history' | 'notifications' | 'profile';

const tabs: { id: Tab; label: string; icon: string; badge?: number }[] = [
  { id: 'orders', label: 'Заявки', icon: 'ClipboardList', badge: 3 },
  { id: 'masters', label: 'Мастера', icon: 'HardHat' },
  { id: 'stats', label: 'Статистика', icon: 'BarChart3' },
  { id: 'history', label: 'История', icon: 'Archive' },
  { id: 'notifications', label: 'Уведомления', icon: 'Bell', badge: 3 },
  { id: 'profile', label: 'Профиль', icon: 'User' },
];

export default function App() {
  const [active, setActive] = useState<Tab>('orders');

  const renderPage = () => {
    switch (active) {
      case 'orders': return <OrdersPage />;
      case 'masters': return <MastersPage />;
      case 'stats': return <StatsPage />;
      case 'history': return <HistoryPage />;
      case 'notifications': return <NotificationsPage />;
      case 'profile': return <ProfilePage />;
    }
  };

  return (
    <div className="flex flex-col h-full bg-background max-w-lg mx-auto">
      <Toaster />

      {/* Page content */}
      <div className="flex-1 overflow-hidden">
        {renderPage()}
      </div>

      {/* Bottom navigation */}
      <nav className="flex-shrink-0 bg-[hsl(220,16%,8%)] border-t border-border nav-glow">
        <div className="flex items-stretch">
          {tabs.map((tab) => {
            const isActive = tab.id === active;
            return (
              <button
                key={tab.id}
                onClick={() => setActive(tab.id)}
                className={`flex-1 flex flex-col items-center justify-center py-2.5 gap-0.5 tap-highlight transition-all relative ${
                  isActive ? '' : 'opacity-45'
                }`}
              >
                <div className="relative">
                  <Icon
                    name={tab.icon}
                    size={22}
                    className={isActive ? 'text-primary' : 'text-foreground'}
                  />
                  {tab.badge && tab.badge > 0 && !isActive && (
                    <span className="absolute -top-1 -right-1.5 w-4 h-4 rounded-full bg-primary flex items-center justify-center text-[9px] font-bold text-primary-foreground">
                      {tab.badge}
                    </span>
                  )}
                </div>
                <span className={`text-[9px] font-medium leading-none ${isActive ? 'text-primary' : 'text-foreground'}`}>
                  {tab.label}
                </span>
                {isActive && (
                  <span className="absolute bottom-0 left-1/2 -translate-x-1/2 w-8 h-0.5 rounded-full bg-primary" />
                )}
              </button>
            );
          })}
        </div>
      </nav>
    </div>
  );
}
