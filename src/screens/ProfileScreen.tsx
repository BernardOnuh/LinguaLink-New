import React, { useState } from 'react';
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
  Image,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { CompositeNavigationProp } from '@react-navigation/native';
import { BottomTabNavigationProp } from '@react-navigation/bottom-tabs';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RootStackParamList, TabParamList } from '../../App';

const { width, height } = Dimensions.get('window');

type ProfileScreenNavigationProp = CompositeNavigationProp<
  BottomTabNavigationProp<TabParamList, 'Profile'>,
  NativeStackNavigationProp<RootStackParamList>
>;

interface Props {
  navigation: ProfileScreenNavigationProp;
}

interface User {
  id: string;
  name: string;
  username: string;
  avatar: string;
  language: string;
  isVerified: boolean;
  isOnline: boolean;
  bio?: string;
  location?: string;
  joinedDate?: string;
}

interface VoiceClip {
  id: string;
  type: 'voice';
  user: User;
  phrase: string;
  translation: string;
  audioWaveform: number[];
  likes: number;
  comments: number;
  shares: number;
  validations: number;
  needsValidation: boolean;
  timeAgo: string;
  isValidated: boolean;
  userLanguages: string[];
}

interface Badge {
  id: string;
  title: string;
  description: string;
  icon: string;
  color: string;
  earned: boolean;
  date?: string;
}

// Mock data
const mockUser: User = {
  id: '1',
  name: 'Nana Bambara',
  username: 'Onuh',
  avatar: 'https://randomuser.me/api/portraits/women/44.jpg',
  language: 'Yoruba / Lagos Dialect',
  isVerified: true,
  isOnline: true,
  bio: 'Language enthusiast preserving African dialects through voice recordings',
  location: 'Lagos, Nigeria',
  joinedDate: 'Joined March 2023',
};

const mockFollowing: User[] = [
  {
    id: '2',
    name: 'Adunni Lagos',
    username: 'Adur',
    avatar: 'https://randomuser.me/api/portraits/women/68.jpg',
    language: 'Yoruba / Ekiti Dialect',
    isVerified: false,
    isOnline: true,
  },
  {
    id: '3',
    name: 'Chidi Okafor',
    username: 'ChidiIgbo',
    avatar: 'https://randomuser.me/api/portraits/men/32.jpg',
    language: 'Igbo / Nsukka',
    isVerified: true,
    isOnline: false,
  },
];

const mockFollowers: User[] = [
  {
    id: '4',
    name: 'Aisha Mohammed',
    username: 'aisha_storyteller',
    avatar: 'https://randomuser.me/api/portraits/women/65.jpg',
    language: 'Hausa',
    isVerified: false,
    isOnline: true,
  },
  {
    id: '5',
    name: 'Kemi Adebayo',
    username: 'kemi_tales',
    avatar: 'https://randomuser.me/api/portraits/women/33.jpg',
    language: 'Yoruba',
    isVerified: true,
    isOnline: false,
  },
  {
    id: '6',
    name: 'Oluwaseun Adeleke',
    username: 'seunmusic',
    avatar: 'https://randomuser.me/api/portraits/men/45.jpg',
    language: 'Yoruba / Lagos Dialect',
    isVerified: false,
    isOnline: true,
  },
];

const mockVoiceClips: VoiceClip[] = [
  {
    id: '1',
    type: 'voice',
    user: mockUser,
    phrase: 'E kààrọ́',
    translation: 'Good morning in Yoruba',
    audioWaveform: [20, 40, 60, 80, 60, 40, 70, 90, 50, 30, 60, 80, 40, 20, 50, 70],
    likes: 45,
    comments: 8,
    shares: 12,
    validations: 23,
    needsValidation: false,
    timeAgo: '2 days ago',
    isValidated: true,
    userLanguages: ['Yoruba / Lagos Dialect']
  },
  {
    id: '2',
    type: 'voice',
    user: mockUser,
    phrase: 'Bawo ni',
    translation: 'How are you in Yoruba',
    audioWaveform: [30, 50, 70, 40, 60, 80, 90, 70, 40, 20, 50, 60, 30, 40, 60, 50],
    likes: 32,
    comments: 12,
    shares: 5,
    validations: 18,
    needsValidation: false,
    timeAgo: '1 week ago',
    isValidated: true,
    userLanguages: ['Yoruba / Lagos Dialect']
  }
];

