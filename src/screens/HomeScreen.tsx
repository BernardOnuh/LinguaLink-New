// src/screens/HomeScreen.tsx
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

type HomeScreenNavigationProp = CompositeNavigationProp<
  BottomTabNavigationProp<TabParamList, 'Home'>,
  NativeStackNavigationProp<RootStackParamList>
>;

interface Props {
  navigation: HomeScreenNavigationProp;
}

interface VoiceClip {
  id: string;
  user: {
    name: string;
    username: string;
    avatar: string;
    language: string;
  };
  phrase: string;
  translation: string;
  audioWaveform: number[];
  likes: number;
  comments: number;
  shares: number;
  timeAgo: string;
}

interface Story {
  id: string;
  user: {
    name: string;
    username: string;
    avatar: string;
    language: string;
  };
  title: string;
  thumbnail: string;
  duration: string;
  likes: number;
  shares: number;
  timeAgo: string;
  isAIStory: boolean;
}

const mockVoiceClips: VoiceClip[] = [
  {
    id: '1',
    user: {
      name: 'Adunni Lagos',
      username: 'Adur',
      avatar: '🌱',
      language: 'Yoruba / Ekiti Dialect'
    },
    phrase: 'E kààrọ́',
    translation: 'This means "Good Morning" in Yoruba',
    audioWaveform: [20, 40, 60, 80, 60, 40, 70, 90, 50, 30, 60, 80, 40, 20, 50, 70],
    likes: 342,
    comments: 28,
    shares: 156,
    timeAgo: '2h'
  }
];

const mockStories: Story[] = [
  {
    id: '1',
    user: {
      name: 'Aisha Mohammed',
      username: 'aisha_storyteller',
      avatar: '👩🏾',
      language: 'Hausa'
    },
    title: 'The Wise Old Baobab Tree',
    thumbnail: '/api/placeholder/300/200',
    duration: '3:12',
    likes: 98,
    shares: 7,
    timeAgo: '1d',
    isAIStory: true
  }
];

