import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Modal,
  FlatList,
  ActivityIndicator,
  Alert,
  RefreshControl,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import {
  getNotifications,
  getNotificationCounts,
  markNotificationsAsRead,
  deleteNotification,
  subscribeToNotifications,
  type Notification,
  type NotificationCounts,
} from '../utils/notifications';

interface NotificationCenterProps {
  visible: boolean;
  onClose: () => void;
  onNotificationPress?: (notification: Notification) => void;
}

const getNotificationIcon = (type: Notification['type']) => {
  switch (type) {
    case 'new_follower':
      return 'person-add';
    case 'new_validation':
      return 'checkmark-circle';
    case 'clip_validated':
      return 'shield-checkmark';
    case 'new_comment':
      return 'chatbubble';
    case 'mention':
      return 'at';
    case 'achievement':
      return 'trophy';
    case 'welcome':
      return 'sparkles';
    default:
      return 'notifications';
  }
};

const getNotificationColor = (type: Notification['type']) => {
  switch (type) {
    case 'new_follower':
      return '#3B82F6';
    case 'new_validation':
      return '#10B981';
    case 'clip_validated':
      return '#F59E0B';
    case 'new_comment':
      return '#8B5CF6';
    case 'mention':
      return '#EF4444';
    case 'achievement':
      return '#FFD700';
    case 'welcome':
      return '#FF8A00';
    default:
      return '#6B7280';
  }
};

const formatTimeAgo = (dateString: string): string => {
  const now = new Date();
  const date = new Date(dateString);
  const diffInSeconds = Math.floor((now.getTime() - date.getTime()) / 1000);

  if (diffInSeconds < 60) return 'Just now';
  if (diffInSeconds < 3600) return `${Math.floor(diffInSeconds / 60)}m ago`;
  if (diffInSeconds < 86400) return `${Math.floor(diffInSeconds / 3600)}h ago`;
  if (diffInSeconds < 2592000) return `${Math.floor(diffInSeconds / 86400)}d ago`;
  if (diffInSeconds < 31536000) return `${Math.floor(diffInSeconds / 2592000)}mo ago`;
  return `${Math.floor(diffInSeconds / 31536000)}y ago`;
};

