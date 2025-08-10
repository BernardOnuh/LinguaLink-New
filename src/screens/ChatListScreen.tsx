// src/screens/ChatListScreen.tsx
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
  TextInput,
  Modal,
  FlatList,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { CompositeNavigationProp } from '@react-navigation/native';
import { BottomTabNavigationProp } from '@react-navigation/bottom-tabs';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';

const { width, height } = Dimensions.get('window');

interface ChatContact {
  id: string;
  name: string;
  username: string;
  avatar: string;
  language: string;
  lastMessage: string;
  lastMessageTime: string;
  unreadCount: number;
  isOnline: boolean;
  lastMessageTranslated?: string;
  isFollowing?: boolean;
  followers?: number;
  posts?: number;
}

interface Group {
  id: string;
  name: string;
  description: string;
  avatar: string;
  members: number;
  language: string;
  lastActivity: string;
  isPrivate: boolean;
  unreadCount: number;
}

interface Story {
  id: string;
  user: ChatContact;
  thumbnail: string;
  timestamp: string;
  viewed: boolean;
}

const mockContacts: ChatContact[] = [
  {
    id: '1',
    name: 'Chidi Okafor',
    username: 'ChidiIgbo',
    avatar: '👨🏾',
    language: 'Igbo',
    lastMessage: 'Ndewo, kedu ka ị mere?',
    lastMessageTranslated: 'Hello, how are you doing?',
    lastMessageTime: '2m',
    unreadCount: 2,
    isOnline: true,
    isFollowing: true,
    followers: 1254,
    posts: 45,
  },
  {
    id: '2',
    name: 'Aisha Mohammed',
    username: 'aisha_kano',
    avatar: '👩🏾',
    language: 'Hausa',
    lastMessage: 'Sannu, yaya dai?',
    lastMessageTranslated: 'Hello, how are things?',
    lastMessageTime: '15m',
    unreadCount: 0,
    isOnline: true,
    isFollowing: false,
    followers: 892,
    posts: 23,
  },
  // Add more contacts...
];

const mockGroups: Group[] = [
  {
    id: 'group_1',
    name: 'Igbo Language Learners',
    description: 'Learn and practice Igbo together',
    avatar: '🏫',
    members: 234,
    language: 'Igbo',
    lastActivity: '5m',
    isPrivate: false,
    unreadCount: 3,
  },
  {
    id: 'group_2',
    name: 'Yoruba Cultural Exchange',
    description: 'Share Yoruba culture and traditions',
    avatar: '🎭',
    members: 189,
    language: 'Yoruba',
    lastActivity: '1h',
    isPrivate: false,
    unreadCount: 1,
  },
];

const mockStories: Story[] = [
  {
    id: 'story_1',
    user: mockContacts[0],
    thumbnail: '🎬',
    timestamp: '2h',
    viewed: false,
  },
  {
    id: 'story_2',
    user: mockContacts[1],
    thumbnail: '🎵',
    timestamp: '4h',
    viewed: true,
  },
];

