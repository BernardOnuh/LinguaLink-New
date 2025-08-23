import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Animated,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { getNotificationCounts, subscribeToNotifications, type NotificationCounts } from '../utils/notifications';

interface NotificationBadgeProps {
  onPress: () => void;
  size?: 'small' | 'medium' | 'large';
}

export const NotificationBadge: React.FC<NotificationBadgeProps> = ({
  onPress,
  size = 'medium',
}) => {
  const [notificationCounts, setNotificationCounts] = useState<NotificationCounts | null>(null);
  const [loading, setLoading] = useState(true);
  const pulseAnim = new Animated.Value(1);

  useEffect(() => {
    loadNotificationCounts();
    setupRealtimeSubscription();
  }, []);

  useEffect(() => {
    if (notificationCounts?.unread_count && notificationCounts.unread_count > 0) {
      // Pulse animation for new notifications
      Animated.loop(
        Animated.sequence([
          Animated.timing(pulseAnim, {
            toValue: 1.2,
            duration: 1000,
            useNativeDriver: true,
          }),
          Animated.timing(pulseAnim, {
            toValue: 1,
            duration: 1000,
            useNativeDriver: true,
          }),
        ])
      ).start();
    } else {
      pulseAnim.setValue(1);
    }
  }, [notificationCounts?.unread_count]);

  const loadNotificationCounts = async () => {
    try {
      setLoading(true);
      const counts = await getNotificationCounts();
      setNotificationCounts(counts);
    } catch (error) {
      console.error('Error loading notification counts:', error);
    } finally {
      setLoading(false);
    }
  };

  const setupRealtimeSubscription = async () => {
    try {
      await subscribeToNotifications(() => {
        // Refresh counts when new notification arrives
        loadNotificationCounts();
      });
    } catch (error) {
      console.error('Error setting up notification subscription:', error);
    }
  };

  const getIconSize = () => {
    switch (size) {
      case 'small':
        return 20;
      case 'large':
        return 28;
      default:
        return 24;
    }
  };

  const getBadgeSize = () => {
    switch (size) {
      case 'small':
        return 16;
      case 'large':
        return 20;
      default:
        return 18;
    }
  };

  const getBadgeFontSize = () => {
    switch (size) {
      case 'small':
        return 10;
      case 'large':
        return 12;
      default:
        return 11;
    }
  };

  const hasUnreadNotifications = notificationCounts && notificationCounts.unread_count > 0;

  return (
    <TouchableOpacity style={styles.container} onPress={onPress}>
      <Animated.View
        style={[
          styles.iconContainer,
          {
            transform: [{ scale: pulseAnim }],
          },
        ]}
      >
        <Ionicons
          name="notifications-outline"
          size={getIconSize()}
          color={hasUnreadNotifications ? '#FF8A00' : '#FFFFFF'}
        />
        {hasUnreadNotifications && (
          <View style={[styles.badge, { width: getBadgeSize(), height: getBadgeSize() }]}>
            <Text style={[styles.badgeText, { fontSize: getBadgeFontSize() }]}>
              {notificationCounts.unread_count > 99 ? '99+' : notificationCounts.unread_count}
            </Text>
          </View>
        )}
      </Animated.View>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  container: {
    position: 'relative',
  },
  iconContainer: {
    position: 'relative',
    padding: 4,
  },
  badge: {
    position: 'absolute',
    top: 0,
    right: 0,
    backgroundColor: '#EF4444',
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center',
    minWidth: 18,
    borderWidth: 2,
    borderColor: '#FFFFFF',
  },
  badgeText: {
    color: '#FFFFFF',
    fontWeight: 'bold',
    textAlign: 'center',
  },
});
