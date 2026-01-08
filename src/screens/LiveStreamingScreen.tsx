// src/screens/LiveStreamingScreen.tsx
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
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { CameraView, CameraType, useCameraPermissions } from 'expo-camera';
import { useAudioPlayer } from 'expo-audio';
import io from 'socket.io-client';
import { supabase } from '../supabaseClient';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

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

interface Gift {
  id: string;
  name: string;
  emoji: string;
  coins: number;
}

const mockViewers: Viewer[] = [
  { id: '1', name: 'Chidi', avatar: '👨🏾', isFollowing: true },
  { id: '2', name: 'Aisha', avatar: '👩🏾', isFollowing: false },
  { id: '3', name: 'Kemi', avatar: '👸🏾', isFollowing: true },
  { id: '4', name: 'Tunde', avatar: '👨🏾‍🎓', isFollowing: false },
  { id: '5', name: 'Fatima', avatar: '👩🏾‍💼', isFollowing: true },
];

const mockComments: Comment[] = [
  {
    id: '1',
    user: mockViewers[0],
    message: 'Ndewo! This is amazing!',
    originalMessage: 'Ndewo! Nke a dị egwu!',
    translatedMessage: 'Hello! This is amazing!',
    timestamp: '10:30',
    isTranslated: true,
  },
  {
    id: '2',
    user: mockViewers[1],
    message: 'Great pronunciation! 👏',
    timestamp: '10:31',
  },
  {
    id: '3',
    user: mockViewers[2],
    message: 'Can you teach us Yoruba next?',
    timestamp: '10:32',
  },
];

const gifts: Gift[] = [
  { id: '1', name: 'Heart', emoji: '❤️', coins: 1 },
  { id: '2', name: 'Clap', emoji: '👏', coins: 5 },
  { id: '3', name: 'Fire', emoji: '🔥', coins: 10 },
  { id: '4', name: 'Crown', emoji: '👑', coins: 50 },
  { id: '5', name: 'Diamond', emoji: '💎', coins: 100 },
];

