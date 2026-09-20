import React from 'react';
import {
  Bell,
  X,
  AlertTriangle,
  Flame,
  CheckCircle2,
  Calendar,
  Clock,
  ArrowRight,
  Trash2,
  CheckCheck,
} from 'lucide-react';
import { AppNotification, ThemeMode } from '../types';

interface NotificationCenterModalProps {
  isOpen: boolean;
  onClose: () => void;
  notifications: AppNotification[];
  onMarkAsRead: (id: string) => void;
  onMarkAllAsRead: () => void;
  onClearAll: () => void;
  onNavigate: (tab: string) => void;
  theme: ThemeMode;
}

export const NotificationCenterModal: React.FC<NotificationCenterModalProps> = ({
  isOpen,
  onClose,
  notifications,
  onMarkAsRead,
  onMarkAllAsRead,
  onClearAll,
  onNavigate,
  theme,
}) => {
  if (!isOpen) return null;

  const isDark =
    theme === 'auto'
      ? typeof window !== 'undefined' && window.matchMedia
        ? window.matchMedia('(prefers-color-scheme: dark)').matches
        : true
      : theme === 'dark';
  const unreadCount = notifications.filter((n) => !n.read).length;

  const getIcon = (type: AppNotification['type']) => {
    switch (type) {
      case 'budget_exceeded':
        return <Flame className="text-rose-500" size={18} />;
      case 'category_limit':
        return <AlertTriangle className="text-amber-500" size={18} />;
      case 'daily_reminder':
        return <Clock className="text-[#007AFF]" size={18} />;
      case 'bank_loan_due':
        return <Calendar className="text-purple-400" size={18} />;
      default:
        return <Bell className="text-[#007AFF]" size={18} />;
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-md animate-fade-in">
      <div
        className={`w-full max-w-md rounded-[32px] overflow-hidden border shadow-2xl transition-all ${
          isDark
            ? 'border-white/10 bg-[#1C1C1E]/95 text-white'
            : 'border-black/10 bg-white/95 text-black'
        } liquid-glass flex flex-col max-h-[85vh]`}
      >
        {/* Header */}
        <div className={`flex items-center justify-between px-6 py-4 border-b ${isDark ? 'border-white/5' : 'border-slate-100'}`}>
          <div className="flex items-center gap-2.5">
            <div className="flex h-9 w-9 items-center justify-center rounded-2xl bg-[#007AFF]/15 text-[#007AFF]">
              <Bell size={18} />
            </div>
            <div>
              <h3 className={`text-base font-extrabold tracking-tight ${isDark ? 'text-white' : 'text-slate-900'}`}>Alerts & Notifications</h3>
              <p className={`text-[11px] ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
                {unreadCount > 0 ? `${unreadCount} unread alerts` : 'All alerts up to date'}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-1">
            {notifications.length > 0 && (
              <button
                onClick={onMarkAllAsRead}
                title="Mark all as read"
                className={`p-2 rounded-xl transition ${isDark ? 'text-slate-400 hover:text-[#007AFF] hover:bg-white/5' : 'text-slate-500 hover:text-[#007AFF] hover:bg-slate-100'}`}
              >
                <CheckCheck size={16} />
              </button>
            )}
            <button
              onClick={onClose}
              className={`p-2 rounded-xl transition ${isDark ? 'text-slate-400 hover:text-white hover:bg-white/5' : 'text-slate-500 hover:text-slate-900 hover:bg-slate-100'}`}
            >
              <X size={18} />
            </button>
          </div>
        </div>

        {/* List of alerts */}
        <div className="flex-1 overflow-y-auto p-4 space-y-3">
          {notifications.length === 0 ? (
            <div className="py-12 text-center text-slate-400">
              <CheckCircle2 size={36} className="mx-auto mb-2 text-[#34C759] opacity-70" />
              <p className={`text-sm font-semibold ${isDark ? 'text-white' : 'text-slate-900'}`}>No active alerts</p>
              <p className={`text-xs mt-1 ${isDark ? 'text-slate-400' : 'text-slate-600'}`}>
                You are well within your daily allowance and category spending limits!
              </p>
            </div>
          ) : (
            notifications.map((n) => {
              let timeFormatted = '';
              try {
                if (n.timestamp) {
                  const d = new Date(n.timestamp);
                  if (!isNaN(d.getTime())) {
                    timeFormatted = d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
                  } else {
                    timeFormatted = n.timestamp.slice(11, 16) || n.timestamp.slice(0, 10);
                  }
                }
              } catch {
                timeFormatted = '';
              }

              return (
                <div
                  key={n.id}
                  onClick={() => {
                    try {
                      if (!n.read && onMarkAsRead) onMarkAsRead(n.id);
                      if (n.actionScreen && onNavigate) {
                        onNavigate(n.actionScreen);
                      }
                      onClose();
                    } catch (err) {
                      console.error('Error navigating from notification', err);
                    }
                  }}
                  className={`p-4 rounded-2xl border transition cursor-pointer ${
                    !n.read
                      ? isDark
                        ? 'bg-[#007AFF]/10 border-[#007AFF]/30'
                        : 'bg-[#007AFF]/5 border-[#007AFF]/20'
                      : isDark
                      ? 'bg-white/[0.02] border-white/5 opacity-75'
                      : 'bg-black/[0.02] border-black/5 opacity-75'
                  }`}
                >
                  <div className="flex items-start gap-3">
                    <div className="mt-0.5 shrink-0">{getIcon(n.type)}</div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between gap-2">
                        <h4 className={`text-xs font-bold leading-tight truncate ${isDark ? 'text-white' : 'text-slate-900'}`}>{n.title}</h4>
                        {timeFormatted && (
                          <span className={`text-[10px] shrink-0 font-numeric ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
                            {timeFormatted}
                          </span>
                        )}
                      </div>
                      <p className={`text-[11px] mt-1 leading-snug ${isDark ? 'text-slate-300' : 'text-slate-600'}`}>{n.message}</p>

                      {n.actionScreen && (
                        <div className="mt-2.5 flex items-center gap-1 text-[11px] font-bold text-[#007AFF]">
                          <span>Review in {n.actionScreen}</span>
                          <ArrowRight size={12} />
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* Footer actions */}
        {notifications.length > 0 && (
          <div className={`p-4 border-t flex items-center justify-between text-xs ${isDark ? 'border-white/5' : 'border-slate-100'}`}>
            <button
              onClick={onClearAll}
              className={`flex items-center gap-1.5 transition font-medium text-[11px] ${isDark ? 'text-slate-400 hover:text-rose-400' : 'text-slate-500 hover:text-rose-600'}`}
            >
              <Trash2 size={13} />
              <span>Clear History</span>
            </button>
            <button
              onClick={onClose}
              className={`px-4 py-1.5 rounded-xl text-xs font-bold transition ${
                isDark
                  ? 'bg-white/10 hover:bg-white/15 text-white'
                  : 'bg-slate-100 hover:bg-slate-200 text-slate-800'
              }`}
            >
              Done
            </button>
          </div>
        )}
      </div>
    </div>
  );
};