const mockBadges: Badge[] = [
  {
    id: '1',
    title: 'Language Pioneer',
    description: 'Welcome to LinguaLink! Ready to preserve languages.',
    icon: 'sparkles',
    color: '#FF8A00',
    earned: true,
    date: 'Today'
  },
  {
    id: '2',
    title: 'First Recording',
    description: 'You made your first voice recording!',
    icon: 'mic',
    color: '#10B981',
    earned: true,
    date: 'Yesterday'
  },
  {
    id: '3',
    title: 'Community Helper',
    description: 'You validated 10+ recordings',
    icon: 'checkmark-circle',
    color: '#3B82F6',
    earned: false
  },
  {
    id: '4',
    title: 'Story Teller',
    description: 'Created your first animated story',
    icon: 'book',
    color: '#8B5CF6',
    earned: false
  },
  {
    id: '5',
    title: 'Duet Master',
    description: 'Created 5+ duets with others',
    icon: 'people',
    color: '#EC4899',
    earned: false
  }
];

const ProfileScreen: React.FC<Props> = ({ navigation }) => {
  const [activeTab, setActiveTab] = useState<'Clips' | 'Badges' | 'Rewards'>('Clips');
  const [showFollowingModal, setShowFollowingModal] = useState(false);
  const [showFollowersModal, setShowFollowersModal] = useState(false);
  const [isFollowing, setIsFollowing] = useState<Record<string, boolean>>({
    '2': true, // Adunni Lagos
    '3': false, // Chidi Okafor
    '4': true, // Aisha Mohammed
    '5': false, // Kemi Adebayo
    '6': true, // Oluwaseun Adeleke
  });

  const toggleFollow = (userId: string) => {
    setIsFollowing(prev => ({
      ...prev,
      [userId]: !prev[userId]
    }));
  };

  const mutualFollowsCount = mockFollowers.filter(
    follower => isFollowing[follower.id]
  ).length;

  const renderWaveform = (waveform: number[]) => (
    <View style={styles.waveformContainer}>
      {waveform.map((height, index) => (
        <View
          key={index}
          style={[
            styles.waveformBar,
            { height: height * 0.6 }
          ]}
        />
      ))}
    </View>
  );

  const renderUserItem = (user: User) => (
    <TouchableOpacity 
      key={user.id} 
      style={styles.userItem}
      onPress={() => navigation.navigate('UserProfile', { user })}
    >
      <View style={styles.userAvatar}>
        <Image source={{ uri: user.avatar }} style={styles.avatarImage} />
        <View style={[
          styles.onlineIndicator,
          { backgroundColor: user.isOnline ? '#10B981' : '#9CA3AF' }
        ]} />
      </View>
      <View style={styles.userInfo}>
        <View style={styles.userNameContainer}>
          <Text style={styles.userName}>{user.name}</Text>
          {user.isVerified && (
            <Ionicons name="checkmark-circle" size={16} color="#3B82F6" style={styles.verifiedIcon} />
          )}
        </View>
        <Text style={styles.userUsername}>@{user.username}</Text>
        <View style={styles.userStats}>
          <Text style={styles.userStat}>{user.language}</Text>
          {isFollowing[user.id] && (
            <View style={styles.mutualFollowBadge}>
              <Text style={styles.mutualFollowText}>Follows you</Text>
            </View>
          )}
        </View>
      </View>
      <TouchableOpacity 
        style={[
          styles.followButton,
          isFollowing[user.id] && styles.followingButton
        ]}
        onPress={() => toggleFollow(user.id)}
      >
        <Text style={[
          styles.followButtonText,
          isFollowing[user.id] && styles.followingButtonText
        ]}>
          {isFollowing[user.id] ? 'Following' : 'Follow'}
        </Text>
      </TouchableOpacity>
    </TouchableOpacity>
  );

  const renderVoiceClip = (clip: VoiceClip) => (
    <View key={clip.id} style={styles.clipCard}>
      <View style={styles.clipHeader}>
        <Text style={styles.clipPhrase}>{clip.phrase}</Text>
        <Text style={styles.clipTime}>{clip.timeAgo}</Text>
      </View>
      <Text style={styles.clipTranslation}>{clip.translation}</Text>
      
      {renderWaveform(clip.audioWaveform)}

      <View style={styles.clipStats}>
        <View style={styles.statItem}>
          <Ionicons name="heart" size={16} color="#EF4444" />
          <Text style={styles.statText}>{clip.likes}</Text>
        </View>
        <View style={styles.statItem}>
          <Ionicons name="chatbubble" size={16} color="#6B7280" />
          <Text style={styles.statText}>{clip.comments}</Text>
        </View>
        <View style={styles.statItem}>
          <Ionicons name="checkmark-circle" size={16} color="#10B981" />
          <Text style={styles.statText}>{clip.validations}</Text>
        </View>
        <View style={styles.statItem}>
          <Ionicons name="share-social" size={16} color="#6B7280" />
          <Text style={styles.statText}>{clip.shares}</Text>
        </View>
      </View>
    </View>
  );

  const renderBadge = (badge: Badge) => (
    <View key={badge.id} style={styles.badgeCard}>
      <View style={[styles.badgeIcon, { backgroundColor: `${badge.color}20` }]}>
        <Ionicons 
          name={badge.icon as any} 
          size={24} 
          color={badge.color} 
        />
        {!badge.earned && (
          <View style={styles.lockIcon}>
            <Ionicons name="lock-closed" size={12} color="#9CA3AF" />
          </View>
        )}
      </View>
      <View style={styles.badgeContent}>
        <Text style={styles.badgeTitle}>{badge.title}</Text>
        <Text style={styles.badgeDescription}>{badge.description}</Text>
        {badge.earned && badge.date && (
          <Text style={styles.badgeDate}>Earned {badge.date}</Text>
        )}
      </View>
    </View>
  );

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor="#FF8A00" />
      
      <ScrollView 
        style={styles.scrollContainer}
        showsVerticalScrollIndicator={false}
        stickyHeaderIndices={[1]} // Make tabs sticky
      >
        {/* Header */}
        <View style={styles.header}>
          <View style={styles.headerContent}>
            <Text style={styles.headerTitle}>Profile</Text>
            <TouchableOpacity onPress={() => navigation.navigate('Settings')}>
              <Ionicons name="settings-outline" size={24} color="#FFFFFF" />
            </TouchableOpacity>
          </View>
          
          {/* Profile Info */}
          <View style={styles.profileInfo}>
            <View style={styles.avatarContainer}>
              <View style={styles.avatar}>
                <Image source={{ uri: mockUser.avatar }} style={styles.avatarImage} />
                <View style={[
                  styles.onlineIndicator,
                  { backgroundColor: mockUser.isOnline ? '#10B981' : '#9CA3AF' }
                ]} />
              </View>
            </View>
            
            <View style={styles.profileNameContainer}>
              <Text style={styles.profileName}>{mockUser.name}</Text>
              {mockUser.isVerified && (
                <Ionicons name="checkmark-circle" size={20} color="#3B82F6" style={styles.verifiedIcon} />
              )}
            </View>
            
            <Text style={styles.profileUsername}>@{mockUser.username}</Text>
            
            {mockUser.bio && (
              <Text style={styles.profileBio}>{mockUser.bio}</Text>
            )}
            
            <View style={styles.profileDetails}>
              {mockUser.location && (
                <View style={styles.detailItem}>
                  <Ionicons name="location-outline" size={16} color="#FFFFFF" />
                  <Text style={styles.detailText}>{mockUser.location}</Text>
                </View>
              )}
              {mockUser.joinedDate && (
                <View style={styles.detailItem}>
                  <Ionicons name="calendar-outline" size={16} color="#FFFFFF" />
                  <Text style={styles.detailText}>{mockUser.joinedDate}</Text>
                </View>
              )}
            </View>
            
            <View style={styles.languageTag}>
              <Text style={styles.languageText}>{mockUser.language}</Text>
            </View>

            {/* Follow Stats */}
            <View style={styles.followStatsContainer}>
              <TouchableOpacity 
                style={styles.followStatItem}
                onPress={() => setShowFollowersModal(true)}
              >
                <Text style={styles.followStatNumber}>{mockFollowers.length}</Text>
                <Text style={styles.followStatLabel}>Followers</Text>
                {mutualFollowsCount > 0 && (
                  <Text style={styles.mutualStatText}>{mutualFollowsCount} mutual</Text>
                )}
              </TouchableOpacity>
              
              <TouchableOpacity 
                style={styles.followStatItem}
                onPress={() => setShowFollowingModal(true)}
              >
                <Text style={styles.followStatNumber}>{mockFollowing.length}</Text>
                <Text style={styles.followStatLabel}>Following</Text>
              </TouchableOpacity>
            </View>
          </View>
          
          {/* Stats */}
          <View style={styles.statsContainer}>
            <View style={styles.statCard}>
              <Text style={styles.statNumber}>23</Text>
              <Text style={styles.statLabel}>Validations</Text>
            </View>
            <View style={styles.statCard}>
              <Text style={styles.statNumber}>{mockVoiceClips.length}</Text>
              <Text style={styles.statLabel}>Clips</Text>
            </View>
            <View style={styles.statCard}>
              <Text style={styles.statNumber}>0</Text>
              <Text style={styles.statLabel}>Stories</Text>
            </View>
            <View style={styles.statCard}>
              <Text style={styles.statNumber}>5</Text>
              <Text style={styles.statLabel}>Duets</Text>
            </View>
          </View>
        </View>

        {/* Tab Navigation */}
        <View style={styles.tabContainer}>
          {['Clips', 'Badges', 'Rewards'].map((tab) => (
            <TouchableOpacity
              key={tab}
              style={[
                styles.tab,
                activeTab === tab && styles.activeTab
              ]}
              onPress={() => {
                setActiveTab(tab as typeof activeTab);
                if (tab === 'Rewards') {
                  navigation.navigate('Rewards');
                }
              }}
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
        <View style={styles.content}>
          {activeTab === 'Clips' && (
            <View style={styles.clipsSection}>
              {mockVoiceClips.length > 0 ? (
                mockVoiceClips.map(renderVoiceClip)
              ) : (
                <View style={styles.emptyState}>
                  <Ionicons name="mic-outline" size={64} color="#D1D5DB" />
                  <Text style={styles.emptyStateTitle}>No clips yet</Text>
                  <Text style={styles.emptyStateDescription}>
                    Start recording to share your voice with the world
                  </Text>
                  <TouchableOpacity 
                    style={styles.recordButton}
                    onPress={() => navigation.navigate('RecordVoice')}
                  >
                    <Ionicons name="mic" size={20} color="#FFFFFF" />
                    <Text style={styles.recordButtonText}>Record Now</Text>
                  </TouchableOpacity>
                </View>
              )}
            </View>
          )}

          {activeTab === 'Badges' && (
            <View style={styles.badgesSection}>
              <Text style={styles.sectionTitle}>Your Badges</Text>
              {mockBadges
                .filter(badge => badge.earned)
                .map(renderBadge)}
              
              <Text style={[styles.sectionTitle, { marginTop: 24 }]}>Available Badges</Text>
              {mockBadges
                .filter(badge => !badge.earned)
                .map(renderBadge)}
            </View>
          )}

          {activeTab === 'Rewards' && (
            <View style={styles.rewardsSection}>
              <View style={styles.emptyState}>
                <Ionicons name="gift-outline" size={64} color="#D1D5DB" />
                <Text style={styles.emptyStateTitle}>No rewards yet</Text>
                <Text style={styles.emptyStateDescription}>
                  Earn points by contributing to unlock rewards
                </Text>
                <TouchableOpacity 
                  style={styles.recordButton}
                  onPress={() => navigation.navigate('Rewards')}
                >
                  <Ionicons name="trophy" size={20} color="#FFFFFF" />
                  <Text style={styles.recordButtonText}>View Leaderboard</Text>
                </TouchableOpacity>
              </View>
            </View>
          )}
        </View>
      </ScrollView>

      {/* Following Modal */}
      <Modal
        visible={showFollowingModal}
        transparent
        animationType="slide"
        onRequestClose={() => setShowFollowingModal(false)}
      >
        <View style={styles.modalContainer}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>Following ({mockFollowing.length})</Text>
            <TouchableOpacity onPress={() => setShowFollowingModal(false)}>
              <Ionicons name="close" size={24} color="#6B7280" />
            </TouchableOpacity>
          </View>
          <ScrollView style={styles.modalContent}>
            {mockFollowing.length > 0 ? (
              mockFollowing.map(renderUserItem)
            ) : (
              <View style={styles.emptyModalState}>
                <Ionicons name="people-outline" size={48} color="#D1D5DB" />
                <Text style={styles.emptyModalText}>Not following anyone yet</Text>
              </View>
            )}
          </ScrollView>
        </View>
      </Modal>

      {/* Followers Modal */}
      <Modal
        visible={showFollowersModal}
        transparent
        animationType="slide"
        onRequestClose={() => setShowFollowersModal(false)}
      >
        <View style={styles.modalContainer}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>Followers ({mockFollowers.length})</Text>
            <TouchableOpacity onPress={() => setShowFollowersModal(false)}>
              <Ionicons name="close" size={24} color="#6B7280" />
            </TouchableOpacity>
          </View>
          <ScrollView style={styles.modalContent}>
            {mockFollowers.length > 0 ? (
              mockFollowers.map(renderUserItem)
            ) : (
              <View style={styles.emptyModalState}>
                <Ionicons name="people-outline" size={48} color="#D1D5DB" />
                <Text style={styles.emptyModalText}>No followers yet</Text>
              </View>
            )}
          </ScrollView>
        </View>
      </Modal>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8F9FA',
  },
  scrollContainer: {
    flex: 1,
  },
  header: {
    backgroundColor: '#FF8A00',
    paddingTop: 10,
    paddingBottom: 20,
    paddingHorizontal: width * 0.05,
  },
  headerContent: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#FFFFFF',
  },
  profileInfo: {
    alignItems: 'center',
    marginBottom: 16,
  },
  avatarContainer: {
    marginBottom: 12,
    position: 'relative',
  },
  avatar: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 3,
    borderColor: '#FFFFFF',
    overflow: 'hidden',
  },
  avatarImage: {
    width: '100%',
    height: '100%',
  },
  onlineIndicator: {
    position: 'absolute',
    width: 14,
    height: 14,
    borderRadius: 7,
    borderWidth: 2,
    borderColor: '#FFFFFF',
    bottom: 6,
    right: 6,
  },
  profileNameContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
  },
  profileName: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#FFFFFF',
  },
  verifiedIcon: {
    marginLeft: 4,
  },
  profileUsername: {
    fontSize: 14,
    color: 'rgba(255, 255, 255, 0.9)',
    marginBottom: 8,
  },
  profileBio: {
    fontSize: 13,
    color: 'rgba(255, 255, 255, 0.9)',
    textAlign: 'center',
    marginHorizontal: 20,
    marginBottom: 10,
    lineHeight: 18,
  },
  profileDetails: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginBottom: 10,
  },
  detailItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginHorizontal: 8,
  },
  detailText: {
    fontSize: 12,
    color: 'rgba(255, 255, 255, 0.9)',
    marginLeft: 4,
  },
  languageTag: {
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
    marginBottom: 10,
  },
  languageText: {
    fontSize: 13,
    color: '#FFFFFF',
    fontWeight: '500',
  },
  followStatsContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginTop: 12,
    width: '100%',
  },
  followStatItem: {
    alignItems: 'center',
    marginHorizontal: 20,
    padding: 8,
    minWidth: 80,
  },
  followStatNumber: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#FFFFFF',
  },
  followStatLabel: {
    fontSize: 13,
    color: 'rgba(255, 255, 255, 0.9)',
  },
  mutualStatText: {
    fontSize: 11,
    color: 'rgba(255, 255, 255, 0.7)',
    marginTop: 2,
  },
  statsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 8,
  },
  statCard: {
    flex: 1,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    borderRadius: 10,
    padding: 10,
    alignItems: 'center',
    marginHorizontal: 3,
  },
  statNumber: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#FFFFFF',
    marginBottom: 2,
  },
  statLabel: {
    fontSize: 11,
    color: 'rgba(255, 255, 255, 0.9)',
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
  content: {
    flex: 1,
    minHeight: height * 0.5, // Ensure minimum height for content
  },
  clipsSection: {
    paddingHorizontal: width * 0.05,
    paddingTop: 20,
    paddingBottom: 100, // Add bottom padding
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
    marginBottom: 8,
  },
  clipPhrase: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#1F2937',
  },
  clipTranslation: {
    fontSize: 14,
    color: '#6B7280',
    marginBottom: 16,
  },
  clipTime: {
    fontSize: 12,
    color: '#9CA3AF',
  },
  clipStats: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginTop: 12,
  },
  statItem: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  statText: {
    marginLeft: 4,
    fontSize: 14,
    color: '#6B7280',
  },
  waveformContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    height: 40,
    marginBottom: 16,
  },
  waveformBar: {
    width: 3,
    backgroundColor: '#FF8A00',
    marginHorizontal: 1,
    borderRadius: 2,
  },
  badgesSection: {
    paddingHorizontal: width * 0.05,
    paddingTop: 20,
    paddingBottom: 100, // Add bottom padding
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1F2937',
    marginBottom: 16,
  },
  badgeCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    flexDirection: 'row',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 2,
  },
  badgeIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
    position: 'relative',
  },
  lockIcon: {
    position: 'absolute',
    bottom: -4,
    right: -4,
    backgroundColor: '#FFFFFF',
    borderRadius: 8,
    padding: 2,
  },
  badgeContent: {
    flex: 1,
  },
  badgeTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1F2937',
    marginBottom: 4,
  },
  badgeDescription: {
    fontSize: 14,
    color: '#6B7280',
    lineHeight: 20,
    marginBottom: 4,
  },
  badgeDate: {
    fontSize: 12,
    color: '#9CA3AF',
    fontWeight: '500',
  },
  rewardsSection: {
    paddingHorizontal: width * 0.05,
    paddingTop: 20,
    paddingBottom: 100, // Add bottom padding
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
  modalContainer: {
    flex: 1,
    backgroundColor: '#FFFFFF',
    marginTop: 80,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    padding: 16,
    paddingBottom: 40,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#1F2937',
  },
  modalContent: {
    flex: 1,
  },
  emptyModalState: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 60,
  },
  emptyModalText: {
    fontSize: 16,
    color: '#6B7280',
    marginTop: 16,
  },
  userItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
  },
  userAvatar: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#F3F4F6',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
    position: 'relative',
    overflow: 'hidden',
  },
  userInfo: {
    flex: 1,
  },
  userNameContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  userName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1F2937',
  },
  userUsername: {
    fontSize: 14,
    color: '#6B7280',
    marginBottom: 2,
  },
  userStats: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 2,
  },
  userStat: {
    fontSize: 12,
    color: '#9CA3AF',
    marginRight: 8,
  },
  mutualFollowBadge: {
    backgroundColor: '#E5E7EB',
    borderRadius: 4,
    paddingHorizontal: 6,
    paddingVertical: 2,
  },
  mutualFollowText: {
    fontSize: 10,
    color: '#4B5563',
    fontWeight: '500',
  },
  followButton: {
    backgroundColor: '#FF8A00',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 16,
    minWidth: 80,
    alignItems: 'center',
  },
  followingButton: {
    backgroundColor: '#E5E7EB',
  },
  followButtonText: {
    color: '#FFFFFF',
    fontWeight: '600',
    fontSize: 14,
  },
  followingButtonText: {
    color: '#4B5563',
  },
});
export default ProfileScreen;