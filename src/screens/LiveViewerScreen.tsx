// src/screens/LiveViewerScreen.tsx
import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  SafeAreaView,
  StatusBar,
  Dimensions,
  Animated,
  ScrollView,
  TextInput,
  Alert,
  FlatList,
  Image,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { VideoView, useVideoPlayer } from 'expo-video';
import { supabase } from '../supabaseClient';
import { useAuth } from '../context/AuthProvider';

const { width, height } = Dimensions.get('window');

interface Viewer {
  id: string;
  name: string;
  avatar: string;
  isFollowing: boolean;
}

interface Comment {
  id: string;
  user: Viewer;
  message: string;
  timestamp: string;
  isTranslated?: boolean;
  originalMessage?: string;
  translatedMessage?: string;
}

interface LiveStream {
  id: string;
  streamer_id: string;
  streamer_name: string;
  streamer_avatar: string;
  title: string;
  language: string;
  viewer_count: number;
  thumbnail_url?: string;
  is_live: boolean;
  started_at: string;
}

const LiveViewerScreen: React.FC<any> = ({ navigation, route }) => {
  const { roomId } = route.params || {};
  const { user } = useAuth();
  const insets = useSafeAreaInsets();

  const [liveStream, setLiveStream] = useState<LiveStream | null>(null);
  const [isFollowing, setIsFollowing] = useState(false);
  const [viewerCount, setViewerCount] = useState(0);
  const [comments, setComments] = useState<Comment[]>([]);
  const [newComment, setNewComment] = useState('');
  const [showShareModal, setShowShareModal] = useState(false);
  const [showTranslations, setShowTranslations] = useState(true);
  const [isLoading, setIsLoading] = useState(true);
  const [videoStatus, setVideoStatus] = useState<any>({});
  const [isVideoPlaying, setIsVideoPlaying] = useState(false);
  const videoPlayer = useVideoPlayer('https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/BigBuckBunny.mp4');

  // Set video source when liveStream changes
  useEffect(() => {
    if (liveStream?.id) {
      videoPlayer.replace(getStreamingUrl(liveStream.id));
    }
  }, [liveStream?.id, videoPlayer]);

  // Animation values
  const liveAnim = useRef(new Animated.Value(1)).current;
  const viewerAnim = useRef(new Animated.Value(0)).current;

  // Fetch live stream data
  useEffect(() => {
    const fetchLiveStreamData = async () => {
      if (!roomId) return;

      try {
        const { data: streamData, error } = await supabase
          .from('live_streams')
          .select(`
            *,
            profiles!live_streams_streamer_id_fkey (
              id,
              full_name,
              username,
              avatar_url,
              primary_language
            )
          `)
          .eq('id', roomId)
          .eq('is_live', true)
          .single();

        if (error) {
          console.error('Error fetching live stream:', error);
          Alert.alert('Error', 'Live stream not found or has ended');
          navigation.goBack();
          return;
        }

        const streamer = streamData.profiles;
        const formattedStream: LiveStream = {
          id: streamData.id,
          streamer_id: streamData.streamer_id,
          streamer_name: streamer?.full_name || 'Anonymous',
          streamer_avatar: streamer?.avatar_url ? '👤' : '👤',
          title: streamData.title,
          language: streamData.language,
          viewer_count: streamData.viewer_count || 0,
          thumbnail_url: streamData.thumbnail_url,
          is_live: streamData.is_live,
          started_at: streamData.started_at,
        };

        setLiveStream(formattedStream);
        setViewerCount(formattedStream.viewer_count);

        // Check if user is following the streamer
        if (user && streamData.streamer_id !== user.id) {
          const { data: followData } = await supabase
            .from('followers')
            .select('id')
            .eq('follower_id', user.id)
            .eq('following_id', streamData.streamer_id)
            .single();

          setIsFollowing(!!followData);
        }
      } catch (error) {
        console.error('Error fetching live stream data:', error);
        Alert.alert('Error', 'Failed to load live stream');
        navigation.goBack();
      } finally {
        setIsLoading(false);
      }
    };

    fetchLiveStreamData();
  }, [roomId, user, navigation]);

  // Real-time subscription to detect when stream is deleted
  useEffect(() => {
    if (!roomId) return;

    const channel = supabase
      .channel(`live-stream-${roomId}`)
      .on(
        'postgres_changes',
        {
          event: 'DELETE',
          schema: 'public',
          table: 'live_streams',
          filter: `id=eq.${roomId}`
        },
        (payload) => {
          console.log('Stream deleted by streamer:', payload);
          Alert.alert(
            'Stream Ended',
            'The streamer has ended the live stream.',
            [
              {
                text: 'OK',
                onPress: () => navigation.goBack()
              }
            ]
          );
        }
      )
      .subscribe();

    return () => {
      channel.unsubscribe();
    };
  }, [roomId, navigation]);

  // Live indicator animation
  useEffect(() => {
    if (liveStream?.is_live) {
      const liveAnimation = Animated.loop(
        Animated.sequence([
          Animated.timing(liveAnim, {
            toValue: 0.7,
            duration: 1000,
            useNativeDriver: true,
          }),
          Animated.timing(liveAnim, {
            toValue: 1,
            duration: 1000,
            useNativeDriver: true,
          }),
        ])
      );
      liveAnimation.start();

      return () => liveAnimation.stop();
    }
  }, [liveStream?.is_live, liveAnim]);

  // Simulate viewer count changes
  useEffect(() => {
    if (!liveStream?.is_live) return;

    const viewerTimer = setInterval(() => {
      setViewerCount(prev => Math.max(0, prev + Math.floor(Math.random() * 3) - 1));

      // Animate viewer count change
      Animated.sequence([
        Animated.timing(viewerAnim, {
          toValue: 1.2,
          duration: 150,
          useNativeDriver: true,
        }),
        Animated.timing(viewerAnim, {
          toValue: 1,
          duration: 150,
          useNativeDriver: true,
        }),
      ]).start();
    }, 5000);

    return () => clearInterval(viewerTimer);
  }, [liveStream?.is_live, viewerAnim]);

  const handleFollow = async () => {
    if (!user || !liveStream) return;

    try {
      if (isFollowing) {
        // Unfollow
        const { error } = await supabase
          .from('followers')
          .delete()
          .eq('follower_id', user.id)
          .eq('following_id', liveStream.streamer_id);

        if (error) {
          console.error('Error unfollowing:', error);
          return;
        }

        setIsFollowing(false);
        Alert.alert('Unfollowed', `You unfollowed ${liveStream.streamer_name}`);
      } else {
        // Follow
        const { error } = await supabase
          .from('followers')
          .insert({
            follower_id: user.id,
            following_id: liveStream.streamer_id,
          });

        if (error) {
          console.error('Error following:', error);
          return;
        }

        setIsFollowing(true);
        Alert.alert('Following', `You're now following ${liveStream.streamer_name}!`);
      }
    } catch (error) {
      console.error('Error in handleFollow:', error);
      Alert.alert('Error', 'Failed to update follow status');
    }
  };

  const handleShare = () => {
    setShowShareModal(true);
  };

  const shareToSocial = (platform: string) => {
    Alert.alert('Share', `Sharing to ${platform}...`);
    setShowShareModal(false);
  };

  const handleVideoPlaybackStatus = (status: any) => {
    setVideoStatus(status);
    if (status.isLoaded) {
      setIsVideoPlaying(status.isPlaying);
    }
  };

  const toggleVideoPlayback = async () => {
    if (isVideoPlaying) {
      videoPlayer.pause();
    } else {
      videoPlayer.play();
    }
  };

  // Generate streaming URL (in real app, this would come from your streaming service)
  const getStreamingUrl = (streamId: string) => {
    // For demo purposes, using a sample video
    // In production, this would be the actual RTMP/HLS stream URL from services like:
    // - AWS IVS: https://your-domain.com/streams/{streamId}.m3u8
    // - Twitch: https://twitch.tv/{channel}
    // - YouTube Live: https://youtube.com/watch?v={videoId}
    // - Custom RTMP server: rtmp://your-server.com/live/{streamId}
    // https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/BigBuckBunny.mp4
    return '';
  };

  const sendComment = () => {
    if (newComment.trim()) {
      const comment: Comment = {
        id: Date.now().toString(),
        user: {
          id: 'current_user',
          name: 'You',
          avatar: '👤',
          isFollowing: false,
        },
        message: newComment,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      };

      setComments([...comments, comment]);
      setNewComment('');
    }
  };

  const renderComment = ({ item }: { item: Comment }) => (
    <View style={styles.commentItem}>
      <Text style={styles.commentUser}>{item.user.name}:</Text>
      <Text style={styles.commentMessage}>
        {showTranslations && item.isTranslated ? item.translatedMessage : item.message}
      </Text>
      {showTranslations && item.isTranslated && (
        <Text style={styles.originalMessage}>Original: {item.originalMessage}</Text>
      )}
    </View>
  );

  if (isLoading) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.loadingContainer}>
          <Text style={styles.loadingText}>Loading live stream...</Text>
        </View>
      </SafeAreaView>
    );
  }

  if (!liveStream) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.errorContainer}>
          <Text style={styles.errorText}>Stream not found or has ended</Text>
          <TouchableOpacity
            style={styles.backButton}
            onPress={() => navigation.goBack()}
          >
            <Text style={styles.backButtonText}>Go Back</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor="#000000" />

      {/* Stream Header */}
      <View style={[styles.streamHeader, { paddingTop: insets.top + 12 }]}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => navigation.goBack()}
        >
          <Ionicons name="chevron-back" size={24} color="#FFFFFF" />
        </TouchableOpacity>

        <View style={styles.streamInfo}>
          {liveStream.is_live && (
            <Animated.View style={[styles.liveIndicator, { opacity: liveAnim }]}>
              <View style={styles.liveDot} />
              <Text style={styles.liveText}>LIVE</Text>
            </Animated.View>
          )}
          <Animated.Text style={[styles.viewerCount, { transform: [{ scale: viewerAnim }] }]}>
            {liveStream.is_live ? `${viewerCount} watching` : 'Stream ended'}
          </Animated.Text>
        </View>

        <TouchableOpacity
          style={styles.shareButton}
          onPress={handleShare}
        >
          <Ionicons name="share" size={24} color="#FFFFFF" />
        </TouchableOpacity>
      </View>

      {/* Video Area */}
      <View style={styles.videoArea}>
        <View style={styles.videoContainer}>
          {liveStream.is_live ? (
            <View style={styles.videoPlayerContainer}>
              <VideoView
                style={styles.videoPlayer}
                player={videoPlayer}
              />

              {/* Video Overlay */}
              <View style={styles.videoOverlay}>
                {!videoStatus.isLoaded && (
                  <View style={styles.loadingOverlay}>
                    <Ionicons name="refresh" size={40} color="#FFFFFF" />
                    <Text style={styles.loadingText}>Loading stream...</Text>
                  </View>
                )}

                <TouchableOpacity
                  style={styles.playPauseButton}
                  onPress={toggleVideoPlayback}
                >
                  <Ionicons
                    name={isVideoPlaying ? "pause" : "play"}
                    size={40}
                    color="#FFFFFF"
                  />
                </TouchableOpacity>

                <View style={styles.streamInfoOverlay}>
                  <Text style={styles.streamTitleOverlay}>{liveStream.title}</Text>
                  <Text style={styles.streamerNameOverlay}>{liveStream.streamer_name}</Text>
                </View>
              </View>
            </View>
          ) : (
            <View style={styles.videoPlaceholder}>
              <Ionicons name="videocam-off" size={60} color="#9CA3AF" />
              <Text style={styles.videoPlaceholderText}>Stream Ended</Text>
              <Text style={styles.streamTitle}>{liveStream.title}</Text>
              <Text style={styles.streamerName}>{liveStream.streamer_name}</Text>
            </View>
          )}
        </View>
      </View>

      {/* Stream Info */}
      <View style={styles.streamInfoSection}>
        <View style={styles.streamerInfo}>
          <View style={styles.streamerAvatar}>
            <Text style={styles.streamerAvatarText}>{liveStream.streamer_avatar}</Text>
          </View>
          <View style={styles.streamerDetails}>
            <Text style={styles.streamerName}>{liveStream.streamer_name}</Text>
            <Text style={styles.streamLanguage}>{liveStream.language}</Text>
          </View>
          <TouchableOpacity
            style={[styles.followButton, isFollowing && styles.followingButton]}
            onPress={handleFollow}
          >
            <Text style={[styles.followButtonText, isFollowing && styles.followingButtonText]}>
              {isFollowing ? 'Following' : 'Follow'}
            </Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* Comments Section */}
      <View style={styles.commentsSection}>
        <View style={styles.commentsHeader}>
          <Text style={styles.commentsTitle}>Live Chat</Text>
          <TouchableOpacity onPress={() => setShowTranslations(!showTranslations)}>
            <Ionicons
              name={showTranslations ? "language" : "language-outline"}
              size={20}
              color="#10B981"
            />
          </TouchableOpacity>
        </View>

        <ScrollView
          style={styles.commentsList}
          showsVerticalScrollIndicator={false}
        >
          {comments.map((item) => (
            <View key={item.id} style={styles.commentItem}>
              <Text style={styles.commentUser}>{item.user.name}:</Text>
              <Text style={styles.commentMessage}>
                {showTranslations && item.isTranslated ? item.translatedMessage : item.message}
              </Text>
              {showTranslations && item.isTranslated && (
                <Text style={styles.originalMessage}>Original: {item.originalMessage}</Text>
              )}
            </View>
          ))}
        </ScrollView>
      </View>

      {/* Comment Input */}
      <View style={[styles.commentInputContainer, { paddingBottom: insets.bottom + 12 }]}>
        <TextInput
          style={styles.commentInput}
          placeholder="Say something..."
          value={newComment}
          onChangeText={setNewComment}
          placeholderTextColor="#9CA3AF"
        />
        <TouchableOpacity
          style={styles.sendButton}
          onPress={sendComment}
        >
          <Ionicons name="send" size={20} color="#FFFFFF" />
        </TouchableOpacity>
      </View>

      {/* Share Modal */}
      {showShareModal && (
        <View style={styles.shareModal}>
          <View style={styles.shareModalContent}>
            <View style={styles.shareModalHeader}>
              <Text style={styles.shareModalTitle}>Share Stream</Text>
              <TouchableOpacity onPress={() => setShowShareModal(false)}>
                <Ionicons name="close" size={24} color="#1F2937" />
              </TouchableOpacity>
            </View>

            <View style={styles.shareOptions}>
              <TouchableOpacity
                style={styles.shareOption}
                onPress={() => shareToSocial('WhatsApp')}
              >
                <Ionicons name="logo-whatsapp" size={32} color="#25D366" />
                <Text style={styles.shareOptionText}>WhatsApp</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.shareOption}
                onPress={() => shareToSocial('Twitter')}
              >
                <Ionicons name="logo-twitter" size={32} color="#1DA1F2" />
                <Text style={styles.shareOptionText}>Twitter</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.shareOption}
                onPress={() => shareToSocial('Instagram')}
              >
                <Ionicons name="logo-instagram" size={32} color="#E4405F" />
                <Text style={styles.shareOptionText}>Instagram</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.shareOption}
                onPress={() => shareToSocial('Copy Link')}
              >
                <Ionicons name="copy" size={32} color="#6B7280" />
                <Text style={styles.shareOptionText}>Copy Link</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      )}
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000000',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  errorText: {
    color: '#FFFFFF',
    fontSize: 18,
    marginBottom: 20,
    textAlign: 'center',
  },
  backButton: {
    backgroundColor: '#FF8A00',
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 8,
  },
  backButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
  streamHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    zIndex: 10,
  },
  streamInfo: {
    alignItems: 'center',
    flex: 1,
  },
  liveIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#EF4444',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    marginBottom: 4,
  },
  liveDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#FFFFFF',
    marginRight: 4,
  },
  liveText: {
    fontSize: 10,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  viewerCount: {
    fontSize: 14,
    color: '#FFFFFF',
    fontWeight: '500',
  },
  shareButton: {
    padding: 4,
  },
  videoArea: {
    flex: 1,
    backgroundColor: '#1F2937',
  },
  videoContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  videoPlayerContainer: {
    flex: 1,
    width: '100%',
    position: 'relative',
  },
  videoPlayer: {
    flex: 1,
    width: '100%',
  },
  videoOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.3)',
  },
  playPauseButton: {
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
    borderRadius: 40,
    padding: 20,
    marginBottom: 20,
  },
  streamInfoOverlay: {
    position: 'absolute',
    bottom: 20,
    left: 20,
    right: 20,
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    padding: 12,
    borderRadius: 8,
  },
  streamTitleOverlay: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#FFFFFF',
    marginBottom: 4,
  },
  streamerNameOverlay: {
    fontSize: 14,
    color: '#9CA3AF',
  },
  loadingOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.8)',
  },
  loadingText: {
    color: '#FFFFFF',
    fontSize: 16,
    marginTop: 12,
  },
  videoPlaceholder: {
    alignItems: 'center',
    padding: 20,
  },
  videoPlaceholderText: {
    fontSize: 18,
    color: '#9CA3AF',
    marginTop: 8,
    marginBottom: 16,
  },
  streamTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#FFFFFF',
    textAlign: 'center',
    marginBottom: 8,
  },
  streamerName: {
    fontSize: 16,
    color: '#9CA3AF',
    textAlign: 'center',
  },
  streamInfoSection: {
    backgroundColor: 'rgba(0, 0, 0, 0.8)',
    padding: 16,
  },
  streamerInfo: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  streamerAvatar: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#F3F4F6',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  streamerAvatarText: {
    fontSize: 24,
  },
  streamerDetails: {
    flex: 1,
  },
  streamLanguage: {
    fontSize: 14,
    color: '#9CA3AF',
    marginTop: 2,
  },
  followButton: {
    backgroundColor: '#FF8A00',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
  },
  followButtonText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '600',
  },
  followingButton: {
    backgroundColor: '#6B7280',
  },
  followingButtonText: {
    color: '#FFFFFF',
  },
  commentsSection: {
    backgroundColor: 'rgba(0, 0, 0, 0.8)',
    maxHeight: height * 0.25,
    paddingHorizontal: 16,
    paddingTop: 12,
  },
  commentsHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  commentsTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  commentsList: {
    maxHeight: 120,
  },
  commentItem: {
    marginBottom: 8,
  },
  commentUser: {
    fontSize: 12,
    fontWeight: '600',
    color: '#FF8A00',
  },
  commentMessage: {
    fontSize: 14,
    color: '#FFFFFF',
    marginTop: 2,
  },
  originalMessage: {
    fontSize: 12,
    color: '#9CA3AF',
    fontStyle: 'italic',
    marginTop: 2,
  },
  commentInputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.9)',
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  commentInput: {
    flex: 1,
    backgroundColor: '#374151',
    borderRadius: 20,
    paddingHorizontal: 16,
    paddingVertical: 8,
    fontSize: 14,
    color: '#FFFFFF',
    marginRight: 8,
  },
  sendButton: {
    backgroundColor: '#FF8A00',
    borderRadius: 20,
    padding: 8,
    justifyContent: 'center',
    alignItems: 'center',
  },
  shareModal: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 1000,
  },
  shareModalContent: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 20,
    width: '90%',
    maxWidth: 400,
  },
  shareModalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  shareModalTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1F2937',
  },
  shareOptions: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    flexWrap: 'wrap',
  },
  shareOption: {
    alignItems: 'center',
    padding: 16,
    minWidth: 80,
  },
  shareOptionText: {
    fontSize: 12,
    color: '#6B7280',
    marginTop: 8,
    textAlign: 'center',
  },
});

export default LiveViewerScreen;
