import React, { useEffect, useState, useRef } from "react";
import { Bell, CheckCircle, Loader2, ArrowRight } from "lucide-react";
import { notificationApi } from "@/services/api";
import { formatDistanceToNow, parseISO } from "date-fns";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { profileApi } from "@/services/api";
import LoadingSpinner from '@/components/common/LoadingSpinner';
import EmptyState from '@/components/common/EmptyState';
import { useNavigate } from "react-router-dom";

interface Notification {
  id: number;
  type: string;
  title: string;
  message: string;
  data?: any;
  is_read: boolean;
  read_at?: string;
  created_at: string;
}

const NotificationBell: React.FC = () => {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [open, setOpen] = useState(false);
  const [userId, setUserId] = useState<number | null>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const { toast } = useToast();
  const navigate = useNavigate();

  // Fetch user ID on mount
  useEffect(() => {
    profileApi.getProfile().then(res => {
      setUserId(res.data.id);
    });
  }, []);

  // Removed Echo subscription useEffect

  const fetchNotifications = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await notificationApi.getNotifications();
      setNotifications(Array.isArray(res.data) ? res.data : res.data.data || []);
    } catch (err) {
      setError("Failed to load notifications");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchNotifications();
    // Optionally poll every 30s
    const interval = setInterval(fetchNotifications, 30000);
    return () => clearInterval(interval);
  }, []);

  // Close dropdown on outside click
  useEffect(() => {
    if (!open) return;
    const handleClick = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, [open]);

  const unreadCount = notifications.filter(n => !n.is_read).length;

  const handleMarkAsRead = async (id: number) => {
    try {
      await notificationApi.markAsRead(id);
      setNotifications(notifications => notifications.map(n => n.id === id ? { ...n, is_read: true, read_at: new Date().toISOString() } : n));
    } catch {}
  };

  const handleNotificationClick = (notification: Notification) => {
    // Mark as read if unread
    if (!notification.is_read) {
      handleMarkAsRead(notification.id);
    }
    
    // Close dropdown
    setOpen(false);
    
    // Navigate to notifications page
    navigate('/notifications');
  };

  const handleViewAllClick = () => {
    setOpen(false);
    navigate('/notifications');
  };

  return (
    <div className="relative" ref={dropdownRef}>
      <button
        className={`relative p-2 rounded-full hover:bg-gray-100 focus:outline-none ${unreadCount > 0 ? 'animate-bounce' : ''}`}
        onClick={() => setOpen(o => !o)}
        aria-label="Notifications"
        aria-haspopup="true"
        aria-expanded={open}
        tabIndex={0}
      >
        <Bell className="w-6 h-6 text-gray-600" aria-hidden="true" />
        {unreadCount > 0 && (
          <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full px-1.5 py-0.5 min-w-[18px] text-center animate-pulse" aria-live="polite">
            {unreadCount}
          </span>
        )}
      </button>
      {open && (
        <div className="absolute right-0 mt-2 w-80 max-w-xs bg-white border border-gray-200 rounded-xl shadow-lg z-50">
          <div className="p-4 border-b border-gray-100 flex items-center justify-between">
            <span className="font-semibold text-gray-900">Notifications</span>
            <Button size="sm" variant="ghost" onClick={fetchNotifications} disabled={loading}>
              <Loader2 className={`w-4 h-4 animate-spin ${loading ? '' : 'hidden'}`} />
              Refresh
            </Button>
          </div>
          <div className="max-h-80 overflow-y-auto divide-y divide-gray-100">
            {loading ? (
              <div className="p-6 flex items-center justify-center text-gray-500">
                <LoadingSpinner size={24} />
              </div>
            ) : error ? (
              <div className="p-6 text-center text-red-500">{error}</div>
            ) : notifications.length === 0 ? (
              <EmptyState message="No notifications" />
            ) : (
              notifications.map(n => (
                <div
                  key={n.id}
                  className={`flex items-start gap-3 px-4 py-3 cursor-pointer hover:bg-gray-50 ${!n.is_read ? 'bg-blue-50' : ''}`}
                  onClick={() => handleNotificationClick(n)}
                >
                  <div className="mt-1">
                    {!n.is_read ? <span className="inline-block w-2 h-2 bg-blue-500 rounded-full" /> : <CheckCircle className="w-4 h-4 text-gray-300" />}
                  </div>
                  <div className="flex-1">
                    <div className="font-medium text-gray-900 text-sm line-clamp-1">{n.title}</div>
                    <div className="text-xs text-gray-600 line-clamp-2">{n.message}</div>
                    <div className="text-xs text-gray-400 mt-1">{formatDistanceToNow(parseISO(n.created_at), { addSuffix: true })}</div>
                  </div>
                </div>
              ))
            )}
          </div>
          {notifications.length > 0 && (
            <div className="p-3 border-t border-gray-100">
              <Button 
                variant="ghost" 
                size="sm" 
                onClick={handleViewAllClick}
                className="w-full text-brand-orange hover:bg-brand-orange hover:text-white"
              >
                View All Notifications
                <ArrowRight className="w-4 h-4 ml-2" />
              </Button>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default NotificationBell; 