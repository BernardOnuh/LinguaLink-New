// src/screens/EnhancedHomeScreen.tsx
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
  Alert,
  FlatList,
  TextInput,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';

const { width, height } = Dimensions.get('window');

interface User {
  id: string;
  name: string;
  username: string;
  avatar: string;
  language: string;
  isFollowing: boolean;
  followers: number;
  isVerified: boolean;
}

interface Post {
  id: string;
  type: 'voice' | 'video' | 'story';
  user: User;
  content: {
    phrase?: string;
    translation?: string;
    audioWaveform?: number[];
    videoThumbnail?: string;
    storyTitle?: string;
    duration?: string;
    availableTranslations?: {
      languages: string[];
      type: 'audio' | 'video';
    };
  };
  engagement: {
    likes: number;
    comments: number;
    shares: number;
    validations: number;
    reposts: number;
  };
  actions: {
    isLiked: boolean;
    isValidated: boolean;
    isReposted: boolean;
    needsValidation: boolean;
  };
  timeAgo: string;
  isAIGenerated?: boolean;
}

const mockUser: User = {
  id: 'current_user',
  name: 'You',
  username: 'your_username',
  avatar: '👤',
  language: 'English',
  isFollowing: false,
  followers: 0,
  isVerified: false,
};

const mockPosts: Post[] = [
  {
    id: 'post_1',
    type: 'voice',
    user: {
      id: 'user_1',
      name: 'Adunni Lagos',
      username: 'adur',
      avatar: '🌱',
      language: 'Yoruba',
      isFollowing: true,
      followers: 1234,
      isVerified: true,
    },
    content: {
      phrase: 'E kààrọ́',
      translation: 'Good Morning in Yoruba',
      audioWaveform: [20, 40, 60, 80, 60, 40, 70, 90, 50, 30, 60, 80, 40, 20, 50, 70],
      availableTranslations: {
        languages: ['English', 'Hausa', 'Igbo'],
        type: 'audio'
      }
    },
    engagement: {
      likes: 342,
      comments: 28,
      shares: 156,
      validations: 23,
      reposts: 45,
    },
    actions: {
      isLiked: false,
      isValidated: false,
      isReposted: false,
      needsValidation: false,
    },
    timeAgo: '2h',
  },
  {
    id: 'post_2',
    type: 'video',
    user: {
      id: 'user_2',
      name: 'Chidi Okafor',
      username: 'chidi_igbo',
      avatar: '👨🏾',
      language: 'Igbo',
      isFollowing: false,
      followers: 892,
      isVerified: false,
    },
    content: {
      phrase: 'Ndewo nu',
      translation: 'Hello everyone',
      videoThumbnail: '🎥',
      duration: '0:15',
      availableTranslations: {
        languages: ['English', 'Yoruba', 'Hausa'],
        type: 'video'
      }
    },
    engagement: {
      likes: 189,
      comments: 15,
      shares: 67,
      validations: 8,
      reposts: 23,
    },
    actions: {
      isLiked: true,
      isValidated: false,
      isReposted: false,
      needsValidation: true,
    },
    timeAgo: '4h',
  },
  {
    id: 'post_3',
    type: 'story',
    user: {
      id: 'user_3',
      name: 'Aisha Mohammed',
      username: 'aisha_storyteller',
      avatar: '👩🏾',
      language: 'Hausa',
      isFollowing: true,
      followers: 2156,
      isVerified: true,
    },
    content: {
      storyTitle: 'The Wise Baobab Tree',
      videoThumbnail: '📚',
      duration: '3:45',
    },
    engagement: {
      likes: 456,
      comments: 67,
      shares: 89,
      validations: 0,
      reposts: 78,
    },
    actions: {
      isLiked: false,
      isValidated: false,
      isReposted: false,
      needsValidation: false,
    },
    timeAgo: '1d',
    isAIGenerated: true,
  },
];

