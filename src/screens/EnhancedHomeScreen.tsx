// src/screens/EnhancedHomeScreen.tsx
import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  SafeAreaView,
  ScrollView,
  StatusBar,
  Dimensions,
  Modal,
  Alert,
  FlatList,
  TextInput,
  ActivityIndicator,
  RefreshControl,
  Image,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { CompositeNavigationProp } from '@react-navigation/native';
import { BottomTabNavigationProp } from '@react-navigation/bottom-tabs';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RootStackParamList, TabParamList } from '../../App';
import {
  getDiscoveryClips,
  getFollowingClips,
  getTrendingClips,
  getClipsNeedingValidation,
  type VoiceClipWithUser
} from '../utils/content';
import { SuggestedUsers } from '../components/SuggestedUsers';
import { ValidationForm } from '../components/ValidationForm';
import { NotificationBadge } from '../components/NotificationBadge';
import { NotificationCenter } from '../components/NotificationCenter';
import { useAuth } from '../context/AuthProvider';

const { width, height } = Dimensions.get('window');

type HomeScreenNavigationProp = CompositeNavigationProp<
  BottomTabNavigationProp<TabParamList, 'Home'>,
  NativeStackNavigationProp<RootStackParamList>
>;

interface Props {
  navigation: HomeScreenNavigationProp;
}