const HomeScreen: React.FC<Props> = ({ navigation }) => {
  const [activeTab, setActiveTab] = useState<'All' | 'Voice' | 'Stories' | 'Lab'>('All');
  const [showCreateModal, setShowCreateModal] = useState(false);

  const renderWaveform = (waveform: number[]) => (
    <View style={styles.waveformContainer}>
      {waveform.map((height, index) => (
        <View
          key={index}
          style={[
            styles.waveformBar,
            { height: height * 0.8 }
          ]}
        />
      ))}
    </View>
  );

  const renderVoiceClip = (clip: VoiceClip) => (
    <View key={clip.id} style={styles.voiceClipCard}>
      <View style={styles.voiceClipHeader}>
        <View style={styles.userInfo}>
          <View style={styles.avatar}>
            <Text style={styles.avatarText}>{clip.user.avatar}</Text>
          </View>
          <View style={styles.userDetails}>
            <Text style={styles.userName}>{clip.user.name}</Text>
            <View style={styles.languageTag}>
              <Text style={styles.languageText}>{clip.user.language}</Text>
            </View>
          </View>
        </View>
        <Text style={styles.timeAgo}>{clip.timeAgo}</Text>
      </View>

      <View style={styles.phraseContainer}>
        <Text style={styles.phrase}>{clip.phrase}</Text>
        <Text style={styles.translation}>{clip.translation}</Text>
      </View>

      {renderWaveform(clip.audioWaveform)}

      <TouchableOpacity style={styles.playButton}>
        <Ionicons name="play" size={24} color="#FFFFFF" />
      </TouchableOpacity>

      <View style={styles.voiceClipActions}>
        <TouchableOpacity style={styles.actionButton}>
          <Ionicons name="heart-outline" size={20} color="#666" />
          <Text style={styles.actionText}>{clip.likes}</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.actionButton}>
          <Ionicons name="chatbubble-outline" size={20} color="#666" />
          <Text style={styles.actionText}>{clip.comments}</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.actionButton}>
          <Ionicons name="checkmark-circle-outline" size={20} color="#10B981" />
          <Text style={styles.actionText}>{clip.shares}</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.moreButton}>
          <Ionicons name="ellipsis-horizontal" size={20} color="#666" />
        </TouchableOpacity>
      </View>
    </View>
  );

  const renderStory = (story: Story) => (
    <View key={story.id} style={styles.storyCard}>
      <View style={styles.storyHeader}>
        <View style={styles.userInfo}>
          <View style={styles.avatar}>
            <Text style={styles.avatarText}>{story.user.avatar}</Text>
          </View>
          <View style={styles.userDetails}>
            <Text style={styles.userName}>{story.user.name}</Text>
            <View style={styles.storyTypeContainer}>
              {story.isAIStory && (
                <Ionicons name="sparkles" size={12} color="#8B5CF6" />
              )}
              <Text style={styles.storyType}>
                {story.isAIStory ? 'AI Story' : 'Story'} • {story.user.language}
              </Text>
            </View>
          </View>
        </View>
        <Text style={styles.timeAgo}>{story.timeAgo}</Text>
      </View>

      <View style={styles.storyContent}>
        <View style={styles.storyThumbnail}>
          <View style={styles.thumbnailPlaceholder}>
            <Text style={styles.storyTitle}>{story.title}</Text>
          </View>
          <TouchableOpacity style={styles.storyPlayButton}>
            <Ionicons name="play" size={32} color="#FFFFFF" />
          </TouchableOpacity>
          <View style={styles.durationBadge}>
            <Text style={styles.durationText}>{story.duration}</Text>
          </View>
        </View>
        <Text style={styles.storyTitleText}>{story.title}</Text>
      </View>

      <View style={styles.storyActions}>
        <TouchableOpacity style={styles.actionButton}>
          <Ionicons name="heart-outline" size={20} color="#666" />
          <Text style={styles.actionText}>{story.likes}</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.actionButton}>
          <Ionicons name="sparkles-outline" size={20} color="#666" />
          <Text style={styles.actionText}>{story.shares}</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.actionButton}>
          <Ionicons name="share-outline" size={20} color="#666" />
        </TouchableOpacity>
        <TouchableOpacity style={styles.moreButton}>
          <Ionicons name="ellipsis-horizontal" size={20} color="#666" />
        </TouchableOpacity>
      </View>
    </View>
  );

  const CreateModal = () => (
    <Modal
      visible={showCreateModal}
      transparent
      animationType="fade"
      onRequestClose={() => setShowCreateModal(false)}
    >
      <View style={styles.modalOverlay}>
        <View style={styles.createModalContent}>
          <Text style={styles.createModalTitle}>What would you like to create?</Text>
          
          <TouchableOpacity 
            style={styles.createOption}
            onPress={() => {
              setShowCreateModal(false);
              navigation.navigate('RecordVoice');
            }}
          >
            <View style={styles.createOptionIcon}>
              <Ionicons name="mic" size={24} color="#FF8A00" />
            </View>
            <View style={styles.createOptionContent}>
              <Text style={styles.createOptionTitle}>Record Voice Clip</Text>
              <Text style={styles.createOptionDescription}>Share a phrase in your language</Text>
            </View>
          </TouchableOpacity>

          <TouchableOpacity 
            style={styles.createOption}
            onPress={() => {
              setShowCreateModal(false);
              navigation.navigate('TellStory');
            }}
          >
            <View style={[styles.createOptionIcon, styles.purpleIcon]}>
              <Ionicons name="book" size={24} color="#8B5CF6" />
            </View>
            <View style={styles.createOptionContent}>
              <Text style={styles.createOptionTitle}>Create AI Story</Text>
              <Text style={styles.createOptionDescription}>Turn your voice into animated stories</Text>
            </View>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor="#FF8A00" />
      
      {/* Header */}
      <View style={styles.header}>
        <View style={styles.headerContent}>
          <Ionicons name="mic" size={24} color="#FFFFFF" />
          <Text style={styles.headerTitle}>LinguaLink</Text>
          <TouchableOpacity>
            <Ionicons name="ellipsis-horizontal" size={24} color="#FFFFFF" />
          </TouchableOpacity>
        </View>
      </View>

      {/* Tab Navigation */}
      <View style={styles.tabContainer}>
        {['All', 'Voice', 'Stories', 'Lab'].map((tab) => (
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
      <ScrollView 
        style={styles.content}
        showsVerticalScrollIndicator={false}
      >
        {activeTab === 'All' || activeTab === 'Voice' ? (
          mockVoiceClips.map(renderVoiceClip)
        ) : null}
        
        {activeTab === 'All' || activeTab === 'Stories' ? (
          mockStories.map(renderStory)
        ) : null}
      </ScrollView>

      {/* Floating Create Button */}
      <TouchableOpacity 
        style={styles.createButton}
        onPress={() => setShowCreateModal(true)}
      >
        <Ionicons name="add" size={24} color="#FFFFFF" />
      </TouchableOpacity>

      <CreateModal />
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
    paddingBottom: height * 0.02,
    paddingHorizontal: width * 0.05,
  },
  headerContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  headerTitle: {
    fontSize: width * 0.05,
    fontWeight: 'bold',
    color: '#FFFFFF',
  },
  tabContainer: {
    flexDirection: 'row',
    backgroundColor: '#FFFFFF',
    paddingHorizontal: width * 0.05,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E5E5',
  },
  tab: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    marginRight: 16,
    borderRadius: 20,
  },
  activeTab: {
    backgroundColor: '#FF8A00',
  },
  tabText: {
    fontSize: 14,
    fontWeight: '500',
    color: '#666',
  },
  activeTabText: {
    color: '#FFFFFF',
  },
  content: {
    flex: 1,
    paddingHorizontal: width * 0.05,
    paddingTop: 16,
  },
  voiceClipCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 16,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  voiceClipHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  userInfo: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  avatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#F3F4F6',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  avatarText: {
    fontSize: 20,
  },
  userDetails: {
    flex: 1,
  },
  userName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1F2937',
    marginBottom: 2,
  },
  languageTag: {
    backgroundColor: '#FEF3E2',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 12,
    alignSelf: 'flex-start',
  },
  languageText: {
    fontSize: 12,
    color: '#D97706',
    fontWeight: '500',
  },
  timeAgo: {
    fontSize: 12,
    color: '#9CA3AF',
  },
  phraseContainer: {
    marginBottom: 16,
  },
  phrase: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#1F2937',
    marginBottom: 4,
    textAlign: 'center',
  },
  translation: {
    fontSize: 14,
    color: '#6B7280',
    textAlign: 'center',
  },
  waveformContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    height: 60,
    marginBottom: 16,
  },
  waveformBar: {
    width: 3,
    backgroundColor: '#FF8A00',
    marginHorizontal: 1,
    borderRadius: 2,
  },
  playButton: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: '#1F2937',
    justifyContent: 'center',
    alignItems: 'center',
    alignSelf: 'center',
    marginBottom: 16,
  },
  voiceClipActions: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  actionText: {
    marginLeft: 4,
    fontSize: 14,
    color: '#666',
  },
  moreButton: {
    padding: 4,
  },
  storyCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 16,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  storyHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  storyTypeContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  storyType: {
    fontSize: 12,
    color: '#8B5CF6',
    fontWeight: '500',
    marginLeft: 4,
  },
  storyContent: {
    marginBottom: 12,
  },
  storyThumbnail: {
    height: 200,
    borderRadius: 12,
    backgroundColor: '#E5E7EB',
    marginBottom: 8,
    position: 'relative',
    justifyContent: 'center',
    alignItems: 'center',
  },
  thumbnailPlaceholder: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  storyTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#374151',
    textAlign: 'center',
  },
  storyPlayButton: {
    position: 'absolute',
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: 'rgba(255, 255, 255, 0.9)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  durationBadge: {
    position: 'absolute',
    bottom: 8,
    right: 8,
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  durationText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '500',
  },
  storyTitleText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1F2937',
  },
  storyActions: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  createButton: {
    position: 'absolute',
    bottom: 100,
    right: 20,
    width: 56,
    height: 56,
    borderRadius: 16,
    backgroundColor: '#FF8A00',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  createModalContent: {
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    padding: 24,
    paddingBottom: 40,
  },
  createModalTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: '#1F2937',
    marginBottom: 24,
    textAlign: 'center',
  },
  createOption: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F8F9FA',
    borderRadius: 16,
    padding: 16,
    marginBottom: 12,
  },
  createOptionIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#FEF3E2',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },
  purpleIcon: {
    backgroundColor: '#F3E8FF',
  },
  createOptionContent: {
    flex: 1,
  },
  createOptionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1F2937',
    marginBottom: 2,
  },
  createOptionDescription: {
    fontSize: 14,
    color: '#6B7280',
  },
});

export default HomeScreen;