import React from 'react';
import {
  LayoutDashboard,
  Wallet,
  Plus,
  Receipt,
  Menu,
} from 'lucide-react';
import { ThemeMode } from '../types';

interface MainBottomBarProps {
  activeTab: string;
  onSelectTab: (tab: any) => void;
  onOpenSpeedDial: () => void;
  onOpenDrawer: () => void;
  theme: ThemeMode;
}

export const MainBottomBar: React.FC<MainBottomBarProps> = ({
  activeTab,
  onSelectTab,
  onOpenSpeedDial,
  onOpenDrawer,
  theme,
}) => {
  const isDark =
    theme === 'auto'
      ? typeof window !== 'undefined' && window.matchMedia
        ? window.matchMedia('(prefers-color-scheme: dark)').matches
        : true
      : theme === 'dark';

  return (
    <div className="fixed bottom-5 inset-x-0 z-40 flex justify-center pointer-events-none px-4">
      {/* Floating Apple Liquid Glass Dock (Rounded-[32px] / capsule) */}
      <nav
        aria-label="Main Navigation Dock"
        className={`pointer-events-auto flex items-center justify-between gap-5 sm:gap-7 rounded-[32px] px-6 py-2.5 transition-all duration-300 ${
          isDark
            ? 'specular-border-dark bg-[#1C1C1E]/65 text-white shadow-2xl'
            : 'specular-border-light bg-white/80 text-black shadow-[0_12px_40px_rgba(0,0,0,0.08)]'
        } liquid-glass`}
      >
        {/* Home Navigation */}
        <button
          onClick={() => onSelectTab('home')}
          className={`flex flex-col items-center gap-1 transition-all ${
            activeTab === 'home'
              ? 'text-[#007AFF] font-bold scale-105'
              : isDark
              ? 'text-[#98989D] hover:text-white'
              : 'text-[#8E8E93] hover:text-black'
          }`}
        >
          <LayoutDashboard size={20} />
          <span className="text-[10px] font-semibold tracking-wide">Home</span>
        </button>

        {/* Transactions Feed */}
        <button
          onClick={() => onSelectTab('transactions')}
          className={`flex flex-col items-center gap-1 transition-all ${
            activeTab === 'transactions'
              ? 'text-[#007AFF] font-bold scale-105'
              : isDark
              ? 'text-[#98989D] hover:text-white'
              : 'text-[#8E8E93] hover:text-black'
          }`}
        >
          <Receipt size={20} />
          <span className="text-[10px] font-semibold tracking-wide">Feed</span>
        </button>

        {/* Elevated 52dp + Action Button (Apple Blue to Indigo vibrant pill) */}
        <div className="-translate-y-4">
          <button
            onClick={onOpenSpeedDial}
            title="Add Transaction"
            className="flex h-[52px] w-[52px] items-center justify-center rounded-full bg-gradient-to-tr from-[#007AFF] to-[#5856D6] text-white shadow-xl shadow-[#007AFF]/30 border border-white/40 transition hover:scale-110 active:scale-95 ring-4 ring-black/5"
          >
            <Plus size={26} strokeWidth={2.5} />
          </button>
        </div>

        {/* Accounts Navigation */}
        <button
          onClick={() => onSelectTab('accounts')}
          className={`flex flex-col items-center gap-1 transition-all ${
            activeTab === 'accounts'
              ? 'text-[#007AFF] font-bold scale-105'
              : isDark
              ? 'text-[#98989D] hover:text-white'
              : 'text-[#8E8E93] hover:text-black'
          }`}
        >
          <Wallet size={20} />
          <span className="text-[10px] font-semibold tracking-wide">Accounts</span>
        </button>

        {/* Quick Access Drawer Trigger */}
        <button
          onClick={onOpenDrawer}
          className={`flex flex-col items-center gap-1 transition-all ${
            isDark ? 'text-[#98989D] hover:text-white' : 'text-[#8E8E93] hover:text-black'
          }`}
        >
          <Menu size={20} />
          <span className="text-[10px] font-semibold tracking-wide">More</span>
        </button>
      </nav>
    </div>
  );
};