// Helper function to format time ago
const getTimeAgo = (dateString: string): string => {
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

const EnhancedHomeScreen: React.FC<Props> = ({ navigation }) => {
  const { user: authUser } = useAuth();
  const [activeTab, setActiveTab] = useState<'Following' | 'Discover' | 'Trending' | 'Validate'>('Discover');
  const [clips, setClips] = useState<VoiceClipWithUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [showValidationModal, setShowValidationModal] = useState(false);
  const [selectedClip, setSelectedClip] = useState<VoiceClipWithUser | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [showSearch, setShowSearch] = useState(false);
  const [showNotificationCenter, setShowNotificationCenter] = useState(false);

  useEffect(() => {
    loadClips();
  }, [activeTab]);

  const loadClips = async () => {
    try {
      setLoading(true);
      let newClips: VoiceClipWithUser[] = [];

      switch (activeTab) {
        case 'Following':
          newClips = await getFollowingClips(20, 0);
          break;
        case 'Discover':
          newClips = await getDiscoveryClips(20, 0);
          break;
        case 'Trending':
          newClips = await getTrendingClips(20, '7d');
          break;
        case 'Validate':
          newClips = await getClipsNeedingValidation(20);
          break;
      }

      setClips(newClips);
    } catch (error) {
      console.error('Error loading clips:', error);
      Alert.alert('Error', 'Failed to load content. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await loadClips();
    setRefreshing(false);
  };

  const handleValidationPress = (clip: VoiceClipWithUser) => {
    setSelectedClip(clip);
    setShowValidationModal(true);
  };

  const handleValidationComplete = () => {
    setShowValidationModal(false);
    setSelectedClip(null);
    loadClips(); // Refresh the list
  };

  const renderWaveform = (duration: number) => (
    <View style={styles.waveformContainer}>
      {Array.from({ length: 16 }, (_, i) => (
        <View
          key={i}
          style={[
            styles.waveformBar,
            { height: Math.random() * 40 + 20 }
          ]}
        />
      ))}
    </View>
  );

  const renderClip = ({ item: clip }: { item: VoiceClipWithUser }) => (
    <View style={styles.clipCard}>
      <View style={styles.clipHeader}>
        <TouchableOpacity
          style={styles.userInfo}
          onPress={() => navigation.navigate('UserProfile', {
            user: {
              id: clip.user.id,
              name: clip.user.full_name || clip.user.username,
              username: clip.user.username,
              avatar: clip.user.avatar_url || '👤',
              language: clip.user.primary_language || 'Unknown',
              isOnline: false
            }
          })}
        >
          <View style={styles.avatarContainer}>
            {clip.user.avatar_url && clip.user.avatar_url.startsWith('http') ? (
              <Image
                source={{ uri: clip.user.avatar_url }}
                style={styles.avatar}
              />
            ) : (
              <Text style={styles.avatarEmoji}>{clip.user.avatar_url || '👤'}</Text>
            )}
          </View>
          <View style={styles.userDetails}>
            <Text style={styles.userName}>{clip.user.full_name || clip.user.username}</Text>
            <Text style={styles.userUsername}>@{clip.user.username}</Text>
          </View>
        </TouchableOpacity>
        <Text style={styles.timeAgo}>{getTimeAgo(clip.created_at)}</Text>
      </View>

      <View style={styles.clipContent}>
        <Text style={styles.phrase}>{clip.phrase}</Text>
        <Text style={styles.translation}>{clip.translation}</Text>

        {renderWaveform(clip.duration)}

        <View style={styles.clipMeta}>
          <Text style={styles.language}>{clip.language}</Text>
          {clip.dialect && <Text style={styles.dialect}>({clip.dialect})</Text>}
          <Text style={styles.duration}>{clip.duration}s</Text>
        </View>
      </View>

      <View style={styles.clipStats}>
        <View style={styles.statItem}>
          <Ionicons name="heart-outline" size={16} color="#6B7280" />
          <Text style={styles.statText}>{clip.likes_count}</Text>
        </View>
        <View style={styles.statItem}>
          <Ionicons name="chatbubble-outline" size={16} color="#6B7280" />
          <Text style={styles.statText}>{clip.comments_count}</Text>
        </View>
        <View style={styles.statItem}>
          <Ionicons name="checkmark-circle" size={16} color="#10B981" />
          <Text style={styles.statText}>{clip.validations_count}</Text>
        </View>
        {clip.is_validated && (
          <View style={styles.validatedBadge}>
            <Ionicons name="shield-checkmark" size={14} color="#10B981" />
            <Text style={styles.validatedText}>Validated</Text>
          </View>
        )}
      </View>

      <View style={styles.clipActions}>
        <TouchableOpacity style={styles.actionButton}>
          <Ionicons name="heart-outline" size={20} color="#6B7280" />
          <Text style={styles.actionText}>Like</Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.actionButton}>
          <Ionicons name="chatbubble-outline" size={20} color="#6B7280" />
          <Text style={styles.actionText}>Comment</Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.actionButton}>
          <Ionicons name="share-outline" size={20} color="#6B7280" />
          <Text style={styles.actionText}>Share</Text>
        </TouchableOpacity>

        {activeTab === 'Validate' && (
          <TouchableOpacity
            style={[styles.actionButton, styles.validateButton]}
            onPress={() => handleValidationPress(clip)}
          >
            <Ionicons name="checkmark-circle-outline" size={20} color="#3B82F6" />
            <Text style={[styles.actionText, styles.validateText]}>Validate</Text>
          </TouchableOpacity>
        )}
      </View>
    </View>
  );

  const renderEmptyState = () => (
    <View style={styles.emptyState}>
      <Ionicons
        name={activeTab === 'Validate' ? 'checkmark-circle-outline' : 'mic-outline'}
        size={64}
        color="#D1D5DB"
      />
      <Text style={styles.emptyStateTitle}>
        {activeTab === 'Following' && 'No content from people you follow'}
        {activeTab === 'Discover' && 'No content available'}
        {activeTab === 'Trending' && 'No trending content'}
        {activeTab === 'Validate' && 'No clips need validation'}
      </Text>
      <Text style={styles.emptyStateDescription}>
        {activeTab === 'Following' && 'Follow more people to see their content here'}
        {activeTab === 'Discover' && 'Be the first to share a voice clip!'}
        {activeTab === 'Trending' && 'Check back later for trending content'}
        {activeTab === 'Validate' && 'All clips have been validated'}
      </Text>
      {activeTab === 'Discover' && (
        <TouchableOpacity
          style={styles.recordButton}
          onPress={() => navigation.navigate('RecordVoice')}
        >
          <Ionicons name="mic" size={20} color="#FFFFFF" />
          <Text style={styles.recordButtonText}>Record Now</Text>
        </TouchableOpacity>
      )}
    </View>
  );

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor="#FF8A00" />

      {/* Header */}
      <View style={styles.header}>
        <View style={styles.headerContent}>
          <Text style={styles.headerTitle}>LinguaLink</Text>
          <View style={styles.headerActions}>
            <TouchableOpacity
              style={styles.headerButton}
              onPress={() => setShowSearch(!showSearch)}
            >
              <Ionicons name="search" size={24} color="#FFFFFF" />
            </TouchableOpacity>
            <NotificationBadge
              onPress={() => setShowNotificationCenter(true)}
              size="medium"
            />
            <TouchableOpacity
              style={styles.headerButton}
              onPress={() => navigation.navigate('RecordVoice')}
            >
              <Ionicons name="add" size={24} color="#FFFFFF" />
            </TouchableOpacity>
          </View>
        </View>

        {showSearch && (
          <View style={styles.searchContainer}>
            <TextInput
              style={styles.searchInput}
              placeholder="Search voice clips..."
              placeholderTextColor="#9CA3AF"
              value={searchQuery}
              onChangeText={setSearchQuery}
            />
          </View>
        )}
      </View>

      {/* Tab Navigation */}
      <View style={styles.tabContainer}>
        {['Following', 'Discover', 'Trending', 'Validate'].map((tab) => (
          <TouchableOpacity
            key={tab}
            style={[
              styles.tab,
              activeTab === tab && styles.activeTab
            ]}
            onPress={() => setActiveTab(tab as any)}
          >
            <Text style={[
              styles.tabText,
              activeTab === tab && styles.activeTabText
            ]}>
              {tab}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      {/* Content */}
      {loading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#FF8A00" />
          <Text style={styles.loadingText}>Loading content...</Text>
        </View>
      ) : (
        <FlatList
          data={clips}
          renderItem={renderClip}
          keyExtractor={(item) => item.id}
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.listContainer}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
          }
          ListEmptyComponent={renderEmptyState}
        />
      )}

      {/* Validation Modal */}
      <Modal
        visible={showValidationModal}
        transparent
        animationType="slide"
        onRequestClose={() => setShowValidationModal(false)}
      >
        <View style={styles.modalOverlay}>
          {selectedClip && (
            <ValidationForm
              clip={selectedClip}
              onValidationComplete={handleValidationComplete}
              onCancel={() => setShowValidationModal(false)}
            />
          )}
        </View>
      </Modal>

      {/* Notification Center */}
      <NotificationCenter
        visible={showNotificationCenter}
        onClose={() => setShowNotificationCenter(false)}
        onNotificationPress={(notification) => {
          // Handle notification press - navigate to relevant screen
          console.log('Notification pressed:', notification);
          setShowNotificationCenter(false);
        }}
      />
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8F9FA',
  },
  header: {
    backgroundColor: '#FF8A00',
    paddingTop: 10,
    paddingBottom: 15,
    paddingHorizontal: width * 0.05,
  },
  headerContent: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#FFFFFF',
  },
  headerActions: {
    flexDirection: 'row',
    gap: 16,
  },
  headerButton: {
    padding: 4,
  },
  searchContainer: {
    marginTop: 10,
  },
  searchInput: {
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    borderRadius: 20,
    paddingHorizontal: 16,
    paddingVertical: 10,
    color: '#FFFFFF',
    fontSize: 16,
  },
  tabContainer: {
    flexDirection: 'row',
    backgroundColor: '#FFFFFF',
    paddingHorizontal: width * 0.05,
    paddingVertical: 4,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E5E5',
  },
  tab: {
    flex: 1,
    paddingVertical: 12,
    alignItems: 'center',
    borderBottomWidth: 2,
    borderBottomColor: 'transparent',
  },
  activeTab: {
    borderBottomColor: '#FF8A00',
  },
  tabText: {
    fontSize: 14,
    fontWeight: '500',
    color: '#6B7280',
  },
  activeTabText: {
    color: '#FF8A00',
    fontWeight: '600',
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
    paddingHorizontal: width * 0.05,
    paddingTop: 20,
    paddingBottom: 100,
  },
  clipCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 2,
  },
  clipHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  userInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  avatarContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#F3F4F6',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
    overflow: 'hidden',
  },
  avatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
  },
  avatarEmoji: {
    fontSize: 20,
  },
  userDetails: {
    flex: 1,
  },
  userName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1F2937',
  },
  userUsername: {
    fontSize: 14,
    color: '#6B7280',
  },
  timeAgo: {
    fontSize: 12,
    color: '#9CA3AF',
  },
  clipContent: {
    marginBottom: 16,
  },
  phrase: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#1F2937',
    marginBottom: 8,
  },
  translation: {
    fontSize: 14,
    color: '#6B7280',
    marginBottom: 16,
  },
  waveformContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    height: 40,
    marginBottom: 12,
  },
  waveformBar: {
    width: 3,
    backgroundColor: '#FF8A00',
    marginHorizontal: 1,
    borderRadius: 2,
  },
  clipMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  language: {
    fontSize: 12,
    color: '#3B82F6',
    fontWeight: '500',
  },
  dialect: {
    fontSize: 12,
    color: '#9CA3AF',
  },
  duration: {
    fontSize: 12,
    color: '#9CA3AF',
  },
  clipStats: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginBottom: 12,
    paddingVertical: 8,
    borderTopWidth: 1,
    borderTopColor: '#F3F4F6',
  },
  statItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  statText: {
    fontSize: 14,
    color: '#6B7280',
  },
  validatedBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#ECFDF5',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    gap: 4,
  },
  validatedText: {
    fontSize: 12,
    color: '#10B981',
    fontWeight: '500',
  },
  clipActions: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: '#F3F4F6',
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 20,
    gap: 6,
  },
  actionText: {
    fontSize: 14,
    color: '#6B7280',
    fontWeight: '500',
  },
  validateButton: {
    backgroundColor: '#EFF6FF',
  },
  validateText: {
    color: '#3B82F6',
  },
  emptyState: {
    alignItems: 'center',
    paddingVertical: 60,
  },
  emptyStateTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#374151',
    marginTop: 16,
    marginBottom: 8,
    textAlign: 'center',
  },
  emptyStateDescription: {
    fontSize: 14,
    color: '#6B7280',
    textAlign: 'center',
    lineHeight: 20,
    maxWidth: 250,
  },
  recordButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FF8A00',
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 24,
    marginTop: 20,
  },
  recordButtonText: {
    color: '#FFFFFF',
    fontWeight: '600',
    marginLeft: 8,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
});

export default EnhancedHomeScreen;