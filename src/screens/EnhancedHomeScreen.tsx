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
  Image,
  ActivityIndicator,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Audio } from 'expo-av';
import { supabase } from '../supabaseClient';
import { useAuth } from '../context/AuthProvider';
import { getPlayableAudioUrl } from '../utils/storage';

const { width, height } = Dimensions.get('window');

// Helper function to format time ago
const getTimeAgo = (dateString: string): string => {
  const now = new Date();
  const date = new Date(dateString);
  const diffInSeconds = Math.floor((now.getTime() - date.getTime()) / 1000);

  if (diffInSeconds < 60) return 'just now';
  if (diffInSeconds < 3600) return `${Math.floor(diffInSeconds / 60)}m ago`;
  if (diffInSeconds < 86400) return `${Math.floor(diffInSeconds / 3600)}h ago`;
  if (diffInSeconds < 2592000) return `${Math.floor(diffInSeconds / 86400)}d ago`;
  return `${Math.floor(diffInSeconds / 2592000)}mo ago`;
};

interface User {
  id: string;
  name: string;
  username: string;
  avatar: string;
  avatarUrl?: string; // For real avatar URLs from Supabase
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
    audioUrl?: string;
    videoThumbnail?: string;
    storyTitle?: string;
    duration?: string;
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



const EnhancedHomeScreen: React.FC<any> = ({ navigation }) => {
  const [activeTab, setActiveTab] = useState<'Following' | 'Discover' | 'Trending' | 'Live'>('Following');
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showShareModal, setShowShareModal] = useState<string | null>(null);
  const [showMoreOptions, setShowMoreOptions] = useState<string | null>(null);
  const [posts, setPosts] = useState<Post[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [currentPlayingId, setCurrentPlayingId] = useState<string | null>(null);
  const [sound, setSound] = useState<Audio.Sound | null>(null);
  const [loadingAudioId, setLoadingAudioId] = useState<string | null>(null);
  const { user } = useAuth();

       // Fetch real voice clips and users from database
  useEffect(() => {
    const fetchRealContent = async () => {
      setIsLoading(true);
      try {
        // Fetch voice clips with user information
        const { data: voiceClips, error: clipsError } = await supabase
          .from('voice_clips')
          .select(`
            *,
            profiles!voice_clips_user_id_fkey (
              id,
              full_name,
              username,
              primary_language,
              avatar_url,
              bio
            )
          `)
          .order('created_at', { ascending: false })
          .limit(20);

        if (clipsError) {
          console.error('Error fetching voice clips:', clipsError);
          return;
        }

        if (voiceClips && voiceClips.length > 0) {
          // Transform voice clips to posts
          const transformedPosts: Post[] = voiceClips.map((clip, index) => {
            const user = clip.profiles;
            return {
              id: clip.id,
              type: 'voice' as const,
              user: {
                id: user?.id || 'unknown',
                name: user?.full_name || 'Anonymous',
                username: user?.username || 'user',
                avatar: '👤',
                avatarUrl: user?.avatar_url || undefined,
                language: user?.primary_language || 'English',
                isFollowing: false, // Will be updated below
                followers: Math.floor(Math.random() * 1000) + 10, // Random for demo
                isVerified: Math.random() > 0.7, // Random for demo
              },
              content: {
                phrase: clip.phrase || 'Audio clip',
                translation: clip.translation || '',
                audioWaveform: [20, 40, 60, 80, 60, 40, 70, 90, 50, 30, 60, 80, 40, 20, 50, 70], // Placeholder waveform
                audioUrl: clip.audio_url,
                duration: clip.duration ? `${Math.floor(clip.duration / 60)}:${(clip.duration % 60).toString().padStart(2, '0')}` : '0:00',
              },
              engagement: {
                likes: clip.likes_count || 0,
                comments: clip.comments_count || 0,
                shares: clip.shares_count || 0,
                validations: clip.validations_count || 0,
                reposts: 0,
              },
              actions: {
                isLiked: false, // Will be updated based on user's likes
                isValidated: clip.is_validated || false,
                isReposted: false, // Will be updated based on user's reposts
                needsValidation: !clip.is_validated,
              },
              timeAgo: getTimeAgo(clip.created_at),
            };
          });

          setPosts(transformedPosts);
          console.log('Real voice clips fetched:', transformedPosts.length);
        } else {
          console.log('No voice clips found in database');
          setPosts([]);
        }
      } catch (error) {
        console.error('Error in fetchRealContent:', error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchRealContent();
  }, []);

  // Cleanup audio when component unmounts
  useEffect(() => {
    return () => {
      if (sound) {
        sound.unloadAsync();
      }
    };
  }, [sound]);

  // Check follow status for current user
  useEffect(() => {
    const checkFollowStatus = async () => {
      if (!user || posts.length === 0) return;

      try {
        const { data: followData, error } = await supabase
          .from('followers')
          .select('following_id')
          .eq('follower_id', user.id);

        if (error) {
          console.error('Error checking follow status:', error);
          return;
        }

        const followingIds = new Set(followData?.map(f => f.following_id) || []);

        // Update posts with correct follow status only if values change
        setPosts(prevPosts => {
          let changed = false;
          const updated = prevPosts.map(post => {
            const nextIsFollowing = followingIds.has(post.user.id);
            if (post.user.isFollowing !== nextIsFollowing) {
              changed = true;
              return {
                ...post,
                user: {
                  ...post.user,
                  isFollowing: nextIsFollowing,
                },
              } as typeof post;
            }
            return post;
          });
          return changed ? updated : prevPosts;
        });
      } catch (error) {
        console.error('Error in checkFollowStatus:', error);
      }
    };

    checkFollowStatus();
  }, [user, posts]);

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

    const handleAudioPlay = async (postId: string, audioUrl?: string, phrase?: string) => {
    if (!audioUrl) {
      Alert.alert('No Audio', 'This post does not have an audio file');
      return;
    }

    try {
      // If this post is already playing, stop it
      if (currentPlayingId === postId && sound) {
        await sound.stopAsync();
        await sound.unloadAsync();
        setSound(null);
        setCurrentPlayingId(null);
        return;
      }

      // Stop any currently playing audio
      if (sound) {
        await sound.stopAsync();
        await sound.unloadAsync();
        setSound(null);
      }

      // Set loading state
      setLoadingAudioId(postId);

      // Get playable URL
      const resolvedUrl = await getPlayableAudioUrl(audioUrl);
      if (!resolvedUrl) {
        setLoadingAudioId(null);
        Alert.alert('Error', 'Failed to load audio file');
        return;
      }

      // Create and play the audio
      const { sound: newSound } = await Audio.Sound.createAsync(
        { uri: resolvedUrl },
        { shouldPlay: true }
      );

      setSound(newSound);
      setCurrentPlayingId(postId);
      setLoadingAudioId(null);

      // Set up playback status monitoring
      newSound.setOnPlaybackStatusUpdate((status) => {
        if ('isLoaded' in status && status.isLoaded && status.didJustFinish) {
          setCurrentPlayingId(null);
        }
      });

      console.log('Playing audio:', resolvedUrl);
    } catch (error) {
      console.error('Error playing audio:', error);
      setLoadingAudioId(null);
      Alert.alert('Error', 'Failed to play audio file');
    }
  };

  const handleFollow = async (userId: string) => {
    if (!user) {
      Alert.alert('Error', 'Please sign in to follow users');
      return;
    }

    try {
      // Update local state immediately for better UX
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

      // Update database
      if (posts.find(p => p.user.id === userId)?.user.isFollowing) {
        // Unfollow
        const { error } = await supabase
          .from('followers')
          .delete()
          .eq('follower_id', user.id)
          .eq('following_id', userId);

        if (error) {
          console.error('Error unfollowing:', error);
          // Revert local state on error
          setPosts(posts.map(post =>
            post.user.id === userId
              ? {
                  ...post,
                  user: {
                    ...post.user,
                    isFollowing: true,
                    followers: post.user.followers + 1
                  }
                }
              : post
          ));
        }
      } else {
        // Follow
        const { error } = await supabase
          .from('followers')
          .insert({
            follower_id: user.id,
            following_id: userId
          });

        if (error) {
          console.error('Error following:', error);
          // Revert local state on error
          setPosts(posts.map(post =>
            post.user.id === userId
              ? {
                  ...post,
                  user: {
                    ...post.user,
                    isFollowing: false,
                    followers: post.user.followers - 1
                  }
                }
              : post
          ));
        }
      }
    } catch (error) {
      console.error('Error in handleFollow:', error);
      Alert.alert('Error', 'Failed to update follow status');
    }
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

          <ScrollView
            style={styles.createModalScroll}
            contentContainerStyle={styles.createModalScrollContent}
            showsVerticalScrollIndicator={false}
          >
          <TouchableOpacity
            style={styles.createOption}
            onPress={() => {
              setShowCreateModal(false);
              navigation.navigate('CreateStory');
            }}
          >
            <View style={[styles.createOptionIcon, styles.blueIcon]}>
              <Ionicons name="images" size={24} color="#3B82F6" />
            </View>
            <View style={styles.createOptionContent}>
              <Text style={styles.createOptionTitle}>Create Story</Text>
              <Text style={styles.createOptionDescription}>Combine clips, text and media</Text>
            </View>
          </TouchableOpacity>

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
          </ScrollView>
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
    <TouchableOpacity
      style={styles.userInfo}
      onPress={() => {
        // Check if this is the authenticated user's own post
        if (user && post.user.id === user.id) {
          // Navigate to their own profile tab
          navigation.navigate('Profile');
        } else {
          // Navigate to other user's profile
          navigation.navigate('UserProfile', { userId: post.user.id });
        }
      }}
    >
          <View style={styles.avatar}>
            {post.user.avatarUrl ? (
              <Image
                source={{ uri: post.user.avatarUrl }}
                style={styles.avatarImage}
                defaultSource={{ uri: 'https://via.placeholder.com/40x40/FF8A00/FFFFFF?text=👤' }}
                onError={() => console.log('Failed to load avatar for user:', post.user.username)}
              />
            ) : (
              <Text style={styles.avatarText}>{post.user.avatar}</Text>
            )}
          </View>
          <View style={styles.userDetails}>
            <View style={styles.userNameRow}>
              <Text style={styles.userName}>{post.user.name}</Text>
              {post.user.isVerified && (
                <Ionicons name="checkmark-circle" size={16} color="#10B981" />
              )}
              <TouchableOpacity
                style={!post.user.isFollowing ? styles.followButton : [styles.followButton, styles.followingButton]}
                onPress={(e) => {
                  e.stopPropagation(); // Prevent navigation when clicking follow button
                  handleFollow(post.user.id);
                }}
              >
                <Text style={!post.user.isFollowing ? styles.followButtonText : [styles.followButtonText, styles.followingButtonText]}>
                  {post.user.isFollowing ? 'Following' : 'Follow'}
                </Text>
              </TouchableOpacity>
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
              <Text
                style={styles.phrase}
                numberOfLines={2}
                ellipsizeMode="tail"
                adjustsFontSizeToFit
                minimumFontScale={0.85}
              >
                {post.content.phrase}
              </Text>
              <Text style={styles.translation}>{post.content.translation}</Text>
            </View>
            {post.content.audioWaveform && renderWaveform(post.content.audioWaveform)}
              <TouchableOpacity
                style={[styles.playButton, !post.content.audioUrl && styles.playButtonDisabled]}
                onPress={() => handleAudioPlay(post.id, post.content.audioUrl, post.content.phrase)}
                disabled={!post.content.audioUrl}
              >
                {loadingAudioId === post.id ? (
                  <ActivityIndicator size="small" color="#FFFFFF" />
                ) : currentPlayingId === post.id ? (
                  <Ionicons
                    name="pause"
                    size={24}
                    color="#FFFFFF"
                  />
                ) : (
                  <Ionicons
                    name="play"
                    size={24}
                    color={post.content.audioUrl ? "#FFFFFF" : "#9CA3AF"}
                  />
                )}
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
          onPress={() => {
            navigation.navigate('RecordVoice', {
              isRemix: true,
              originalClip: {
                id: post.id,
                phrase: post.content.phrase,
                user: post.user.name,
                language: post.user.language,
              },
            });
          }}
          accessibilityLabel="Remix"
        >
          <Ionicons
            name={post.actions.isReposted ? "repeat" : "repeat-outline"}
            size={20}
            color={post.actions.isReposted ? "#10B981" : "#6B7280"}
          />
              {/* No count for remix */}
        </TouchableOpacity>

        {post.type === 'voice' && (
          <TouchableOpacity
            style={styles.actionButton}
            onPress={() => {
              navigation.navigate('RecordVoice', {
                isDuet: true,
                originalClip: {
                  id: post.id,
                  phrase: post.content.phrase,
                  user: post.user.name,
                  language: post.user.language,
                },
              });
            }}
            accessibilityLabel="Create Duet"
          >
            <Ionicons
              name="people"
              size={20}
              color="#6B7280"
            />
          </TouchableOpacity>
        )}

        {post.type === 'voice' && (
          <TouchableOpacity
            style={styles.actionButton}
            onPress={() =>
              navigation.navigate('Validation', {
                clipId: post.id,
                language: post.user.language,
              })
            }
          >
            <Ionicons
              name={post.actions.isValidated ? "checkmark-circle" : "checkmark-circle-outline"}
              size={20}
              color={post.actions.needsValidation ? "#F59E0B" : "#10B981"}
            />
            <Text style={styles.actionText}>{post.engagement.validations}</Text>
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
        ) : isLoading ? (
          <View style={styles.loadingContainer}>
            <Text style={styles.loadingText}>Loading posts...</Text>
          </View>
        ) : posts.length === 0 ? (
          <View style={styles.emptyContainer}>
            <Text style={styles.emptyText}>No posts yet</Text>
            <Text style={styles.emptySubtext}>Create your first post or follow users to see content</Text>
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
    paddingVertical: 4,
    paddingHorizontal: 4,
    borderRadius: 8,
  },
  userInfoPressed: {
    backgroundColor: '#F3F4F6',
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
  avatarImage: {
    width: 40,
    height: 40,
    borderRadius: 20,
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
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 60,
  },
  loadingText: {
    fontSize: 16,
    color: '#6B7280',
    fontWeight: '500',
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 60,
  },
  emptyText: {
    fontSize: 18,
    color: '#1F2937',
    fontWeight: '600',
    marginBottom: 8,
  },
  emptySubtext: {
    fontSize: 14,
    color: '#6B7280',
    textAlign: 'center',
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
  playButtonDisabled: {
    backgroundColor: '#E5E7EB',
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
    paddingBottom: 16,
  },
  createModalScroll: {
    maxHeight: 520,
  },
  createModalScrollContent: {
    paddingBottom: 24,
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
  blueIcon: {
    backgroundColor: '#EFF6FF',
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
});

export default EnhancedHomeScreen;