export const NotificationCenter: React.FC<NotificationCenterProps> = ({
  visible,
  onClose,
  onNotificationPress,
}) => {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [notificationCounts, setNotificationCounts] = useState<NotificationCounts | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  useEffect(() => {
    if (visible) {
      loadNotifications();
      loadNotificationCounts();
      setupRealtimeSubscription();
    }
  }, [visible]);

  const loadNotifications = async () => {
    try {
      setLoading(true);
      const data = await getNotifications(50, 0);
      setNotifications(data);
    } catch (error) {
      console.error('Error loading notifications:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadNotificationCounts = async () => {
    try {
      const counts = await getNotificationCounts();
      setNotificationCounts(counts);
    } catch (error) {
      console.error('Error loading notification counts:', error);
    }
  };

  const setupRealtimeSubscription = async () => {
    try {
      const unsubscribe = await subscribeToNotifications((newNotification) => {
        setNotifications(prev => [newNotification, ...prev]);
        loadNotificationCounts(); // Refresh counts
      });

      return unsubscribe;
    } catch (error) {
      console.error('Error setting up notification subscription:', error);
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await Promise.all([loadNotifications(), loadNotificationCounts()]);
    setRefreshing(false);
  };

  const handleNotificationPress = async (notification: Notification) => {
    // Mark as read if not already read
    if (!notification.is_read) {
      await markNotificationsAsRead([notification.id]);
      setNotifications(prev =>
        prev.map(n =>
          n.id === notification.id ? { ...n, is_read: true } : n
        )
      );
      loadNotificationCounts(); // Refresh counts
    }

    // Call the parent handler
    onNotificationPress?.(notification);
  };

  const handleMarkAllAsRead = async () => {
    try {
      const success = await markNotificationsAsRead();
      if (success) {
        setNotifications(prev =>
          prev.map(n => ({ ...n, is_read: true }))
        );
        loadNotificationCounts();
      }
    } catch (error) {
      console.error('Error marking all notifications as read:', error);
    }
  };

  const handleDeleteNotification = async (notificationId: string) => {
    try {
      setDeletingId(notificationId);
      const success = await deleteNotification(notificationId);
      if (success) {
        setNotifications(prev => prev.filter(n => n.id !== notificationId));
        loadNotificationCounts();
      }
    } catch (error) {
      console.error('Error deleting notification:', error);
      Alert.alert('Error', 'Failed to delete notification');
    } finally {
      setDeletingId(null);
    }
  };

  const renderNotification = ({ item: notification }: { item: Notification }) => (
    <TouchableOpacity
      style={[
        styles.notificationItem,
        !notification.is_read && styles.unreadNotification,
      ]}
      onPress={() => handleNotificationPress(notification)}
    >
      <View style={styles.notificationHeader}>
        <View style={styles.notificationIcon}>
          <Ionicons
            name={getNotificationIcon(notification.type) as any}
            size={20}
            color={getNotificationColor(notification.type)}
          />
        </View>
        <View style={styles.notificationContent}>
          <Text style={styles.notificationTitle}>{notification.title}</Text>
          <Text style={styles.notificationMessage}>{notification.message}</Text>
          <Text style={styles.notificationTime}>
            {formatTimeAgo(notification.created_at)}
          </Text>
        </View>
        <TouchableOpacity
          style={styles.deleteButton}
          onPress={() => handleDeleteNotification(notification.id)}
          disabled={deletingId === notification.id}
        >
          {deletingId === notification.id ? (
            <ActivityIndicator size="small" color="#EF4444" />
          ) : (
            <Ionicons name="close" size={16} color="#9CA3AF" />
          )}
        </TouchableOpacity>
      </View>
      {!notification.is_read && <View style={styles.unreadIndicator} />}
    </TouchableOpacity>
  );

  const renderEmptyState = () => (
    <View style={styles.emptyState}>
      <Ionicons name="notifications-outline" size={64} color="#D1D5DB" />
      <Text style={styles.emptyStateTitle}>No notifications yet</Text>
      <Text style={styles.emptyStateDescription}>
        You'll see notifications here when people interact with your content
      </Text>
    </View>
  );

  return (
    <Modal
      visible={visible}
      animationType="slide"
      presentationStyle="pageSheet"
      onRequestClose={onClose}
    >
      <View style={styles.container}>
        <View style={styles.header}>
          <View style={styles.headerContent}>
            <Text style={styles.headerTitle}>Notifications</Text>
            {notificationCounts && notificationCounts.unread_count > 0 && (
              <View style={styles.unreadBadge}>
                <Text style={styles.unreadBadgeText}>
                  {notificationCounts.unread_count}
                </Text>
              </View>
            )}
          </View>
          <View style={styles.headerActions}>
            {notificationCounts && notificationCounts.unread_count > 0 && (
              <TouchableOpacity
                style={styles.markAllReadButton}
                onPress={handleMarkAllAsRead}
              >
                <Text style={styles.markAllReadText}>Mark all read</Text>
              </TouchableOpacity>
            )}
            <TouchableOpacity style={styles.closeButton} onPress={onClose}>
              <Ionicons name="close" size={24} color="#6B7280" />
            </TouchableOpacity>
          </View>
        </View>

        {loading ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color="#FF8A00" />
            <Text style={styles.loadingText}>Loading notifications...</Text>
          </View>
        ) : (
          <FlatList
            data={notifications}
            renderItem={renderNotification}
            keyExtractor={(item) => item.id}
            showsVerticalScrollIndicator={false}
            contentContainerStyle={styles.listContainer}
            refreshControl={
              <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
            }
            ListEmptyComponent={renderEmptyState}
          />
        )}
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
  },
  headerContent: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#1F2937',
  },
  unreadBadge: {
    backgroundColor: '#EF4444',
    borderRadius: 10,
    paddingHorizontal: 8,
    paddingVertical: 2,
    marginLeft: 8,
    minWidth: 20,
    alignItems: 'center',
  },
  unreadBadgeText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '600',
  },
  headerActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
  },
  markAllReadButton: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    backgroundColor: '#F3F4F6',
    borderRadius: 16,
  },
  markAllReadText: {
    fontSize: 14,
    color: '#3B82F6',
    fontWeight: '500',
  },
  closeButton: {
    padding: 4,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 12,
    fontSize: 16,
    color: '#6B7280',
  },
  listContainer: {
    paddingBottom: 20,
  },
  notificationItem: {
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
    position: 'relative',
  },
  unreadNotification: {
    backgroundColor: '#FEF3E2',
  },
  notificationHeader: {
    flexDirection: 'row',
    alignItems: 'flex-start',
  },
  notificationIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#F3F4F6',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  notificationContent: {
    flex: 1,
  },
  notificationTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1F2937',
    marginBottom: 4,
  },
  notificationMessage: {
    fontSize: 14,
    color: '#6B7280',
    lineHeight: 20,
    marginBottom: 8,
  },
  notificationTime: {
    fontSize: 12,
    color: '#9CA3AF',
  },
  deleteButton: {
    padding: 8,
    marginLeft: 8,
  },
  unreadIndicator: {
    position: 'absolute',
    left: 0,
    top: 0,
    bottom: 0,
    width: 4,
    backgroundColor: '#FF8A00',
  },
  emptyState: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 60,
  },
  emptyStateTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#374151',
    marginTop: 16,
    marginBottom: 8,
  },
  emptyStateDescription: {
    fontSize: 14,
    color: '#6B7280',
    textAlign: 'center',
    lineHeight: 20,
    maxWidth: 250,
  },
});
