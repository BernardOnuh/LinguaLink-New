// src/screens/NotificationsScreen.tsx
import React, { useEffect, useState, useCallback } from 'react';
import {
  View,
  Text,
  SafeAreaView,
  StatusBar,
  StyleSheet,
  Dimensions,
  FlatList,
  TouchableOpacity,
  RefreshControl,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { supabase } from '../supabaseClient';
import { useAuth } from '../context/AuthProvider';

const { width } = Dimensions.get('window');

interface NotificationRow {
  id: string;
  type: string;
  title: string | null;
  message: string | null;
  data: any;
  is_read: boolean;
  created_at: string;
}

const NotificationsScreen: React.FC<any> = ({ navigation }) => {
  const { user } = useAuth();
  const [items, setItems] = useState<NotificationRow[]>([]);
  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);

  const fetchNotifications = useCallback(async () => {
    if (!user?.id) return;
    setLoading(true);
    const { data, error } = await supabase
      .from('notifications')
      .select('id, type, title, message, data, is_read, created_at')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })
      .limit(100);
    if (!error && Array.isArray(data)) {
      setItems(data as any);
    }
    setLoading(false);
  }, [user?.id]);

  useEffect(() => {
    fetchNotifications();
  }, [fetchNotifications]);

  useEffect(() => {
    if (!user?.id) return;
    const channel = supabase
      .channel('notifications-feed')
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'notifications', filter: `user_id=eq.${user.id}` }, (payload: any) => {
        const n = payload.new as NotificationRow;
        setItems(prev => [n, ...prev]);
      })
      .subscribe();
    return () => { channel.unsubscribe(); };
  }, [user?.id]);

  // Mark all as read when screen opens
  useEffect(() => {
    const markAllRead = async () => {
      if (!user?.id) return;
      await supabase
        .from('notifications')
        .update({ is_read: true })
        .eq('user_id', user.id)
        .eq('is_read', false);
    };
    markAllRead();
  }, [user?.id]);

  const onRefresh = async () => {
    setRefreshing(true);
    await fetchNotifications();
    setRefreshing(false);
  };

  const onPressItem = async (n: NotificationRow) => {
    try {
      if (!n.is_read) {
        await supabase.from('notifications').update({ is_read: true }).eq('id', n.id);
        setItems(prev => prev.map(it => it.id === n.id ? { ...it, is_read: true } : it));
      }
      const conversationId = n?.data?.conversation_id as string | undefined;
      if (conversationId) {
        navigation.navigate('Chat');
      }
    } catch {}
  };

  const renderItem = ({ item }: { item: NotificationRow }) => {
    return (
      <TouchableOpacity style={styles.row} onPress={() => onPressItem(item)}>
        <View style={[styles.iconBox, item.is_read ? styles.iconRead : styles.iconUnread]}>
          <Ionicons name="notifications" size={18} color={item.is_read ? '#6B7280' : '#FF8A00'} />
        </View>
        <View style={styles.rowContent}>
          <Text style={styles.rowTitle}>{item.title || labelForType(item.type)}</Text>
          {!!item.message && <Text style={styles.rowMessage} numberOfLines={1}>{item.message}</Text>}
          <Text style={styles.rowTime}>{new Date(item.created_at).toLocaleString()}</Text>
        </View>
        {!item.is_read && <View style={styles.unreadDot} />}
      </TouchableOpacity>
    );
  };

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor="#FFFFFF" />

      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Ionicons name="arrow-back" size={24} color="#1F2937" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Notifications</Text>
        <View style={{ width: 24 }} />
      </View>

      <FlatList
        data={items}
        keyExtractor={(it) => it.id}
        contentContainerStyle={styles.listContent}
        renderItem={renderItem}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
        ListEmptyComponent={!loading ? (
          <View style={styles.emptyBox}>
            <Ionicons name="notifications-off" size={32} color="#9CA3AF" />
            <Text style={styles.emptyText}>No notifications yet</Text>
          </View>
        ) : null}
      />
    </SafeAreaView>
  );
};

function labelForType(t: string): string {
  switch (t) {
    case 'new_message': return 'New message';
    case 'new_like': return 'New like';
    case 'new_comment': return 'New comment';
    case 'new_validation': return 'New validation';
    default: return 'Notification';
  }
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8F9FA',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: width * 0.05,
    paddingVertical: 16,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#E5E5E5',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1F2937',
  },
  listContent: {
    paddingHorizontal: width * 0.05,
    paddingTop: 12,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 12,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  iconBox: {
    width: 36,
    height: 36,
    borderRadius: 18,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  iconUnread: {
    backgroundColor: '#FEF3E2',
  },
  iconRead: {
    backgroundColor: '#F3F4F6',
  },
  rowContent: {
    flex: 1,
  },
  rowTitle: {
    fontSize: 15,
    fontWeight: '600',
    color: '#1F2937',
  },
  rowMessage: {
    marginTop: 2,
    fontSize: 13,
    color: '#6B7280',
  },
  rowTime: {
    marginTop: 4,
    fontSize: 11,
    color: '#9CA3AF',
  },
  unreadDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#FF8A00',
    marginLeft: 8,
  },
  emptyBox: {
    alignItems: 'center',
    marginTop: 40,
  },
  emptyText: {
    marginTop: 8,
    color: '#9CA3AF',
  },
});

export default NotificationsScreen;