const ChatListScreen: React.FC<any> = ({ navigation }) => {
  const [activeTab, setActiveTab] = useState<'Chats' | 'Groups' | 'Contacts' | 'Games'>('Chats');
  const [searchQuery, setSearchQuery] = useState('');
  const [showTranslations, setShowTranslations] = useState(true);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showStoryModal, setShowStoryModal] = useState(false);

  const CreateModal = () => (
    <Modal
      visible={showCreateModal}
      transparent
      animationType="slide"
      onRequestClose={() => setShowCreateModal(false)}
    >
      <View style={styles.modalOverlay}>
        <TouchableOpacity 
          style={styles.modalBackground}
          onPress={() => setShowCreateModal(false)}
        />
        <View style={styles.createModalContent}>
          <Text style={styles.createModalTitle}>Create New</Text>
          
          <TouchableOpacity 
            style={styles.createOption}
            onPress={() => {
              setShowCreateModal(false);
              navigation.navigate('CreateGroup');
            }}
          >
            <Ionicons name="people" size={24} color="#10B981" />
            <View style={styles.createOptionText}>
              <Text style={styles.createOptionTitle}>Create Group</Text>
              <Text style={styles.createOptionDesc}>Start a language learning group</Text>
            </View>
          </TouchableOpacity>

          <TouchableOpacity 
            style={styles.createOption}
            onPress={() => {
              setShowCreateModal(false);
              navigation.navigate('CreateStory');
            }}
          >
            <Ionicons name="camera" size={24} color="#8B5CF6" />
            <View style={styles.createOptionText}>
              <Text style={styles.createOptionTitle}>Post Story</Text>
              <Text style={styles.createOptionDesc}>Share your language journey</Text>
            </View>
          </TouchableOpacity>

          <TouchableOpacity 
            style={styles.createOption}
            onPress={() => {
              setShowCreateModal(false);
              navigation.navigate('StartLive');
            }}
          >
            <Ionicons name="radio" size={24} color="#EF4444" />
            <View style={styles.createOptionText}>
              <Text style={styles.createOptionTitle}>Go Live</Text>
              <Text style={styles.createOptionDesc}>Start live streaming or TurnVerse game</Text>
            </View>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );

  const renderStoryItem = ({ item }: { item: Story | { id: string; user: { name: string; }; thumbnail: string; } }) => {
    // Handle "Add Story" item
    if (item.id === 'add') {
      return (
        <TouchableOpacity 
          style={styles.addStoryItem}
          onPress={() => navigation.navigate('CreateStory')}
        >
          <View style={styles.addStoryAvatar}>
            <Text style={styles.addStoryText}>➕</Text>
          </View>
          <Text style={styles.storyUsername}>Add Story</Text>
        </TouchableOpacity>
      );
    }

    // Handle regular story items
    const storyItem = item as Story;
    return (
      <TouchableOpacity 
        style={[styles.storyItem, !storyItem.viewed && styles.unviewedStory]}
        onPress={() => navigation.navigate('StoryView', { story: storyItem })}
      >
        <View style={styles.storyAvatar}>
          <Text style={styles.storyAvatarText}>{storyItem.user.avatar}</Text>
          {!storyItem.viewed && <View style={styles.storyIndicator} />}
        </View>
        <Text style={styles.storyUsername} numberOfLines={1}>
          {storyItem.user.name.split(' ')[0]}
        </Text>
      </TouchableOpacity>
    );
  };

  const renderChatItem = (contact: ChatContact) => (
    <TouchableOpacity
      key={contact.id}
      style={styles.chatItem}
      onPress={() => navigation.navigate('ChatDetail', { contact })}
    >
      <View style={styles.chatItemLeft}>
        <View style={[styles.avatar, contact.isOnline && styles.onlineAvatar]}>
          <Text style={styles.avatarText}>{contact.avatar}</Text>
          {contact.isOnline && <View style={styles.onlineIndicator} />}
        </View>
      </View>

      <View style={styles.chatItemCenter}>
        <View style={styles.chatItemHeader}>
          <Text style={styles.contactName}>{contact.name}</Text>
          <View style={styles.contactInfo}>
            <View style={styles.languageTag}>
              <Text style={styles.languageText}>{contact.language}</Text>
            </View>
            {contact.isFollowing && (
              <Ionicons name="checkmark-circle" size={12} color="#10B981" />
            )}
          </View>
        </View>
        
        <Text style={styles.lastMessage} numberOfLines={1}>
          {contact.lastMessage}
        </Text>
        
        {showTranslations && contact.lastMessageTranslated && (
          <Text style={styles.translatedMessage} numberOfLines={1}>
            📝 {contact.lastMessageTranslated}
          </Text>
        )}

        <View style={styles.contactStats}>
          <Text style={styles.statsText}>{contact.followers} followers • {contact.posts} posts</Text>
        </View>
      </View>

      <View style={styles.chatItemRight}>
        <Text style={styles.lastMessageTime}>{contact.lastMessageTime}</Text>
        {contact.unreadCount > 0 && (
          <View style={styles.unreadBadge}>
            <Text style={styles.unreadCount}>{contact.unreadCount}</Text>
          </View>
        )}
        <View style={styles.actionButtons}>
          <TouchableOpacity 
            style={styles.actionButton}
            onPress={() => navigation.navigate('VoiceCall', { contact })}
          >
            <Ionicons name="call" size={14} color="#10B981" />
          </TouchableOpacity>
          <TouchableOpacity 
            style={styles.actionButton}
            onPress={() => navigation.navigate('VideoCall', { contact })}
          >
            <Ionicons name="videocam" size={14} color="#8B5CF6" />
          </TouchableOpacity>
        </View>
      </View>
    </TouchableOpacity>
  );

  const renderGroupItem = (group: Group) => (
    <TouchableOpacity
      key={group.id}
      style={styles.groupItem}
      onPress={() => {
        // Convert group to contact format for navigation
        const contactFromGroup: ChatContact = {
          id: group.id,
          name: group.name,
          username: group.name.toLowerCase().replace(/\s+/g, '_'),
          avatar: group.avatar,
          language: group.language,
          lastMessage: group.description,
          lastMessageTime: group.lastActivity,
          unreadCount: group.unreadCount,
          isOnline: true,
          isFollowing: true,
          followers: group.members,
          posts: 0,
        };
        navigation.navigate('GroupChat', { contact: contactFromGroup });
      }}
    >
      <View style={styles.groupAvatar}>
        <Text style={styles.groupAvatarText}>{group.avatar}</Text>
        {group.isPrivate && (
          <View style={styles.privateIndicator}>
            <Ionicons name="lock-closed" size={8} color="#FFFFFF" />
          </View>
        )}
      </View>

      <View style={styles.groupInfo}>
        <View style={styles.groupHeader}>
          <Text style={styles.groupName}>{group.name}</Text>
          <Text style={styles.groupActivity}>{group.lastActivity}</Text>
        </View>
        <Text style={styles.groupDescription} numberOfLines={1}>
          {group.description}
        </Text>
        <View style={styles.groupMeta}>
          <Text style={styles.groupMembers}>{group.members} members</Text>
          <View style={styles.languageTag}>
            <Text style={styles.languageText}>{group.language}</Text>
          </View>
        </View>
      </View>

      <View style={styles.groupActions}>
        {group.unreadCount > 0 && (
          <View style={styles.unreadBadge}>
            <Text style={styles.unreadCount}>{group.unreadCount}</Text>
          </View>
        )}
        <TouchableOpacity 
          style={styles.groupCallButton}
          onPress={() => {
            // Convert group to contact format for video call
            const contactFromGroup: ChatContact = {
              id: group.id,
              name: group.name,
              username: group.name.toLowerCase().replace(/\s+/g, '_'),
              avatar: group.avatar,
              language: group.language,
              lastMessage: group.description,
              lastMessageTime: group.lastActivity,
              unreadCount: group.unreadCount,
              isOnline: true,
              isFollowing: true,
              followers: group.members,
              posts: 0,
            };
            navigation.navigate('GroupCall', { contact: contactFromGroup });
          }}
        >
          <Ionicons name="people" size={16} color="#FF8A00" />
        </TouchableOpacity>
      </View>
    </TouchableOpacity>
  );

  const renderGameItem = () => (
    <View style={styles.gamesContainer}>
      <TouchableOpacity 
        style={styles.gameCard}
        onPress={() => navigation.navigate('TurnVerse')}
      >
        <View style={styles.gameIcon}>
          <Ionicons name="game-controller" size={32} color="#FFFFFF" />
        </View>
        <Text style={styles.gameTitle}>TurnVerse</Text>
        <Text style={styles.gameDescription}>Language learning game with live streaming</Text>
        <View style={styles.gameStats}>
          <View style={styles.gameStat}>
            <Ionicons name="people" size={12} color="#10B981" />
            <Text style={styles.gameStatText}>234 playing</Text>
          </View>
          <View style={styles.gameStat}>
            <Ionicons name="radio" size={12} color="#EF4444" />
            <Text style={styles.gameStatText}>12 live</Text>
          </View>
        </View>
      </TouchableOpacity>

      <TouchableOpacity 
        style={styles.gameCard}
        onPress={() => navigation.navigate('WordChain')}
      >
        <View style={[styles.gameIcon, { backgroundColor: '#8B5CF6' }]}>
          <Ionicons name="link" size={32} color="#FFFFFF" />
        </View>
        <Text style={styles.gameTitle}>Word Chain</Text>
        <Text style={styles.gameDescription}>Build vocabulary in your language</Text>
        <View style={styles.gameStats}>
          <View style={styles.gameStat}>
            <Ionicons name="people" size={12} color="#10B981" />
            <Text style={styles.gameStatText}>89 playing</Text>
          </View>
        </View>
      </TouchableOpacity>
    </View>
  );

  const getTabContent = () => {
    const filteredContacts = mockContacts.filter(contact =>
      contact.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      contact.language.toLowerCase().includes(searchQuery.toLowerCase())
    );

    const filteredGroups = mockGroups.filter(group =>
      group.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      group.language.toLowerCase().includes(searchQuery.toLowerCase())
    );

    switch (activeTab) {
      case 'Chats':
        return filteredContacts.map(renderChatItem);
      case 'Groups':
        return filteredGroups.map(renderGroupItem);
      case 'Contacts':
        return (
          <View>
            <TouchableOpacity style={styles.findContactsButton}>
              <Ionicons name="search" size={20} color="#FF8A00" />
              <Text style={styles.findContactsText}>Find Contacts on LinguaLink</Text>
            </TouchableOpacity>
            {filteredContacts.map(renderChatItem)}
          </View>
        );
      case 'Games':
        return renderGameItem();
      default:
        return null;
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor="#FF8A00" />
      
      {/* Header */}
      <View style={styles.header}>
        <View style={styles.headerContent}>
          <Text style={styles.headerTitle}>LinguaChat</Text>
          <View style={styles.headerActions}>
            <TouchableOpacity 
              style={styles.headerButton}
              onPress={() => setShowTranslations(!showTranslations)}
            >
              <Ionicons 
                name={showTranslations ? "language" : "language-outline"} 
                size={24} 
                color="#FFFFFF" 
              />
            </TouchableOpacity>
            <TouchableOpacity 
              style={styles.headerButton}
              onPress={() => setShowCreateModal(true)}
            >
              <Ionicons name="add" size={24} color="#FFFFFF" />
            </TouchableOpacity>
          </View>
        </View>
      </View>

      {/* Stories Section */}
      {activeTab === 'Chats' && (
        <View style={styles.storiesSection}>
          <View style={styles.storiesHeader}>
            <Text style={styles.storiesTitle}>Stories</Text>
            <TouchableOpacity onPress={() => setShowStoryModal(true)}>
              <Text style={styles.seeAllText}>See All</Text>
            </TouchableOpacity>
          </View>
          <FlatList
            data={[
              { 
                id: 'add', 
                user: { name: 'Add Story', avatar: '➕' }, 
                thumbnail: '➕',
                timestamp: '',
                viewed: false
              }, 
              ...mockStories
            ]}
            renderItem={renderStoryItem}
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.storiesList}
          />
        </View>
      )}

      {/* Tab Navigation */}
      <View style={styles.tabContainer}>
        {['Chats', 'Groups', 'Contacts', 'Games'].map((tab) => (
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

      {/* Search Bar */}
      <View style={styles.searchContainer}>
        <View style={styles.searchBar}>
          <Ionicons name="search" size={20} color="#999" />
          <TextInput
            style={styles.searchInput}
            placeholder={`Search ${activeTab.toLowerCase()}...`}
            value={searchQuery}
            onChangeText={setSearchQuery}
            placeholderTextColor="#999"
          />
        </View>
      </View>

      {/* Translation Toggle Info */}
      {showTranslations && activeTab === 'Chats' && (
        <View style={styles.translationInfo}>
          <Ionicons name="information-circle" size={16} color="#10B981" />
          <Text style={styles.translationInfoText}>
            Real-time translations enabled
          </Text>
        </View>
      )}

      {/* Content List */}
      <ScrollView 
        style={styles.contentList}
        showsVerticalScrollIndicator={false}
      >
        {getTabContent()}
      </ScrollView>

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
  headerActions: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  headerButton: {
    marginLeft: 16,
  },
  storiesSection: {
    backgroundColor: '#FFFFFF',
    paddingVertical: 12,
  },
  storiesHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: width * 0.05,
    marginBottom: 8,
  },
  storiesTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1F2937',
  },
  seeAllText: {
    fontSize: 14,
    color: '#FF8A00',
    fontWeight: '500',
  },
  storiesList: {
    paddingHorizontal: width * 0.05,
  },
  storyItem: {
    alignItems: 'center',
    marginRight: 12,
  },
  addStoryItem: {
    alignItems: 'center',
    marginRight: 12,
  },
  storyAvatar: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: '#F3F4F6',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 4,
    position: 'relative',
  },
  addStoryAvatar: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: '#E5E7EB',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 4,
    borderWidth: 2,
    borderColor: '#D1D5DB',
    borderStyle: 'dashed',
  },
  storyAvatarText: {
    fontSize: 24,
  },
  addStoryText: {
    fontSize: 20,
    color: '#9CA3AF',
  },
  unviewedStory: {
    borderWidth: 2,
    borderColor: '#FF8A00',
    borderRadius: 32,
  },
  storyIndicator: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    width: 16,
    height: 16,
    borderRadius: 8,
    backgroundColor: '#FF8A00',
    borderWidth: 2,
    borderColor: '#FFFFFF',
  },
  storyUsername: {
    fontSize: 12,
    color: '#374151',
    textAlign: 'center',
    maxWidth: 60,
  },
  tabContainer: {
    flexDirection: 'row',
    backgroundColor: '#FFFFFF',
    paddingHorizontal: width * 0.05,
    paddingVertical: 8,
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
  searchContainer: {
    backgroundColor: '#FFFFFF',
    paddingHorizontal: width * 0.05,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E5E5',
  },
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F8F9FA',
    borderRadius: 20,
    paddingHorizontal: 16,
    paddingVertical: 8,
  },
  searchInput: {
    flex: 1,
    marginLeft: 8,
    fontSize: 16,
    color: '#1F2937',
  },
  translationInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#ECFDF5',
    paddingHorizontal: width * 0.05,
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E5E5',
  },
  translationInfoText: {
    marginLeft: 8,
    fontSize: 14,
    color: '#10B981',
    fontWeight: '500',
  },
  contentList: {
    flex: 1,
  },
  chatItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    paddingHorizontal: width * 0.05,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
  },
  chatItemLeft: {
    position: 'relative',
  },
  avatar: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: '#F3F4F6',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  onlineAvatar: {
    borderWidth: 2,
    borderColor: '#10B981',
  },
  avatarText: {
    fontSize: 24,
  },
  onlineIndicator: {
    position: 'absolute',
    bottom: 2,
    right: 2,
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: '#10B981',
    borderWidth: 2,
    borderColor: '#FFFFFF',
  },
  chatItemCenter: {
    flex: 1,
    marginRight: 12,
  },
  chatItemHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 4,
  },
  contactName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1F2937',
    flex: 1,
  },
  contactInfo: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  languageTag: {
    backgroundColor: '#FEF3E2',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 8,
    marginRight: 4,
  },
  languageText: {
    fontSize: 10,
    color: '#D97706',
    fontWeight: '500',
  },
  lastMessage: {
    fontSize: 14,
    color: '#6B7280',
    marginBottom: 2,
  },
  translatedMessage: {
    fontSize: 12,
    color: '#10B981',
    fontStyle: 'italic',
    marginBottom: 2,
  },
  contactStats: {
    marginTop: 2,
  },
  statsText: {
    fontSize: 11,
    color: '#9CA3AF',
  },
  chatItemRight: {
    alignItems: 'flex-end',
  },
  lastMessageTime: {
    fontSize: 12,
    color: '#9CA3AF',
    marginBottom: 4,
  },
  unreadBadge: {
    backgroundColor: '#FF8A00',
    borderRadius: 10,
    paddingHorizontal: 6,
    paddingVertical: 2,
    marginBottom: 4,
    minWidth: 20,
    alignItems: 'center',
  },
  unreadCount: {
    fontSize: 12,
    color: '#FFFFFF',
    fontWeight: '600',
  },
  actionButtons: {
    flexDirection: 'row',
  },
  actionButton: {
    backgroundColor: '#F3F4F6',
    borderRadius: 12,
    padding: 6,
    marginLeft: 4,
  },
  groupItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    paddingHorizontal: width * 0.05,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
  },
  groupAvatar: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: '#F3F4F6',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
    position: 'relative',
  },
  groupAvatarText: {
    fontSize: 24,
  },
  privateIndicator: {
    position: 'absolute',
    top: 0,
    right: 0,
    width: 16,
    height: 16,
    borderRadius: 8,
    backgroundColor: '#EF4444',
    justifyContent: 'center',
    alignItems: 'center',
  },
  groupInfo: {
    flex: 1,
    marginRight: 12,
  },
  groupHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  groupName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1F2937',
    flex: 1,
  },
  groupActivity: {
    fontSize: 12,
    color: '#9CA3AF',
  },
  groupDescription: {
    fontSize: 14,
    color: '#6B7280',
    marginBottom: 4,
  },
  groupMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  groupMembers: {
    fontSize: 12,
    color: '#9CA3AF',
  },
  groupActions: {
    alignItems: 'flex-end',
  },
  groupCallButton: {
    backgroundColor: '#FEF3E2',
    borderRadius: 12,
    padding: 8,
  },
  findContactsButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    margin: width * 0.05,
    marginBottom: 0,
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  findContactsText: {
    marginLeft: 12,
    fontSize: 16,
    color: '#FF8A00',
    fontWeight: '500',
  },
  gamesContainer: {
    padding: width * 0.05,
  },
  gameCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 20,
    marginBottom: 16,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  gameIcon: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: '#FF8A00',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 12,
  },
  gameTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1F2937',
    marginBottom: 4,
  },
  gameDescription: {
    fontSize: 14,
    color: '#6B7280',
    textAlign: 'center',
    marginBottom: 12,
  },
  gameStats: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    width: '100%',
  },
  gameStat: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  gameStatText: {
    marginLeft: 4,
    fontSize: 12,
    color: '#6B7280',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  modalBackground: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
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
    paddingVertical: 16,
  },
  createOptionText: {
    marginLeft: 16,
    flex: 1,
  },
  createOptionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1F2937',
    marginBottom: 2,
  },
  createOptionDesc: {
    fontSize: 14,
    color: '#6B7280',
  },
});

export default ChatListScreen;