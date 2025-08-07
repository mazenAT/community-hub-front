import React, { useState, useEffect } from 'react';
import { Bell, CheckCircle, Trash2, Filter, X, MessageSquare } from 'lucide-react';
import { notificationApi } from '@/services/api';
import { formatDistanceToNow, parseISO } from 'date-fns';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import LoadingSpinner from '@/components/common/LoadingSpinner';
import EmptyState from '@/components/common/EmptyState';

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

const Notifications: React.FC = () => {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [filter, setFilter] = useState<'all' | 'unread' | 'read'>('all');
  const [notificationType, setNotificationType] = useState<string>('all');
  const { toast } = useToast();

  const fetchNotifications = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await notificationApi.getNotifications();
      setNotifications(Array.isArray(res.data) ? res.data : res.data.data || []);
    } catch (err) {
      setError('Failed to load notifications');
      toast({
        title: 'Error',
        description: 'Failed to load notifications',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchNotifications();
  }, []);

  const handleMarkAsRead = async (id: number) => {
    try {
      await notificationApi.markAsRead(id);
      setNotifications(notifications => 
        notifications.map(n => n.id === id ? { ...n, is_read: true, read_at: new Date().toISOString() } : n)
      );
      toast({
        title: 'Success',
        description: 'Notification marked as read',
      });
    } catch (err) {
      toast({
        title: 'Error',
        description: 'Failed to mark notification as read',
        variant: 'destructive',
      });
    }
  };

  const handleMarkAllAsRead = async () => {
    try {
      await notificationApi.markAllAsRead();
      setNotifications(notifications => 
        notifications.map(n => ({ ...n, is_read: true, read_at: new Date().toISOString() }))
      );
      toast({
        title: 'Success',
        description: 'All notifications marked as read',
      });
    } catch (err) {
      toast({
        title: 'Error',
        description: 'Failed to mark all notifications as read',
        variant: 'destructive',
      });
    }
  };

  const handleDelete = async (id: number) => {
    try {
      await notificationApi.deleteNotification(id);
      setNotifications(notifications => notifications.filter(n => n.id !== id));
      toast({
        title: 'Success',
        description: 'Notification deleted',
      });
    } catch (err) {
      toast({
        title: 'Error',
        description: 'Failed to delete notification',
        variant: 'destructive',
      });
    }
  };

  const filteredNotifications = notifications.filter(notification => {
    const matchesFilter = filter === 'all' || 
      (filter === 'unread' && !notification.is_read) ||
      (filter === 'read' && notification.is_read);
    
    const matchesType = notificationType === 'all' || notification.type === notificationType;
    
    return matchesFilter && matchesType;
  });

  const unreadCount = notifications.filter(n => !n.is_read).length;
  const filteredUnreadCount = filteredNotifications.filter(n => !n.is_read).length;

  const getNotificationIcon = (type: string) => {
    switch (type) {
      case 'contact_response':
        return <MessageSquare className="w-5 h-5 text-blue-500" />;
      default:
        return <Bell className="w-5 h-5 text-gray-500" />;
    }
  };

  const renderContactResponseNotification = (notification: Notification) => {
    if (notification.type !== 'contact_response' || !notification.data) {
      return null;
    }

    return (
      <div className="mt-3 p-3 bg-gray-50 rounded-lg border-l-4 border-blue-500">
        <div className="text-sm font-medium text-gray-900 mb-2">Admin Response:</div>
        <div className="text-sm text-gray-700 mb-2">{notification.data.admin_response}</div>
        <div className="text-xs text-gray-500">
          <div className="font-medium mb-1">Your original message:</div>
          <div className="italic">{notification.data.original_message}</div>
        </div>
      </div>
    );
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <LoadingSpinner size={48} />
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="text-red-500 mb-4">{error}</div>
          <Button onClick={fetchNotifications}>Try Again</Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-200 px-4 py-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <Bell className="w-6 h-6 text-brand-orange" />
            <h1 className="text-xl font-semibold text-gray-900">Notifications</h1>
            {unreadCount > 0 && (
              <span className="bg-red-500 text-white text-xs rounded-full px-2 py-1">
                {unreadCount}
              </span>
            )}
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={handleMarkAllAsRead}
            disabled={unreadCount === 0}
          >
            Mark All as Read
          </Button>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white border-b border-gray-200 px-4 py-3">
        <div className="flex flex-wrap gap-3">
          {/* Status Filter */}
          <div className="flex items-center space-x-2">
            <Filter className="w-4 h-4 text-gray-500" />
            <select
              value={filter}
              onChange={(e) => setFilter(e.target.value as 'all' | 'unread' | 'read')}
              className="text-sm border border-gray-300 rounded-md px-3 py-1 focus:outline-none focus:ring-2 focus:ring-brand-orange"
            >
              <option value="all">All ({notifications.length})</option>
              <option value="unread">Unread ({unreadCount})</option>
              <option value="read">Read ({notifications.length - unreadCount})</option>
            </select>
          </div>

          {/* Type Filter */}
          <div className="flex items-center space-x-2">
            <select
              value={notificationType}
              onChange={(e) => setNotificationType(e.target.value)}
              className="text-sm border border-gray-300 rounded-md px-3 py-1 focus:outline-none focus:ring-2 focus:ring-brand-orange"
            >
              <option value="all">All Types</option>
              <option value="contact_response">Contact Responses</option>
              <option value="system">System</option>
            </select>
          </div>

          {/* Clear Filters */}
          {(filter !== 'all' || notificationType !== 'all') && (
            <Button
              variant="ghost"
              size="sm"
              onClick={() => {
                setFilter('all');
                setNotificationType('all');
              }}
              className="text-gray-500 hover:text-gray-700"
            >
              <X className="w-4 h-4 mr-1" />
              Clear
            </Button>
          )}
        </div>
      </div>

      {/* Notifications List */}
      <div className="px-4 py-4">
        {filteredNotifications.length === 0 ? (
          <EmptyState 
            message={notifications.length === 0 ? "No notifications yet" : "No notifications match your filters"}
          />
        ) : (
          <div className="space-y-3">
            {filteredNotifications.map((notification) => (
              <div
                key={notification.id}
                className={`bg-white rounded-lg border p-4 transition-all duration-200 ${
                  !notification.is_read 
                    ? 'border-blue-200 bg-blue-50 shadow-sm' 
                    : 'border-gray-200 hover:shadow-sm'
                }`}
              >
                <div className="flex items-start justify-between">
                  <div className="flex items-start space-x-3 flex-1">
                    <div className="mt-1">
                      {getNotificationIcon(notification.type)}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center space-x-2 mb-1">
                        <h3 className="font-medium text-gray-900 text-sm line-clamp-1">
                          {notification.title}
                        </h3>
                        {!notification.is_read && (
                          <span className="inline-block w-2 h-2 bg-blue-500 rounded-full flex-shrink-0" />
                        )}
                      </div>
                      <p className="text-sm text-gray-600 mb-2 line-clamp-2">
                        {notification.message}
                      </p>
                      <div className="text-xs text-gray-400">
                        {formatDistanceToNow(parseISO(notification.created_at), { addSuffix: true })}
                      </div>
                      
                      {/* Special rendering for contact responses */}
                      {renderContactResponseNotification(notification)}
                    </div>
                  </div>
                  
                  <div className="flex items-center space-x-2 ml-3">
                    {!notification.is_read && (
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleMarkAsRead(notification.id)}
                        className="text-blue-600 hover:text-blue-800 hover:bg-blue-100"
                      >
                        <CheckCircle className="w-4 h-4" />
                      </Button>
                    )}
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleDelete(notification.id)}
                      className="text-red-600 hover:text-red-800 hover:bg-red-100"
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default Notifications; 