const EnhancedHomeScreen: React.FC<any> = ({ navigation }) => {
  const [activeTab, setActiveTab] = useState<'Following' | 'Discover' | 'Trending' | 'Live'>('Following');
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showShareModal, setShowShareModal] = useState<string | null>(null);
  const [showMoreOptions, setShowMoreOptions] = useState<string | null>(null);
  const [showTranslationModal, setShowTranslationModal] = useState<string | null>(null);
  const [posts, setPosts] = useState(mockPosts);

  const handleLike = (postId: string) => {
    setPosts(posts.map(post => 
      post.id === postId 
        ? {
            ...post,
            actions: { ...post.actions, isLiked: !post.actions.isLiked },
            engagement: {
              ...post.engagement,
              likes: post.actions.isLiked 
                ? post.engagement.likes - 1 
                : post.engagement.likes + 1
            }
          }
        : post
    ));
  };

  const handleValidate = (postId: string, isCorrect: boolean) => {
    setPosts(posts.map(post => 
      post.id === postId 
        ? {
            ...post,
            actions: { ...post.actions, isValidated: true },
            engagement: {
              ...post.engagement,
              validations: post.engagement.validations + 1
            }
          }
        : post
    ));
    
    Alert.alert(
      'Validation Submitted',
      `Thank you for validating this pronunciation as ${isCorrect ? 'correct' : 'needs improvement'}.`
    );
    setShowMoreOptions(null);
  };

  const handleRepost = (postId: string) => {
    setPosts(posts.map(post => 
      post.id === postId 
        ? {
            ...post,
            actions: { ...post.actions, isReposted: !post.actions.isReposted },
            engagement: {
              ...post.engagement,
              reposts: post.actions.isReposted 
                ? post.engagement.reposts - 1 
                : post.engagement.reposts + 1
            }
          }
        : post
    ));
    
    Alert.alert('Reposted!', 'Post shared to your profile');
  };

  const handleFollow = (userId: string) => {
    setPosts(posts.map(post => 
      post.user.id === userId 
        ? {
            ...post,
            user: {
              ...post.user,
              isFollowing: !post.user.isFollowing,
              followers: post.user.isFollowing 
                ? post.user.followers - 1 
                : post.user.followers + 1
            }
          }
        : post
    ));
  };

  const handleTranslate = (postId: string, language: string) => {
    const post = posts.find(p => p.id === postId);
    Alert.alert(
      'Translation Requested',
      `This ${post?.type} will be translated to ${language}`
    );
    
    // Simulate translation loading
    setTimeout(() => {
      Alert.alert(
        'Translation Ready',
        `The ${post?.type} is now available in ${language}. Would you like to watch/listen now?`,
        [
          {
            text: 'Cancel',
            style: 'cancel'
          },
          {
            text: 'Open',
            onPress: () => {
              if (post?.type === 'video') {
                navigation.navigate('RecordVideo', { 
                  mode: 'play',
                  translatedLanguage: language 
                });
              } else {
                navigation.navigate('RecordVoice', { 
                  mode: 'play',
                  translatedLanguage: language 
                });
              }
            }
          }
        ]
      );
    }, 2000);
  };

  const CreatePostModal = () => (
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
          <Text style={styles.createModalTitle}>Create New Post</Text>
          
          <TouchableOpacity 
            style={styles.createOption}
            onPress={() => {
              setShowCreateModal(false);
              navigation.navigate('RecordVoice', { mode: 'record' });
            }}
          >
            <View style={styles.createOptionIcon}>
              <Ionicons name="mic" size={24} color="#FF8A00" />
            </View>
            <View style={styles.createOptionContent}>
              <Text style={styles.createOptionTitle}>Record Audio</Text>
              <Text style={styles.createOptionDescription}>Record audio in your local language</Text>
            </View>
          </TouchableOpacity>

          <TouchableOpacity 
            style={styles.createOption}
            onPress={() => {
              setShowCreateModal(false);
              navigation.navigate('RecordVoice', { mode: 'upload' });
            }}
          >
            <View style={styles.createOptionIcon}>
              <Ionicons name="cloud-upload" size={24} color="#FF8A00" />
            </View>
            <View style={styles.createOptionContent}>
              <Text style={styles.createOptionTitle}>Upload Audio</Text>
              <Text style={styles.createOptionDescription}>Upload audio from your device</Text>
            </View>
          </TouchableOpacity>

          <TouchableOpacity 
            style={styles.createOption}
            onPress={() => {
              setShowCreateModal(false);
              navigation.navigate('RecordVideo', { mode: 'record' });
            }}
          >
            <View style={[styles.createOptionIcon, styles.purpleIcon]}>
              <Ionicons name="videocam" size={24} color="#8B5CF6" />
            </View>
            <View style={styles.createOptionContent}>
              <Text style={styles.createOptionTitle}>Record Video</Text>
              <Text style={styles.createOptionDescription}>Record video content</Text>
            </View>
          </TouchableOpacity>

          <TouchableOpacity 
            style={styles.createOption}
            onPress={() => {
              setShowCreateModal(false);
              navigation.navigate('RecordVideo', { mode: 'upload' });
            }}
          >
            <View style={[styles.createOptionIcon, styles.purpleIcon]}>
              <Ionicons name="cloud-upload" size={24} color="#8B5CF6" />
            </View>
            <View style={styles.createOptionContent}>
              <Text style={styles.createOptionTitle}>Upload Video</Text>
              <Text style={styles.createOptionDescription}>Upload video from your device</Text>
            </View>
          </TouchableOpacity>

          <TouchableOpacity 
            style={styles.createOption}
            onPress={() => {
              setShowCreateModal(false);
              navigation.navigate('LiveStream', { isHost: true });
            }}
          >
            <View style={[styles.createOptionIcon, styles.redIcon]}>
              <Ionicons name="radio" size={24} color="#EF4444" />
            </View>
            <View style={styles.createOptionContent}>
              <Text style={styles.createOptionTitle}>Go Live</Text>
              <Text style={styles.createOptionDescription}>Start live streaming</Text>
            </View>
          </TouchableOpacity>

          <TouchableOpacity 
            style={styles.createOption}
            onPress={() => {
              setShowCreateModal(false);
              navigation.navigate('TurnVerse');
            }}
          >
            <View style={[styles.createOptionIcon, styles.greenIcon]}>
              <Ionicons name="game-controller" size={24} color="#10B981" />
            </View>
            <View style={styles.createOptionContent}>
              <Text style={styles.createOptionTitle}>Play TurnVerse</Text>
              <Text style={styles.createOptionDescription}>Join language learning games</Text>
            </View>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );

  const ShareModal = ({ postId }: { postId: string }) => (
    <Modal
      visible={showShareModal === postId}
      transparent
      animationType="fade"
      onRequestClose={() => setShowShareModal(null)}
    >
      <View style={styles.modalOverlay}>
        <TouchableOpacity 
          style={styles.modalBackground}
          onPress={() => setShowShareModal(null)}
        />
        <View style={styles.shareModalContent}>
          <Text style={styles.shareModalTitle}>Share Post</Text>
          
          <TouchableOpacity 
            style={styles.shareOption}
            onPress={() => {
              setShowShareModal(null);
              Alert.alert('Shared!', 'Post shared to your story');
            }}
          >
            <Ionicons name="add-circle" size={24} color="#10B981" />
            <Text style={styles.shareOptionText}>Add to Story</Text>
          </TouchableOpacity>

          <TouchableOpacity 
            style={styles.shareOption}
            onPress={() => {
              setShowShareModal(null);
              navigation.navigate('ChatList');
            }}
          >
            <Ionicons name="paper-plane" size={24} color="#3B82F6" />
            <Text style={styles.shareOptionText}>Send in DM</Text>
          </TouchableOpacity>

          <TouchableOpacity 
            style={styles.shareOption}
            onPress={() => {
              setShowShareModal(null);
              Alert.alert('Shared!', 'Post shared to selected groups');
            }}
          >
            <Ionicons name="people" size={24} color="#8B5CF6" />
            <Text style={styles.shareOptionText}>Share to Group</Text>
          </TouchableOpacity>

          <TouchableOpacity 
            style={styles.shareOption}
            onPress={() => {
              setShowShareModal(null);
              Alert.alert('Copied!', 'Link copied to clipboard');
            }}
          >
            <Ionicons name="link" size={24} color="#6B7280" />
            <Text style={styles.shareOptionText}>Copy Link</Text>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );

  const MoreOptionsModal = ({ post }: { post: Post }) => (
    <Modal
      visible={showMoreOptions === post.id}
      transparent
      animationType="fade"
      onRequestClose={() => setShowMoreOptions(null)}
    >
      <View style={styles.modalOverlay}>
        <TouchableOpacity 
          style={styles.modalBackground}
          onPress={() => setShowMoreOptions(null)}
        />
        <View style={styles.moreOptionsContent}>
          <TouchableOpacity 
            style={styles.optionItem}
            onPress={() => {
              handleFollow(post.user.id);
              setShowMoreOptions(null);
            }}
          >
            <Ionicons 
              name={post.user.isFollowing ? "person-remove" : "person-add"} 
              size={20} 
              color={post.user.isFollowing ? "#EF4444" : "#10B981"} 
            />
            <Text style={styles.optionText}>
              {post.user.isFollowing ? `Unfollow ${post.user.name}` : `Follow ${post.user.name}`}
            </Text>
          </TouchableOpacity>

          {post.type === 'voice' && (
            <>
              <TouchableOpacity 
                style={styles.optionItem}
                onPress={() => {
                  setShowMoreOptions(null);
                  navigation.navigate('RecordVoice', {
                    isDuet: true,
                    originalClip: {
                      id: post.id,
                      phrase: post.content.phrase,
                      user: post.user.name,
                      language: post.user.language
                    }
                  });
                }}
              >
                <Ionicons name="people" size={20} color="#10B981" />
                <Text style={styles.optionText}>Create Duet</Text>
              </TouchableOpacity>

              <TouchableOpacity 
                style={styles.optionItem}
                onPress={() => {
                  setShowMoreOptions(null);
                  navigation.navigate('RecordVoice', {
                    isRemix: true,
                    originalClip: {
                      id: post.id,
                      phrase: post.content.phrase,
                      user: post.user.name,
                      language: post.user.language
                    }
                  });
                }}
              >
                <Ionicons name="repeat" size={20} color="#8B5CF6" />
                <Text style={styles.optionText}>Remix</Text>
              </TouchableOpacity>

              <TouchableOpacity 
                style={styles.optionItem}
                onPress={() => {
                  setShowMoreOptions(null);
                  navigation.navigate('Validation', {
                    clipId: post.id,
                    language: post.user.language
                  });
                }}
              >
                <Ionicons name="checkmark-circle" size={20} color="#F59E0B" />
                <Text style={styles.optionText}>Validate Pronunciation</Text>
              </TouchableOpacity>
            </>
          )}

          {post.actions.needsValidation && (
            <>
              <View style={styles.optionDivider} />
              <Text style={styles.validationHeader}>Quick Validation</Text>
              <TouchableOpacity 
                style={[styles.optionItem, styles.validationOption]}
                onPress={() => handleValidate(post.id, true)}
              >
                <Ionicons name="checkmark-circle" size={20} color="#10B981" />
                <Text style={styles.optionText}>Mark as Correct</Text>
              </TouchableOpacity>

              <TouchableOpacity 
                style={[styles.optionItem, styles.validationOption]}
                onPress={() => handleValidate(post.id, false)}
              >
                <Ionicons name="close-circle" size={20} color="#EF4444" />
                <Text style={styles.optionText}>Needs Improvement</Text>
              </TouchableOpacity>
            </>
          )}

          <View style={styles.optionDivider} />
          <TouchableOpacity 
            style={styles.optionItem}
            onPress={() => {
              setShowMoreOptions(null);
              Alert.alert('Report', 'Report functionality would be implemented here.');
            }}
          >
            <Ionicons name="flag" size={20} color="#EF4444" />
            <Text style={styles.optionText}>Report</Text>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );

  const TranslationOptionsModal = ({ post, onClose }: { post: Post, onClose: () => void }) => {
    const [selectedLanguage, setSelectedLanguage] = useState<string | null>(null);

    return (
      <Modal
        visible={true}
        transparent
        animationType="fade"
        onRequestClose={onClose}
      >
        <View style={styles.modalOverlay}>
          <TouchableOpacity 
            style={styles.modalBackground}
            onPress={onClose}
          />
          <View style={styles.translationModalContent}>
            <Text style={styles.translationModalTitle}>
              {post.content.availableTranslations?.type === 'video' 
                ? 'Watch in Your Language' 
                : 'Listen in Your Language'}
            </Text>
            
            <Text style={styles.translationDescription}>
              This {post.type} is available in these languages:
            </Text>
            
            {post.content.availableTranslations?.languages.map(language => (
              <TouchableOpacity 
                key={language}
                style={[
                  styles.translationOption,
                  selectedLanguage === language && styles.selectedTranslationOption
                ]}
                onPress={() => setSelectedLanguage(language)}
              >
                <Ionicons 
                  name={selectedLanguage === language ? "radio-button-on" : "radio-button-off"} 
                  size={20} 
                  color={selectedLanguage === language ? "#FF8A00" : "#6B7280"} 
                />
                <Text style={styles.translationOptionText}>{language}</Text>
              </TouchableOpacity>
            ))}
            
            <TouchableOpacity 
              style={[
                styles.translateButton,
                !selectedLanguage && styles.disabledButton
              ]}
              disabled={!selectedLanguage}
              onPress={() => {
                if (selectedLanguage) {
                  handleTranslate(post.id, selectedLanguage);
                  onClose();
                }
              }}
            >
              <Text style={styles.translateButtonText}>
                {post.content.availableTranslations?.type === 'video' 
                  ? `Watch in ${selectedLanguage}` 
                  : `Listen in ${selectedLanguage}`}
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    );
  };

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

  const renderPost = (post: Post) => (
    <View key={post.id} style={styles.postCard}>
      {/* Post Header */}
      <View style={styles.postHeader}>
        <TouchableOpacity style={styles.userInfo}>
          <View style={styles.avatar}>
            <Text style={styles.avatarText}>{post.user.avatar}</Text>
          </View>
          <View style={styles.userDetails}>
            <View style={styles.userNameRow}>
              <Text style={styles.userName}>{post.user.name}</Text>
              {post.user.isVerified && (
                <Ionicons name="checkmark-circle" size={16} color="#10B981" />
              )}
              {!post.user.isFollowing ? (
                <TouchableOpacity 
                  style={styles.followButton}
                  onPress={() => handleFollow(post.user.id)}
                >
                  <Text style={styles.followButtonText}>Follow</Text>
                </TouchableOpacity>
              ) : (
                <TouchableOpacity 
                  style={[styles.followButton, styles.followingButton]}
                  onPress={() => handleFollow(post.user.id)}
                >
                  <Text style={[styles.followButtonText, styles.followingButtonText]}>Following</Text>
                </TouchableOpacity>
              )}
            </View>
            <View style={styles.postMeta}>
              <View style={styles.languageTag}>
                <Text style={styles.languageText}>{post.user.language}</Text>
              </View>
              <Text style={styles.timeAgo}>• {post.timeAgo}</Text>
              {post.isAIGenerated && (
                <View style={styles.aiTag}>
                  <Ionicons name="sparkles" size={12} color="#8B5CF6" />
                  <Text style={styles.aiTagText}>AI</Text>
                </View>
              )}
            </View>
          </View>
        </TouchableOpacity>
        <TouchableOpacity 
          onPress={() => setShowMoreOptions(post.id)}
        >
          <Ionicons name="ellipsis-horizontal" size={20} color="#6B7280" />
        </TouchableOpacity>
      </View>

      {/* Post Content */}
      <View style={styles.postContent}>
        {post.type === 'voice' && (
          <>
            <View style={styles.phraseContainer}>
              <Text style={styles.phrase}>{post.content.phrase}</Text>
              <Text style={styles.translation}>{post.content.translation}</Text>
            </View>
            {post.content.audioWaveform && renderWaveform(post.content.audioWaveform)}
            <TouchableOpacity style={styles.playButton}>
              <Ionicons name="play" size={24} color="#FFFFFF" />
            </TouchableOpacity>
          </>
        )}

        {post.type === 'video' && (
          <View style={styles.videoContainer}>
            <View style={styles.videoThumbnail}>
              <Text style={styles.videoThumbnailText}>{post.content.videoThumbnail}</Text>
              <TouchableOpacity style={styles.videoPlayButton}>
                <Ionicons name="play" size={32} color="#FFFFFF" />
              </TouchableOpacity>
              <View style={styles.videoDuration}>
                <Text style={styles.videoDurationText}>{post.content.duration}</Text>
              </View>
            </View>
            <View style={styles.videoInfo}>
              <Text style={styles.videoPhrase}>{post.content.phrase}</Text>
              <Text style={styles.videoTranslation}>{post.content.translation}</Text>
            </View>
          </View>
        )}

        {post.type === 'story' && (
          <View style={styles.storyContainer}>
            <View style={styles.storyThumbnail}>
              <Text style={styles.storyThumbnailText}>{post.content.videoThumbnail}</Text>
              <TouchableOpacity style={styles.storyPlayButton}>
                <Ionicons name="play" size={32} color="#FFFFFF" />
              </TouchableOpacity>
              <View style={styles.storyDuration}>
                <Text style={styles.storyDurationText}>{post.content.duration}</Text>
              </View>
            </View>
            <Text style={styles.storyTitle}>{post.content.storyTitle}</Text>
          </View>
        )}
      </View>

      {/* Post Actions */}
      <View style={styles.postActions}>
        <TouchableOpacity 
          style={styles.actionButton}
          onPress={() => handleLike(post.id)}
        >
          <Ionicons 
            name={post.actions.isLiked ? "heart" : "heart-outline"} 
            size={20} 
            color={post.actions.isLiked ? "#EF4444" : "#6B7280"} 
          />
          <Text style={[styles.actionText, post.actions.isLiked && styles.likedText]}>
            {post.engagement.likes}
          </Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.actionButton}>
          <Ionicons name="chatbubble-outline" size={20} color="#6B7280" />
          <Text style={styles.actionText}>{post.engagement.comments}</Text>
        </TouchableOpacity>

        <TouchableOpacity 
          style={styles.actionButton}
          onPress={() => handleRepost(post.id)}
        >
          <Ionicons 
            name={post.actions.isReposted ? "repeat" : "repeat-outline"} 
            size={20} 
            color={post.actions.isReposted ? "#10B981" : "#6B7280"} 
          />
          <Text style={[styles.actionText, post.actions.isReposted && styles.repostedText]}>
            {post.engagement.reposts}
          </Text>
        </TouchableOpacity>

        {post.type === 'voice' && (
          <TouchableOpacity style={styles.actionButton}>
            <Ionicons 
              name={post.actions.isValidated ? "checkmark-circle" : "checkmark-circle-outline"} 
              size={20} 
              color={post.actions.needsValidation ? "#F59E0B" : "#10B981"} 
            />
            <Text style={styles.actionText}>{post.engagement.validations}</Text>
          </TouchableOpacity>
        )}

        {post.content.availableTranslations && (
          <TouchableOpacity 
            style={styles.actionButton}
            onPress={() => setShowTranslationModal(post.id)}
          >
            <Ionicons 
              name={post.content.availableTranslations.type === 'video' ? "language" : "language-outline"} 
              size={20} 
              color="#3B82F6" 
            />
            <Text style={[styles.actionText, { color: '#3B82F6' }]}>
              Translate
            </Text>
          </TouchableOpacity>
        )}

        <TouchableOpacity 
          style={styles.actionButton}
          onPress={() => setShowShareModal(post.id)}
        >
          <Ionicons name="share-outline" size={20} color="#6B7280" />
        </TouchableOpacity>
      </View>

      <MoreOptionsModal post={post} />
      <ShareModal postId={post.id} />
      {showTranslationModal === post.id && (
        <TranslationOptionsModal 
          post={post} 
          onClose={() => setShowTranslationModal(null)} 
        />
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
            <TouchableOpacity>
              <Ionicons name="search" size={24} color="#FFFFFF" />
            </TouchableOpacity>
            <TouchableOpacity style={styles.headerButton}>
              <Ionicons name="notifications" size={24} color="#FFFFFF" />
            </TouchableOpacity>
          </View>
        </View>
      </View>

      {/* Tab Navigation */}
      <View style={styles.tabContainer}>
        {['Following', 'Discover', 'Trending', 'Live'].map((tab) => (
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
            {tab === 'Live' && (
              <View style={styles.liveIndicator}>
                <View style={styles.liveDot} />
              </View>
            )}
          </TouchableOpacity>
        ))}
      </View>

      {/* Content */}
      <ScrollView 
        style={styles.content}
        showsVerticalScrollIndicator={false}
      >
        {activeTab === 'Live' ? (
          <View style={styles.liveSection}>
            <Text style={styles.liveSectionTitle}>Live Now</Text>
            <TouchableOpacity 
              style={styles.liveCard}
              onPress={() => navigation.navigate('TurnVerse')}
            >
              <View style={styles.liveCardContent}>
                <Text style={styles.liveCardEmoji}>🎮</Text>
                <View style={styles.liveCardInfo}>
                  <Text style={styles.liveCardTitle}>TurnVerse Games</Text>
                  <Text style={styles.liveCardDesc}>12 rooms active • 234 playing</Text>
                </View>
                <View style={styles.liveCardBadge}>
                  <View style={styles.liveDot} />
                  <Text style={styles.liveCardBadgeText}>LIVE</Text>
                </View>
              </View>
            </TouchableOpacity>
          </View>
        ) : (
          posts.map(renderPost)
        )}
      </ScrollView>

      {/* Floating Create Button */}
      <TouchableOpacity 
        style={styles.createButton}
        onPress={() => setShowCreateModal(true)}
      >
        <Ionicons name="add" size={24} color="#FFFFFF" />
      </TouchableOpacity>

      <CreatePostModal />
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
  tabContainer: {
    flexDirection: 'row',
    backgroundColor: '#FFFFFF',
    paddingHorizontal: width * 0.05,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E5E5',
    justifyContent: 'space-around',
  },
  tab: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    flexDirection: 'row',
    alignItems: 'center',
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
  liveIndicator: {
    marginLeft: 4,
  },
  liveDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#EF4444',
  },
  content: {
    flex: 1,
    paddingHorizontal: width * 0.05,
    paddingTop: 16,
  },
  liveSection: {
    marginBottom: 20,
  },
  liveSectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1F2937',
    marginBottom: 12,
  },
  liveCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  liveCardContent: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  liveCardEmoji: {
    fontSize: 40,
    marginRight: 16,
  },
  liveCardInfo: {
    flex: 1,
  },
  liveCardTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1F2937',
    marginBottom: 4,
  },
  liveCardDesc: {
    fontSize: 14,
    color: '#6B7280',
  },
  liveCardBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#EF4444',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  liveCardBadgeText: {
    fontSize: 10,
    fontWeight: '600',
    color: '#FFFFFF',
    marginLeft: 4,
  },
  postCard: {
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
  postHeader: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  userInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
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
  userNameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
  },
  userName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1F2937',
    marginRight: 4,
  },
  followButton: {
    backgroundColor: '#FF8A00',
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 12,
    marginLeft: 8,
  },
  followButtonText: {
    fontSize: 12,
    color: '#FFFFFF',
    fontWeight: '500',
  },
  followingButton: {
    backgroundColor: '#E5E7EB',
    borderWidth: 1,
    borderColor: '#D1D5DB',
  },
  followingButtonText: {
    color: '#6B7280',
  },
  postMeta: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  languageTag: {
    backgroundColor: '#FEF3E2',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 8,
    marginRight: 8,
  },
  languageText: {
    fontSize: 10,
    color: '#D97706',
    fontWeight: '500',
  },
  timeAgo: {
    fontSize: 12,
    color: '#9CA3AF',
    marginRight: 8,
  },
  aiTag: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F3E8FF',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 8,
  },
  aiTagText: {
    fontSize: 10,
    color: '#8B5CF6',
    fontWeight: '500',
    marginLeft: 2,
  },
  postContent: {
    marginBottom: 16,
  },
  phraseContainer: {
    marginBottom: 16,
    alignItems: 'center',
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
  },
  videoContainer: {
    alignItems: 'center',
  },
  videoThumbnail: {
    width: '100%',
    height: 200,
    backgroundColor: '#E5E7EB',
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    position: 'relative',
    marginBottom: 12,
  },
  videoThumbnailText: {
    fontSize: 60,
  },
  videoPlayButton: {
    position: 'absolute',
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: 'rgba(255, 255, 255, 0.9)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  videoDuration: {
    position: 'absolute',
    bottom: 8,
    right: 8,
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  videoDurationText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '500',
  },
  videoInfo: {
    alignItems: 'center',
  },
  videoPhrase: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1F2937',
    marginBottom: 4,
  },
  videoTranslation: {
    fontSize: 14,
    color: '#6B7280',
  },
  storyContainer: {
    alignItems: 'center',
  },
  storyThumbnail: {
    width: '100%',
    height: 200,
    backgroundColor: '#E5E7EB',
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    position: 'relative',
    marginBottom: 12,
  },
  storyThumbnailText: {
    fontSize: 60,
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
  storyDuration: {
    position: 'absolute',
    bottom: 8,
    right: 8,
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  storyDurationText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '500',
  },
  storyTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1F2937',
    textAlign: 'center',
  },
  postActions: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: '#F3F4F6',
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 4,
  },
  actionText: {
    marginLeft: 4,
    fontSize: 14,
    color: '#6B7280',
    fontWeight: '500',
  },
  likedText: {
    color: '#EF4444',
  },
  repostedText: {
    color: '#10B981',
  },
  createButton: {
    position: 'absolute',
    bottom: 20,
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
  greenIcon: {
    backgroundColor: '#ECFDF5',
  },
  redIcon: {
    backgroundColor: '#FEE2E2',
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
  shareModalContent: {
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    padding: 24,
    paddingBottom: 40,
  },
  shareModalTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1F2937',
    marginBottom: 20,
    textAlign: 'center',
  },
  shareOption: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 16,
    paddingHorizontal: 4,
  },
  shareOptionText: {
    fontSize: 16,
    color: '#1F2937',
    marginLeft: 16,
    fontWeight: '500',
  },
  moreOptionsContent: {
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    padding: 20,
    paddingBottom: 40,
  },
  optionItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 16,
    paddingHorizontal: 4,
  },
  optionText: {
    fontSize: 16,
    fontWeight: '500',
    color: '#1F2937',
    marginLeft: 12,
  },
  optionDivider: {
    height: 1,
    backgroundColor: '#E5E5E5',
    marginVertical: 8,
  },
  validationHeader: {
    fontSize: 14,
    fontWeight: '600',
    color: '#6B7280',
    marginTop: 8,
    marginBottom: 4,
    paddingHorizontal: 4,
  },
  validationOption: {
    backgroundColor: '#F9FAFB',
    borderRadius: 8,
    marginVertical: 2,
  },
  // Translation Modal Styles
  translationModalContent: {
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    padding: 24,
    paddingBottom: 40,
    maxHeight: height * 0.7,
  },
  translationModalTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: '#1F2937',
    marginBottom: 12,
    textAlign: 'center',
  },
  translationDescription: {
    fontSize: 16,
    color: '#6B7280',
    marginBottom: 20,
    textAlign: 'center',
  },
  translationOption: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 16,
    paddingHorizontal: 16,
    backgroundColor: '#F8F9FA',
    borderRadius: 12,
    marginBottom: 8,
  },
  selectedTranslationOption: {
    backgroundColor: '#FEF3E2',
    borderWidth: 2,
    borderColor: '#FF8A00',
  },
  translationOptionText: {
    fontSize: 16,
    fontWeight: '500',
    color: '#1F2937',
    marginLeft: 12,
  },
  translateButton: {
    backgroundColor: '#FF8A00',
    paddingVertical: 16,
    paddingHorizontal: 24,
    borderRadius: 16,
    marginTop: 16,
    alignItems: 'center',
  },
  disabledButton: {
    backgroundColor: '#E5E7EB',
    opacity: 0.5,
  },
  translateButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FFFFFF',
  },
});

export default EnhancedHomeScreen;