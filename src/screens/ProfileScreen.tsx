// src/screens/ProfileScreen.tsx
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

interface VoiceClip {
  id: string;
  phrase: string;
  language: string;
  likes: number;
  comments: number;
  validations: number;
  timeAgo: string;
}

const mockVoiceClips: VoiceClip[] = [
  {
    id: '1',
    phrase: 'E kààrọ́',
    language: 'Yoruba / Ekiti',
    likes: 45,
    comments: 8,
    validations: 23,
    timeAgo: '2 days ago'
  },
  {
    id: '2',
    phrase: 'Bawo ni',
    language: 'Yoruba / Ekiti',
    likes: 32,
    comments: 12,
    validations: 18,
    timeAgo: '1 week ago'
  }
];

const ProfileScreen: React.FC<Props> = ({ navigation }) => {
  const [activeTab, setActiveTab] = useState<'My Clips' | 'Badges' | 'Rewards'>('My Clips');

  const renderVoiceClip = (clip: VoiceClip) => (
    <View key={clip.id} style={styles.clipCard}>
      <View style={styles.clipHeader}>
        <Text style={styles.clipPhrase}>{clip.phrase}</Text>
        <Text style={styles.clipTime}>{clip.timeAgo}</Text>
      </View>
      <Text style={styles.clipLanguage}>{clip.language}</Text>
      
      <View style={styles.clipStats}>
        <View style={styles.statItem}>
          <Ionicons name="trophy" size={16} color="#FF8A00" />
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
      </View>
    </View>
  );

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor="#FF8A00" />
      
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
              <Text style={styles.avatarText}>Onuh</Text>
            </View>
          </View>
          <Text style={styles.profileName}>Nana Bambara</Text>
          <Text style={styles.profileUsername}>@Onuh</Text>
          <View style={styles.languageTag}>
            <Text style={styles.languageText}>Yoruba / Lagos Dialect</Text>
          </View>
        </View>
        
        {/* Stats */}
        <View style={styles.statsContainer}>
          <View style={styles.statCard}>
            <Text style={styles.statNumber}>0</Text>
            <Text style={styles.statLabel}>Validations</Text>
          </View>
          <View style={styles.statCard}>
            <Text style={styles.statNumber}>0</Text>
            <Text style={styles.statLabel}>Contributions</Text>
          </View>
          <View style={styles.statCard}>
            <Text style={styles.statNumber}>0</Text>
            <Text style={styles.statLabel}>Duets</Text>
          </View>
        </View>
      </View>

      {/* Tab Navigation */}
      <View style={styles.tabContainer}>
        {['My Clips', 'Badges', 'Rewards'].map((tab) => (
          <TouchableOpacity
            key={tab}
            style={[
              styles.tab,
              activeTab === tab && styles.activeTab
            ]}
            onPress={() => setActiveTab(tab as typeof activeTab)}
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
      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {activeTab === 'My Clips' && (
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
              </View>
            )}
          </View>
        )}

        {activeTab === 'Badges' && (
          <View style={styles.badgesSection}>
            <View style={styles.badgeCard}>
              <View style={styles.badgeIcon}>
                <Ionicons name="sparkles" size={32} color="#FF8A00" />
              </View>
              <View style={styles.badgeContent}>
                <Text style={styles.badgeTitle}>Language Pioneer</Text>
                <Text style={styles.badgeDescription}>
                  Welcome to LinguaLink! Ready to preserve languages.
                </Text>
                <Text style={styles.badgeDate}>Earned today</Text>
              </View>
            </View>
            
            <View style={styles.lockedBadgesContainer}>
              <Text style={styles.sectionTitle}>Locked Badges</Text>
              <View style={styles.lockedBadge}>
                <Ionicons name="lock-closed" size={24} color="#9CA3AF" />
                <Text style={styles.lockedBadgeText}>First Recording</Text>
              </View>
              <View style={styles.lockedBadge}>
                <Ionicons name="lock-closed" size={24} color="#9CA3AF" />
                <Text style={styles.lockedBadgeText}>Story Teller</Text>
              </View>
              <View style={styles.lockedBadge}>
                <Ionicons name="lock-closed" size={24} color="#9CA3AF" />
                <Text style={styles.lockedBadgeText}>Community Helper</Text>
              </View>
            </View>
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
            </View>
          </View>
        )}
      </ScrollView>
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
    paddingTop: height * 0.02,
    paddingBottom: height * 0.03,
    paddingHorizontal: width * 0.05,
  },
  headerContent: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  headerTitle: {
    fontSize: width * 0.06,
    fontWeight: 'bold',
    color: '#FFFFFF',
  },
  profileInfo: {
    alignItems: 'center',
    marginBottom: 20,
  },
  avatarContainer: {
    marginBottom: 12,
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
  },
  avatarText: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#FFFFFF',
  },
  profileName: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#FFFFFF',
    marginBottom: 4,
  },
  profileUsername: {
    fontSize: 16,
    color: 'rgba(255, 255, 255, 0.8)',
    marginBottom: 8,
  },
  languageTag: {
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 12,
  },
  languageText: {
    fontSize: 14,
    color: '#FFFFFF',
    fontWeight: '500',
  },
  statsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  statCard: {
    flex: 1,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
    marginHorizontal: 4,
  },
  statNumber: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#FFFFFF',
    marginBottom: 4,
  },
  statLabel: {
    fontSize: 12,
    color: 'rgba(255, 255, 255, 0.8)',
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
  },
  clipsSection: {
    paddingHorizontal: width * 0.05,
    paddingTop: 20,
  },
  clipCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
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
    marginBottom: 4,
  },
  clipPhrase: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1F2937',
  },
  clipTime: {
    fontSize: 12,
    color: '#9CA3AF',
  },
  clipLanguage: {
    fontSize: 14,
    color: '#6B7280',
    marginBottom: 12,
  },
  clipStats: {
    flexDirection: 'row',
    justifyContent: 'space-between',
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
  badgesSection: {
    paddingHorizontal: width * 0.05,
    paddingTop: 20,
  },
  badgeCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
    marginBottom: 20,
    flexDirection: 'row',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 2,
  },
  badgeIcon: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: '#FEF3E2',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
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
    color: '#FF8A00',
    fontWeight: '500',
  },
  lockedBadgesContainer: {
    marginTop: 20,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1F2937',
    marginBottom: 12,
  },
  lockedBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F9FAFB',
    borderRadius: 8,
    padding: 12,
    marginBottom: 8,
  },
  lockedBadgeText: {
    marginLeft: 12,
    fontSize: 14,
    color: '#9CA3AF',
  },
  rewardsSection: {
    paddingHorizontal: width * 0.05,
    paddingTop: 20,
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
});

export default ProfileScreen;