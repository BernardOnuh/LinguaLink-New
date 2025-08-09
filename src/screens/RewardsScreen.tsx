// src/screens/RewardsScreen.tsx
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
import { BottomTabNavigationProp } from '@react-navigation/bottom-tabs';
import { TabParamList } from '../../App';

const { width, height } = Dimensions.get('window');

type RewardsScreenNavigationProp = BottomTabNavigationProp<TabParamList, 'Rewards'>;

interface Props {
  navigation: RewardsScreenNavigationProp;
}

interface Contributor {
  id: string;
  name: string;
  username: string;
  avatar: string;
  points: number;
  contributions: number;
  badge: string;
  rank: number;
}

const mockContributors: Contributor[] = [
  {
    id: '1',
    name: 'Amara',
    username: 'Amara_Linguist',
    avatar: '🌱',
    points: 15420,
    contributions: 234,
    badge: 'Language MVP',
    rank: 1
  },
  {
    id: '2',
    name: 'Kofi Ghana',
    username: 'Kofi_Ghana',
    avatar: '👨🏾',
    points: 12890,
    contributions: 187,
    badge: 'Regional Star',
    rank: 2
  },
  {
    id: '3',
    name: 'Zara Naija',
    username: 'Zara_Naija',
    avatar: '👩🏾',
    points: 11650,
    contributions: 156,
    badge: 'Voice Champion',
    rank: 3
  }
];