const LiveStreamingScreen: React.FC<any> = ({ navigation, route }) => {
  const insets = useSafeAreaInsets();
  const [isLive, setIsLive] = useState(false);
  const [viewerCount, setViewerCount] = useState(0);
  const [duration, setDuration] = useState(0);
  const [comments, setComments] = useState<Comment[]>(mockComments);
  const [newComment, setNewComment] = useState('');
  const [showGifts, setShowGifts] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [isMuted, setIsMuted] = useState(false);
  const [isVideoOff, setIsVideoOff] = useState(false);
  const [showTranslations, setShowTranslations] = useState(true);
  const [streamTitle, setStreamTitle] = useState('Learning Igbo Together! 🇳🇬');
  const [streamLanguage, setStreamLanguage] = useState('Igbo');

  // Camera and streaming state
  const [permission, requestPermission] = useCameraPermissions();
  const [cameraRef, setCameraRef] = useState<any>(null);
  const [socket, setSocket] = useState<any>(null);
  const [streamId, setStreamId] = useState<string | null>(null);
  const [facing, setFacing] = useState<'front' | 'back'>('back');

  // Animation values
  const liveAnim = useRef(new Animated.Value(1)).current;
  const heartAnim = useRef(new Animated.Value(0)).current;
  const viewerAnim = useRef(new Animated.Value(0)).current;

  // Request permissions on mount
  useEffect(() => {
    if (!permission?.granted) {
      requestPermission();
    }
  }, []);

  // Initialize camera when permissions are granted
  useEffect(() => {
    if (permission?.granted) {
      initializeCamera();
    }
  }, [permission?.granted]);

  // Initialize socket connection when going live
  useEffect(() => {
    if (isLive) {
      initializeSocket();
    }
  }, [isLive]);

  useEffect(() => {
    if (isLive) {
      // Simulate viewer count changes
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

      // Duration timer
      const durationTimer = setInterval(() => {
        setDuration(prev => prev + 1);
      }, 1000);

      // Live indicator animation
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

      return () => {
        clearInterval(viewerTimer);
        clearInterval(durationTimer);
        liveAnimation.stop();
      };
    }
  }, [isLive]);

  const formatDuration = (seconds: number) => {
    const hours = Math.floor(seconds / 3600);
    const mins = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;

    if (hours > 0) {
      return `${hours}:${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
    }
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  // Initialize camera
  const initializeCamera = async () => {
    try {
      console.log('Camera initialized successfully');
      // Camera is now ready to use
    } catch (error) {
      console.error('Error initializing camera:', error);
      Alert.alert('Error', 'Failed to access camera and microphone');
    }
  };

  // Toggle camera between front and back
  const toggleCamera = () => {
    setFacing(current => (current === 'back' ? 'front' : 'back'));
  };

  // Initialize Socket.IO connection
  const initializeSocket = () => {
    const newSocket = io('ws://localhost:3001'); // Replace with your server URL
    setSocket(newSocket);

    newSocket.on('connect', () => {
      console.log('Connected to streaming server');
    });

    newSocket.on('viewer-joined', (data) => {
      setViewerCount(prev => {
        const newCount = prev + 1;
        updateViewerCount(newCount);
        return newCount;
      });
    });

    newSocket.on('viewer-left', (data) => {
      setViewerCount(prev => {
        const newCount = Math.max(0, prev - 1);
        updateViewerCount(newCount);
        return newCount;
      });
    });

    newSocket.on('new-comment', (comment) => {
      setComments(prev => [...prev, comment]);
    });
  };

  // Update viewer count in database
  const updateViewerCount = async (newCount: number) => {
    if (!streamId) return;

    try {
      const { error } = await supabase
        .from('live_streams')
        .update({ viewer_count: newCount })
        .eq('id', streamId);

      if (error) {
        console.error('Error updating viewer count:', error);
      }
    } catch (error) {
      console.error('Error updating viewer count:', error);
    }
  };

  const startLive = async () => {
    if (!permission?.granted) {
      Alert.alert('Permissions Required', 'Camera and microphone permissions are required.');
      return;
    }

    try {
      // Get current user
      const { data: { user: authUser } } = await supabase.auth.getUser();
      if (!authUser) {
        Alert.alert('Error', 'Please sign in to start a live stream');
        return;
      }

      // Create live stream record in database
      const { data: streamData, error: streamError } = await supabase
        .from('live_streams')
        .insert({
          streamer_id: authUser.id,
          title: streamTitle,
          language: streamLanguage,
          is_live: true,
          viewer_count: 0,
          started_at: new Date().toISOString(),
          stream_key: `stream_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        })
        .select()
        .single();

      if (streamError) {
        console.error('Error creating live stream:', streamError);
        Alert.alert('Error', 'Failed to create live stream');
        return;
      }

      setIsLive(true);
      setViewerCount(0);
      setStreamId(streamData.id);

      Alert.alert('🎉 You\'re Live!', 'Your stream has started successfully!');
    } catch (error) {
      console.error('Error starting live stream:', error);
      Alert.alert('Error', 'Failed to start live stream');
    }
  };

  const endLive = () => {
    Alert.alert(
      'End Live Stream',
      `Are you sure you want to end your stream?\n\nDuration: ${formatDuration(duration)}\nViewers: ${viewerCount}`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'End Stream',
          style: 'destructive',
          onPress: async () => {
            try {
              // Delete live stream from database (auto-cleanup)
              if (streamId) {
                const { error } = await supabase
                  .from('live_streams')
                  .delete()
                  .eq('id', streamId);

                if (error) {
                  console.error('Error deleting live stream:', error);
                } else {
                  console.log('Live stream deleted successfully');
                }
              }

              cleanup();
              setIsLive(false);
              setDuration(0);
              navigation.goBack();
            } catch (error) {
              console.error('Error ending live stream:', error);
              // Still clean up locally even if database update fails
              cleanup();
              setIsLive(false);
              setDuration(0);
              navigation.goBack();
            }
          },
        },
      ]
    );
  };

  // Cleanup function
  const cleanup = () => {
    try {
      // Disconnect socket
      if (socket) {
        socket.disconnect();
        setSocket(null);
      }

      // Reset states
      setStreamId(null);
    } catch (error) {
      console.error('Error during cleanup:', error);
    }
  };

  // Auto-cleanup when component unmounts (user navigates away)
  useEffect(() => {
    return () => {
      // If user navigates away while live, delete the stream
      if (isLive && streamId) {
        supabase
          .from('live_streams')
          .delete()
          .eq('id', streamId)
          .then(({ error }) => {
            if (error) {
              console.error('Error auto-deleting stream on unmount:', error);
            } else {
              console.log('Stream auto-deleted on unmount');
            }
          });
      }
    };
  }, [isLive, streamId]);

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

      // Send comment via socket
      if (socket && streamId) {
        socket.emit('send-comment', {
          comment: comment,
          streamId: streamId,
        });
      }

      setComments([...comments, comment]);
      setNewComment('');
    }
  };

  const sendGift = (gift: Gift) => {
    // Animate gift sending
    Animated.sequence([
      Animated.timing(heartAnim, {
        toValue: 1,
        duration: 300,
        useNativeDriver: true,
      }),
      Animated.timing(heartAnim, {
        toValue: 0,
        duration: 500,
        useNativeDriver: true,
      }),
    ]).start();

    Alert.alert('Gift Sent!', `You sent ${gift.emoji} ${gift.name} for ${gift.coins} coins!`);
    setShowGifts(false);
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

  const renderGift = ({ item }: { item: Gift }) => (
    <TouchableOpacity
      style={styles.giftItem}
      onPress={() => sendGift(item)}
    >
      <Text style={styles.giftEmoji}>{item.emoji}</Text>
      <Text style={styles.giftName}>{item.name}</Text>
      <Text style={styles.giftCost}>{item.coins} coins</Text>
    </TouchableOpacity>
  );

  const SettingsModal = () => (
    <View style={styles.settingsModal}>
      <View style={styles.settingsHeader}>
        <Text style={styles.settingsTitle}>Stream Settings</Text>
        <TouchableOpacity onPress={() => setShowSettings(false)}>
          <Ionicons name="close" size={24} color="#1F2937" />
        </TouchableOpacity>
      </View>

      <View style={styles.settingsContent}>
        <View style={styles.settingItem}>
          <Text style={styles.settingLabel}>Stream Title</Text>
          <TextInput
            style={styles.settingInput}
            value={streamTitle}
            onChangeText={setStreamTitle}
            placeholder="Enter stream title..."
          />
        </View>

        <View style={styles.settingItem}>
          <Text style={styles.settingLabel}>Primary Language</Text>
          <View style={styles.languageOptions}>
            {['Igbo', 'Yoruba', 'Hausa', 'English'].map((lang) => (
              <TouchableOpacity
                key={lang}
                style={[
                  styles.languageOption,
                  streamLanguage === lang && styles.selectedLanguageOption
                ]}
                onPress={() => setStreamLanguage(lang)}
              >
                <Text style={[
                  styles.languageOptionText,
                  streamLanguage === lang && styles.selectedLanguageOptionText
                ]}>
                  {lang}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        <View style={styles.settingItem}>
          <View style={styles.settingRow}>
            <Text style={styles.settingLabel}>Real-time Translation</Text>
            <TouchableOpacity
              style={[styles.toggle, showTranslations && styles.toggleActive]}
              onPress={() => setShowTranslations(!showTranslations)}
            >
              <View style={[styles.toggleThumb, showTranslations && styles.toggleThumbActive]} />
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </View>
  );

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
          {isLive && (
            <Animated.View style={[styles.liveIndicator, { opacity: liveAnim }]}>
              <View style={styles.liveDot} />
              <Text style={styles.liveText}>LIVE</Text>
            </Animated.View>
          )}
          <Animated.Text style={[styles.viewerCount, { transform: [{ scale: viewerAnim }] }]}>
            {isLive ? `${viewerCount} watching` : 'Ready to go live'}
          </Animated.Text>
          {isLive && (
            <Text style={styles.duration}>{formatDuration(duration)}</Text>
          )}
        </View>

        <TouchableOpacity
          style={styles.settingsButton}
          onPress={() => setShowSettings(!showSettings)}
        >
          <Ionicons name="settings" size={24} color="#FFFFFF" />
        </TouchableOpacity>
      </View>

      {/* Main Video Area */}
      <View style={styles.videoArea}>
        {!permission?.granted ? (
          <View style={styles.videoOffContainer}>
            <Ionicons name="camera-outline" size={60} color="#9CA3AF" />
            <Text style={styles.videoOffText}>Camera permission required</Text>
            <TouchableOpacity
              style={styles.permissionButton}
              onPress={requestPermission}
            >
              <Text style={styles.permissionButtonText}>Grant Permission</Text>
            </TouchableOpacity>
          </View>
        ) : isVideoOff ? (
          <View style={styles.videoOffContainer}>
            <Ionicons name="videocam-off" size={60} color="#9CA3AF" />
            <Text style={styles.videoOffText}>Camera is off</Text>
          </View>
        ) : (
          <View style={styles.videoContainer}>
            <CameraView
              style={styles.camera}
              facing={facing}
              ref={(ref: any) => setCameraRef(ref)}
            />
            <View style={styles.streamOverlay}>
              <View style={styles.streamTitle}>
                <Text style={styles.streamTitleText}>{streamTitle}</Text>
              </View>
              <View style={styles.languageIndicator}>
                <Ionicons name="language" size={16} color="#10B981" />
                <Text style={styles.languageText}>Teaching {streamLanguage}</Text>
              </View>
            </View>
          </View>
        )}

        {/* Floating Gift Animation */}
        <Animated.View style={[
          styles.floatingGift,
          {
            opacity: heartAnim,
            transform: [{
              translateY: heartAnim.interpolate({
                inputRange: [0, 1],
                outputRange: [0, -100],
              }),
            }],
          },
        ]}>
          <Text style={styles.floatingGiftText}>❤️</Text>
        </Animated.View>
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

      {/* Bottom Controls */}
      <View style={[styles.bottomControls, { paddingBottom: insets.bottom + 12 }]}>
        {/* Comment Input */}
        <View style={styles.commentInputContainer}>
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

        {/* Control Buttons */}
        <View style={styles.controlButtons}>
          <TouchableOpacity
            style={[styles.controlButton, isMuted && styles.activeControlButton]}
            onPress={() => setIsMuted(!isMuted)}
          >
            <Ionicons
              name={isMuted ? "mic-off" : "mic"}
              size={24}
              color="#FFFFFF"
            />
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.controlButton, isVideoOff && styles.activeControlButton]}
            onPress={() => setIsVideoOff(!isVideoOff)}
          >
            <Ionicons
              name={isVideoOff ? "videocam-off" : "videocam"}
              size={24}
              color="#FFFFFF"
            />
          </TouchableOpacity>

          {/* Camera Switch Button */}
          <TouchableOpacity
            style={[styles.controlButton, { backgroundColor: '#8B5CF6' }]}
            onPress={toggleCamera}
          >
            <Ionicons
              name="camera-reverse"
              size={24}
              color="#FFFFFF"
            />
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.controlButton}
            onPress={() => setShowGifts(!showGifts)}
          >
            <Ionicons name="gift" size={24} color="#FFFFFF" />
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.controlButton}
            onPress={() => Alert.alert('Effects', 'Live effects coming soon!')}
          >
            <Ionicons name="sparkles" size={24} color="#FFFFFF" />
          </TouchableOpacity>

          {!isLive ? (
            <TouchableOpacity
              style={styles.startLiveButton}
              onPress={startLive}
            >
              <Text style={styles.startLiveText}>Go Live</Text>
            </TouchableOpacity>
          ) : (
            <TouchableOpacity
              style={styles.endLiveButton}
              onPress={endLive}
            >
              <Text style={styles.endLiveText}>End</Text>
            </TouchableOpacity>
          )}

        </View>
      </View>

      {/* Gifts Panel */}
      {showGifts && (
        <View style={styles.giftsPanel}>
          <View style={styles.giftsPanelHeader}>
            <Text style={styles.giftsPanelTitle}>Send Gift</Text>
            <TouchableOpacity onPress={() => setShowGifts(false)}>
              <Ionicons name="close" size={20} color="#1F2937" />
            </TouchableOpacity>
          </View>
          <FlatList
            data={gifts}
            renderItem={renderGift}
            keyExtractor={(item) => item.id}
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.giftsList}
          />
        </View>
      )}

      {/* Settings Panel */}
      {showSettings && <SettingsModal />}

      {/* Viewers List */}
      {isLive && (
        <View style={styles.viewersContainer}>
          <ScrollView horizontal showsHorizontalScrollIndicator={false}>
            <View style={styles.viewersList}>
              {mockViewers.slice(0, Math.min(viewerCount, 10)).map((viewer, index) => (
                <View key={index} style={styles.viewerItem}>
                  <Text style={styles.viewerAvatar}>{viewer.avatar}</Text>
                </View>
              ))}
              {viewerCount > 10 && (
                <View style={styles.moreViewers}>
                  <Text style={styles.moreViewersText}>+{viewerCount - 10}</Text>
                </View>
              )}
            </View>
          </ScrollView>
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
  backButton: {
    padding: 4,
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
  duration: {
    fontSize: 12,
    color: '#D1D5DB',
    marginTop: 2,
  },
  settingsButton: {
    padding: 4,
  },
  videoArea: {
    flex: 1,
    position: 'relative',
  },
  videoContainer: {
    flex: 1,
    backgroundColor: '#1F2937',
    justifyContent: 'center',
    alignItems: 'center',
    position: 'relative',
  },
  cameraPlaceholder: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  camera: {
    flex: 1,
    width: '100%',
    height: '100%',
  },
  rtcView: {
    flex: 1,
    width: '100%',
    height: '100%',
  },
  videoPlaceholder: {
    fontSize: 48,
    color: '#9CA3AF',
  },
  cameraStatusText: {
    fontSize: 16,
    color: '#10B981',
    marginTop: 8,
    fontWeight: '500',
  },
  permissionButton: {
    backgroundColor: '#FF8A00',
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 8,
    marginTop: 16,
  },
  permissionButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
  videoOffContainer: {
    flex: 1,
    backgroundColor: '#1F2937',
    justifyContent: 'center',
    alignItems: 'center',
  },
  videoOffText: {
    fontSize: 16,
    color: '#9CA3AF',
    marginTop: 16,
  },
  streamOverlay: {
    position: 'absolute',
    bottom: 20,
    left: 20,
    right: 20,
  },
  streamTitle: {
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 12,
    marginBottom: 8,
  },
  streamTitleText: {
    fontSize: 16,
    color: '#FFFFFF',
    fontWeight: '500',
    textAlign: 'center',
  },
  languageIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(16, 185, 129, 0.2)',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
    alignSelf: 'center',
  },
  languageText: {
    marginLeft: 6,
    fontSize: 12,
    color: '#10B981',
    fontWeight: '500',
  },
  floatingGift: {
    position: 'absolute',
    top: '50%',
    left: '50%',
    marginLeft: -25,
    marginTop: -25,
    zIndex: 5,
  },
  floatingGiftText: {
    fontSize: 50,
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
  bottomControls: {
    backgroundColor: 'rgba(0, 0, 0, 0.9)',
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  commentInputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
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
  controlButtons: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  controlButton: {
    backgroundColor: '#374151',
    borderRadius: 25,
    padding: 12,
    marginHorizontal: 4,
  },
  activeControlButton: {
    backgroundColor: '#EF4444',
  },
  startLiveButton: {
    backgroundColor: '#EF4444',
    borderRadius: 20,
    paddingHorizontal: 20,
    paddingVertical: 12,
    marginLeft: 8,
  },
  startLiveText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  endLiveButton: {
    backgroundColor: '#6B7280',
    borderRadius: 20,
    paddingHorizontal: 20,
    paddingVertical: 12,
    marginLeft: 8,
  },
  endLiveText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  giftsPanel: {
    position: 'absolute',
    bottom: 120,
    left: 0,
    right: 0,
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    padding: 16,
  },
  giftsPanelHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  giftsPanelTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1F2937',
  },
  giftsList: {
    paddingHorizontal: 8,
  },
  giftItem: {
    alignItems: 'center',
    backgroundColor: '#F3F4F6',
    borderRadius: 12,
    padding: 12,
    marginHorizontal: 4,
    minWidth: 80,
  },
  giftEmoji: {
    fontSize: 24,
    marginBottom: 4,
  },
  giftName: {
    fontSize: 12,
    fontWeight: '500',
    color: '#1F2937',
    marginBottom: 2,
  },
  giftCost: {
    fontSize: 10,
    color: '#6B7280',
  },
  settingsModal: {
    position: 'absolute',
    top: 60,
    right: 16,
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 16,
    minWidth: 250,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
  settingsHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  settingsTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1F2937',
  },
  settingsContent: {
    flex: 1,
  },
  settingItem: {
    marginBottom: 16,
  },
  settingLabel: {
    fontSize: 14,
    fontWeight: '500',
    color: '#1F2937',
    marginBottom: 8,
  },
  settingInput: {
    borderWidth: 1,
    borderColor: '#E5E7EB',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 8,
    fontSize: 14,
    color: '#1F2937',
  },
  languageOptions: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  languageOption: {
    backgroundColor: '#F3F4F6',
    borderRadius: 16,
    paddingHorizontal: 12,
    paddingVertical: 6,
    marginRight: 8,
    marginBottom: 8,
  },
  selectedLanguageOption: {
    backgroundColor: '#FF8A00',
  },
  languageOptionText: {
    fontSize: 12,
    color: '#1F2937',
    fontWeight: '500',
  },
  selectedLanguageOptionText: {
    color: '#FFFFFF',
  },
  settingRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  toggle: {
    width: 44,
    height: 24,
    borderRadius: 12,
    backgroundColor: '#E5E7EB',
    justifyContent: 'center',
    paddingHorizontal: 2,
  },
  toggleActive: {
    backgroundColor: '#10B981',
  },
  toggleThumb: {
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: '#FFFFFF',
    alignSelf: 'flex-start',
  },
  toggleThumbActive: {
    alignSelf: 'flex-end',
  },
  viewersContainer: {
    position: 'absolute',
    top: 60,
    left: 16,
    right: 16,
  },
  viewersList: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  viewerItem: {
    marginRight: 4,
  },
  viewerAvatar: {
    fontSize: 20,
  },
  moreViewers: {
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
    borderRadius: 12,
    paddingHorizontal: 8,
    paddingVertical: 4,
    marginLeft: 4,
  },
  moreViewersText: {
    fontSize: 10,
    color: '#FFFFFF',
    fontWeight: '500',
  },
});

export default LiveStreamingScreen;