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
  const [retryCount, setRetryCount] = useState(0);
  const [retryDelay, setRetryDelay] = useState(1000); // Start with 1 second
  const [notificationsDisabled, setNotificationsDisabled] = useState(false);

  // Fetch user ID on mount
  useEffect(() => {
    profileApi.getProfile().then(res => {
      setUserId(res.data.id);
    });
  }, []);

  // Removed Echo subscription useEffect

  const fetchNotifications = async (isRetry = false) => {
    if (isRetry) {
      setRetryCount(prev => prev + 1);
    }
    
    setLoading(true);
    setError(null);
    try {
      const res = await notificationApi.getNotifications();
      
      // Ensure notifications is always an array
      let notificationsData = [];
      if (res.data && Array.isArray(res.data)) {
        notificationsData = res.data;
      } else if (res.data && res.data.data && Array.isArray(res.data.data)) {
        notificationsData = res.data.data;
      } else {
        notificationsData = [];
      }
      
      setNotifications(notificationsData);
      
      // Reset retry count on success
      setRetryCount(0);
      setRetryDelay(1000);
      setNotificationsDisabled(false);
    } catch (err: any) {
      console.error('Failed to fetch notifications:', err);
      
      // Set empty array on error to prevent filter issues
      setNotifications([]);
      
      // Handle different types of errors
      if (err.message?.includes('Network error') || err.message?.includes('CORS')) {
        if (retryCount < 3) {
          // Exponential backoff retry for CORS/network issues
          const nextDelay = retryDelay * 2;
          setRetryDelay(nextDelay);
          setError(`Network error - retrying in ${nextDelay/1000}s... (${retryCount + 1}/3)`);
          
          setTimeout(() => {
            fetchNotifications(true);
          }, nextDelay);
        } else {
          setError("Network error - notifications temporarily unavailable. This may be a CORS issue.");
          setNotificationsDisabled(true);
        }
      } else if (err.response?.status === 401) {
        setError("Authentication required");
      } else {
        setError("Failed to load notifications");
      }
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

  const unreadCount = Array.isArray(notifications) ? notifications.filter(n => !n.is_read).length : 0;

  const handleMarkAsRead = async (id: number) => {
    try {
      await notificationApi.markAsRead(id);
      setNotifications(notifications => {
        if (Array.isArray(notifications)) {
          return notifications.map(n => n.id === id ? { ...n, is_read: true, read_at: new Date().toISOString() } : n);
        }
        return [];
      });
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
        data-tutorial="notifications"
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
            <Button size="sm" variant="ghost" onClick={() => fetchNotifications()} disabled={loading}>
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
              <div className="p-6 text-center">
                <div className="text-red-500 mb-3">{error}</div>
                {notificationsDisabled ? (
                  <div className="text-xs text-gray-500 mb-3">
                    This appears to be a CORS issue. The backend needs to allow requests from this domain.
                  </div>
                ) : null}
                <Button 
                  size="sm" 
                  variant="outline" 
                  onClick={() => fetchNotifications()}
                  className="text-brand-orange border-brand-orange hover:bg-brand-orange hover:text-white"
                >
                  Retry
                </Button>
              </div>
            ) : Array.isArray(notifications) && notifications.length === 0 ? (
              <EmptyState message="No notifications" />
            ) : Array.isArray(notifications) ? (
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
            ) : (
              <EmptyState message="Unable to load notifications" />
            )}
          </div>
          {Array.isArray(notifications) && notifications.length > 0 && (
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