const RewardsScreen: React.FC<Props> = ({ navigation }) => {
  const [activeTab, setActiveTab] = useState<'Top Contributors' | 'Reward Store'>('Top Contributors');
  const currentUserPoints = 1250;
  const currentUserRank = 5;

  const getBadgeIcon = (badge: string) => {
    switch (badge) {
      case 'Language MVP':
        return '👑';
      case 'Regional Star':
        return '🏆';
      case 'Voice Champion':
        return '🎖️';
      default:
        return '🏅';
    }
  };

  const getBadgeColor = (badge: string) => {
    switch (badge) {
      case 'Language MVP':
        return '#FFD700';
      case 'Regional Star':
        return '#C0C0C0';
      case 'Voice Champion':
        return '#CD7F32';
      default:
        return '#10B981';
    }
  };

  const renderContributor = (contributor: Contributor, index: number) => (
    <View key={contributor.id} style={styles.contributorCard}>
      <View style={styles.contributorRank}>
        {contributor.rank <= 3 ? (
          <Text style={styles.rankEmoji}>
            {contributor.rank === 1 ? '👑' : contributor.rank === 2 ? '🥈' : '🥉'}
          </Text>
        ) : (
          <Text style={styles.rankNumber}>{contributor.rank}</Text>
        )}
      </View>
      
      <View style={styles.contributorAvatar}>
        <Text style={styles.avatarText}>{contributor.avatar}</Text>
      </View>
      
      <View style={styles.contributorInfo}>
        <Text style={styles.contributorName}>{contributor.name}</Text>
        <Text style={styles.contributorUsername}>{contributor.username}</Text>
        <Text style={styles.contributorStats}>
          {contributor.contributions} contributions
        </Text>
      </View>
      
      <View style={styles.contributorPoints}>
        <Text style={styles.pointsNumber}>{contributor.points.toLocaleString()}</Text>
        <Text style={styles.badgeText}>{contributor.badge}</Text>
      </View>
    </View>
  );

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor="#FF8A00" />
      
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Leaderboard & Rewards</Text>
        
        {/* User Points Card */}
        <View style={styles.userPointsCard}>
          <View style={styles.pointsSection}>
            <Text style={styles.pointsLabel}>Your Points</Text>
            <Text style={styles.pointsValue}>{currentUserPoints.toLocaleString()}</Text>
          </View>
          <View style={styles.rankSection}>
            <Text style={styles.rankLabel}>Current Rank</Text>
            <Text style={styles.rankValue}>#{currentUserRank}</Text>
          </View>
        </View>
      </View>

      {/* Tab Navigation */}
      <View style={styles.tabContainer}>
        <TouchableOpacity
          style={[
            styles.tab,
            activeTab === 'Top Contributors' && styles.activeTab
          ]}
          onPress={() => setActiveTab('Top Contributors')}
        >
          <Text style={[
            styles.tabText,
            activeTab === 'Top Contributors' && styles.activeTabText
          ]}>
            Top Contributors
          </Text>
        </TouchableOpacity>
        
        <TouchableOpacity
          style={[
            styles.tab,
            activeTab === 'Reward Store' && styles.activeTab
          ]}
          onPress={() => setActiveTab('Reward Store')}
        >
          <Text style={[
            styles.tabText,
            activeTab === 'Reward Store' && styles.activeTabText
          ]}>
            Reward Store
          </Text>
        </TouchableOpacity>
      </View>

      {/* Content */}
      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {activeTab === 'Top Contributors' && (
          <View style={styles.contributorsSection}>
            {/* Top 3 Highlighted */}
            <View style={styles.topThreeContainer}>
              {mockContributors.slice(0, 3).map((contributor, index) => (
                <View key={contributor.id} style={[
                  styles.topContributorCard,
                  index === 0 && styles.firstPlace,
                  index === 1 && styles.secondPlace,
                  index === 2 && styles.thirdPlace,
                ]}>
                  <Text style={styles.topRankEmoji}>
                    {index === 0 ? '👑' : index === 1 ? '🥈' : '🥉'}
                  </Text>
                  <View style={styles.topAvatar}>
                    <Text style={styles.topAvatarText}>{contributor.avatar}</Text>
                  </View>
                  <Text style={styles.topContributorName}>{contributor.name}</Text>
                  <Text style={styles.topContributorPoints}>
                    {contributor.points.toLocaleString()}
                  </Text>
                  <Text style={styles.topContributorBadge}>{contributor.badge}</Text>
                </View>
              ))}
            </View>

            {/* All Contributors List */}
            <View style={styles.allContributorsSection}>
              <Text style={styles.sectionTitle}>All Contributors</Text>
              {mockContributors.map(renderContributor)}
            </View>
          </View>
        )}

        {activeTab === 'Reward Store' && (
          <View style={styles.rewardStoreSection}>
            <Text style={styles.sectionTitle}>Coming Soon!</Text>
            <View style={styles.comingSoonCard}>
              <Ionicons name="gift-outline" size={64} color="#FF8A00" />
              <Text style={styles.comingSoonTitle}>Reward Store</Text>
              <Text style={styles.comingSoonDescription}>
                Exciting rewards are coming soon! Earn points by contributing voice clips and creating stories.
              </Text>
              
              <View style={styles.rewardPreview}>
                <Text style={styles.previewTitle}>Coming rewards:</Text>
                <Text style={styles.previewItem}>🎓 Language Certificates</Text>
                <Text style={styles.previewItem}>🎁 Cultural Merchandise</Text>
                <Text style={styles.previewItem}>📚 Premium Story Templates</Text>
                <Text style={styles.previewItem}>🏆 Exclusive Badges</Text>
              </View>
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
  headerTitle: {
    fontSize: width * 0.055,
    fontWeight: 'bold',
    color: '#FFFFFF',
    marginBottom: 20,
  },
  userPointsCard: {
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    borderRadius: 16,
    padding: 16,
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  pointsSection: {
    flex: 1,
  },
  pointsLabel: {
    fontSize: 14,
    color: 'rgba(255, 255, 255, 0.8)',
    marginBottom: 4,
  },
  pointsValue: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#FFFFFF',
  },
  rankSection: {
    flex: 1,
    alignItems: 'flex-end',
  },
  rankLabel: {
    fontSize: 14,
    color: 'rgba(255, 255, 255, 0.8)',
    marginBottom: 4,
  },
  rankValue: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#FFFFFF',
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
  contributorsSection: {
    paddingHorizontal: width * 0.05,
    paddingTop: 20,
  },
  topThreeContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 30,
  },
  topContributorCard: {
    flex: 1,
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 16,
    marginHorizontal: 4,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  firstPlace: {
    borderColor: '#FFD700',
    borderWidth: 2,
  },
  secondPlace: {
    borderColor: '#C0C0C0',
    borderWidth: 2,
  },
  thirdPlace: {
    borderColor: '#CD7F32',
    borderWidth: 2,
  },
  topRankEmoji: {
    fontSize: 24,
    marginBottom: 8,
  },
  topAvatar: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: '#F3F4F6',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 8,
  },
  topAvatarText: {
    fontSize: 24,
  },
  topContributorName: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1F2937',
    marginBottom: 4,
    textAlign: 'center',
  },
  topContributorPoints: {
    fontSize: 12,
    fontWeight: 'bold',
    color: '#FF8A00',
    marginBottom: 4,
  },
  topContributorBadge: {
    fontSize: 10,
    color: '#6B7280',
    textAlign: 'center',
  },
  allContributorsSection: {
    marginTop: 20,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: '#1F2937',
    marginBottom: 16,
  },
  contributorCard: {
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
  contributorRank: {
    width: 40,
    alignItems: 'center',
    marginRight: 12,
  },
  rankEmoji: {
    fontSize: 20,
  },
  rankNumber: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#6B7280',
  },
  contributorAvatar: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: '#F3F4F6',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  avatarText: {
    fontSize: 24,
  },
  contributorInfo: {
    flex: 1,
  },
  contributorName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1F2937',
    marginBottom: 2,
  },
  contributorUsername: {
    fontSize: 14,
    color: '#6B7280',
    marginBottom: 2,
  },
  contributorStats: {
    fontSize: 12,
    color: '#9CA3AF',
  },
  contributorPoints: {
    alignItems: 'flex-end',
  },
  pointsNumber: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#FF8A00',
    marginBottom: 2,
  },
  badgeText: {
    fontSize: 12,
    color: '#6B7280',
  },
  rewardStoreSection: {
    paddingHorizontal: width * 0.05,
    paddingTop: 20,
  },
  comingSoonCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 32,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  comingSoonTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#1F2937',
    marginTop: 16,
    marginBottom: 8,
  },
  comingSoonDescription: {
    fontSize: 16,
    color: '#6B7280',
    textAlign: 'center',
    lineHeight: 22,
    marginBottom: 24,
  },
  rewardPreview: {
    alignSelf: 'stretch',
  },
  previewTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1F2937',
    marginBottom: 12,
    textAlign: 'center',
  },
  previewItem: {
    fontSize: 14,
    color: '#6B7280',
    marginBottom: 8,
    textAlign: 'center',
  },
});

export default RewardsScreen;