// src/screens/GroupChatScreen.tsx
import React, { useState, useRef, useEffect, useCallback } from 'react';
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
  KeyboardAvoidingView,
  Platform,
  Alert,
  Animated,
  ActivityIndicator,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { useFocusEffect } from '@react-navigation/native';
import type { RootStackParamList } from '../../App';
import { supabase } from '../supabaseClient';
import { useAuth } from '../context/AuthProvider';
const { width, height } = Dimensions.get('window');

interface Message {
  id: string;
  text?: string;
  sender_id: string;
  conversation_id: string;
  type: 'text' | 'voice' | 'image';
  created_at: string;
  updated_at?: string;
  media_url?: string;
  payload?: any;
  // UI-specific fields (computed/derived)
  senderName?: string;
  senderAvatar?: string;
  isTranslationVisible?: boolean;
  translated_content?: string; // We'll compute this on the client side
  audio_url?: string; // Derived from media_url for voice messages
  duration?: number; // We'll store this in payload for voice messages
}

interface GroupMember {
  id: string;
  user_id: string;
  conversation_id: string;
  role: 'admin' | 'member';
  joined_at: string;
  // User profile data
  full_name?: string;
  username?: string;
  avatar_url?: string;
  primary_language?: string;
}

type Props = NativeStackScreenProps<RootStackParamList, 'GroupChat'>;

const GroupChatScreen: React.FC<Props> = ({ route, navigation }) => {
  const insets = useSafeAreaInsets();
  const { group } = route.params;
  const { user } = useAuth();
  const [messages, setMessages] = useState<Message[]>([]);
  const [groupMembers, setGroupMembers] = useState<GroupMember[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSending, setIsSending] = useState(false);
  const [newMessage, setNewMessage] = useState('');
  const [showTranslations, setShowTranslations] = useState(true);
  const [isRecording, setIsRecording] = useState(false);
  const [isTyping, setIsTyping] = useState(false);
  const [typingUsers, setTypingUsers] = useState<string[]>([]);
  const scrollViewRef = useRef<ScrollView>(null);

  // Animation values for typing dots
  const dot1Anim = useRef(new Animated.Value(0.3)).current;
  const dot2Anim = useRef(new Animated.Value(0.3)).current;
  const dot3Anim = useRef(new Animated.Value(0.3)).current;

  // Fetch messages for this group
  const fetchMessages = useCallback(async () => {
    if (!group.id) return;

    try {
      // First get the messages
      const { data: messagesData, error: messagesError } = await supabase
        .from('messages')
        .select('*')
        .eq('conversation_id', group.id)
        .order('created_at', { ascending: true });

      if (messagesError) {
        console.error('Error fetching messages:', messagesError);
        return;
      }

      if (!messagesData || messagesData.length === 0) {
        console.log('No messages found for this group yet');
        setMessages([]);
        return;
      }

      // Get unique sender IDs
      const senderIds = [...new Set(messagesData.map(msg => msg.sender_id))];

      // Fetch sender profiles separately
      const { data: profilesData, error: profilesError } = await supabase
        .from('profiles')
        .select('id, full_name, username, avatar_url, primary_language')
        .in('id', senderIds);

      if (profilesError) {
        console.error('Error fetching sender profiles:', profilesError);
        // Still set messages without profile data
        const transformedMessages: Message[] = messagesData.map(msg => ({
          id: msg.id,
          text: msg.text,
          sender_id: msg.sender_id,
          conversation_id: msg.conversation_id,
          type: msg.type,
          created_at: msg.created_at,
          updated_at: msg.updated_at,
          media_url: msg.media_url,
          payload: msg.payload,
          senderName: 'Unknown User',
          senderAvatar: '👤',
          isTranslationVisible: false,
          audio_url: msg.type === 'voice' ? msg.media_url : undefined,
          duration: msg.type === 'voice' && msg.payload?.duration ? msg.payload.duration : undefined,
          translated_content: msg.payload?.translated_content || undefined,
        }));
        setMessages(transformedMessages);
        return;
      }

      // Transform the data to match our interface
      const transformedMessages: Message[] = messagesData.map(msg => {
        const profile = profilesData?.find(p => p.id === msg.sender_id);
        return {
          id: msg.id,
          text: msg.text,
          sender_id: msg.sender_id,
          conversation_id: msg.conversation_id,
          type: msg.type,
          created_at: msg.created_at,
          updated_at: msg.updated_at,
          media_url: msg.media_url,
          payload: msg.payload,
          senderName: profile?.full_name || 'Unknown User',
          senderAvatar: profile?.avatar_url ? '👤' : '👤',
          isTranslationVisible: false,
          // For voice messages, derive audio_url and duration from media_url and payload
          audio_url: msg.type === 'voice' ? msg.media_url : undefined,
          duration: msg.type === 'voice' && msg.payload?.duration ? msg.payload.duration : undefined,
          translated_content: msg.payload?.translated_content || undefined,
        };
      });

      setMessages(transformedMessages);
    } catch (error) {
      console.error('Error in fetchMessages:', error);
    }
  }, [group.id]);

  // Fetch group members
  const fetchGroupMembers = useCallback(async () => {
    if (!group.id) return;

    try {
      // First get the conversation members
      const { data: membersData, error: membersError } = await supabase
        .from('conversation_members')
        .select('*')
        .eq('conversation_id', group.id);

      if (membersError) {
        console.error('Error fetching group members:', membersError);
        return;
      }

      if (!membersData || membersData.length === 0) {
        console.log('No members found for this group yet');
        setGroupMembers([]);
        return;
      }

      // Get user IDs from members
      const userIds = membersData.map(member => member.user_id);

      // Fetch user profiles separately
      const { data: profilesData, error: profilesError } = await supabase
        .from('profiles')
        .select('id, full_name, username, avatar_url, primary_language')
        .in('id', userIds);

      if (profilesError) {
        console.error('Error fetching user profiles:', profilesError);
        // Still set members without profile data
        const transformedMembers: GroupMember[] = membersData.map(member => ({
          id: member.conversation_id + '_' + member.user_id, // Create a unique ID
          user_id: member.user_id,
          conversation_id: member.conversation_id,
          role: member.role,
          joined_at: member.joined_at,
          full_name: 'Unknown User',
          username: 'user',
          avatar_url: undefined,
          primary_language: 'English',
        }));
        setGroupMembers(transformedMembers);
        return;
      }

      // Transform the data to match our interface
      const transformedMembers: GroupMember[] = membersData.map(member => {
        const profile = profilesData?.find(p => p.id === member.user_id);
        return {
          id: member.conversation_id + '_' + member.user_id, // Create a unique ID
          user_id: member.user_id,
          conversation_id: member.conversation_id,
          role: member.role,
          joined_at: member.joined_at,
          full_name: profile?.full_name || 'Unknown User',
          username: profile?.username || 'user',
          avatar_url: profile?.avatar_url,
          primary_language: profile?.primary_language || 'English',
        };
      });

      setGroupMembers(transformedMembers);
    } catch (error) {
      console.error('Error in fetchGroupMembers:', error);
    }
  }, [group.id]);

  // Load initial data
  useEffect(() => {
    const loadData = async () => {
      setIsLoading(true);
      await Promise.all([fetchMessages(), fetchGroupMembers()]);
      setIsLoading(false);
    };

    loadData();
  }, [fetchMessages, fetchGroupMembers]);

  // Set up real-time subscriptions
  useEffect(() => {
    if (!group.id) return;

    console.log('Setting up real-time subscription for group:', group.id);

    const channel = supabase
      .channel(`group-chat-${group.id}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'messages',
          filter: `conversation_id=eq.${group.id}`
        },
        async (payload) => {
          console.log('New message received:', payload);

          // If it's our own message, don't add it again (we already added it optimistically)
          if (payload.new.sender_id === user?.id) {
            console.log('Skipping own message in real-time update');
            return;
          }

          // Get the sender's profile for the new message
          try {
            const { data: profileData, error: profileError } = await supabase
              .from('profiles')
              .select('id, full_name, username, avatar_url, primary_language')
              .eq('id', payload.new.sender_id)
              .single();

            if (profileError) {
              console.error('Error fetching sender profile for real-time message:', profileError);
            }

            // Create the new message object
            const newMessage: Message = {
              id: payload.new.id,
              text: payload.new.text,
              sender_id: payload.new.sender_id,
              conversation_id: payload.new.conversation_id,
              type: payload.new.type,
              created_at: payload.new.created_at,
              updated_at: payload.new.updated_at,
              media_url: payload.new.media_url,
              payload: payload.new.payload,
              senderName: profileData?.full_name || 'Unknown User',
              senderAvatar: profileData?.avatar_url ? '👤' : '👤',
              isTranslationVisible: false,
              audio_url: payload.new.type === 'voice' ? payload.new.media_url : undefined,
              duration: payload.new.type === 'voice' && payload.new.payload?.duration ? payload.new.payload.duration : undefined,
              translated_content: payload.new.payload?.translated_content || undefined,
            };

            // Add the new message to the state
            setMessages(prev => [...prev, newMessage]);

            // Scroll to bottom
            setTimeout(() => {
              scrollViewRef.current?.scrollToEnd({ animated: true });
            }, 100);

          } catch (error) {
            console.error('Error processing real-time message:', error);
            // Fallback to refetching messages
            fetchMessages();
          }
        }
      )
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'conversation_members',
          filter: `conversation_id=eq.${group.id}`
        },
        () => {
          console.log('New member joined');
          fetchGroupMembers();
        }
      )
      .on(
        'postgres_changes',
        {
          event: 'DELETE',
          schema: 'public',
          table: 'conversation_members',
          filter: `conversation_id=eq.${group.id}`
        },
        () => {
          console.log('Member left');
          fetchGroupMembers();
        }
      )
      .subscribe();

    // Add a fallback periodic refresh (every 30 seconds) to catch missed messages
    const refreshInterval = setInterval(() => {
      console.log('Periodic refresh of messages');
      fetchMessages();
    }, 30000);

    return () => {
      channel.unsubscribe();
      clearInterval(refreshInterval);
    };
  }, [group.id, fetchMessages, fetchGroupMembers]);

  // Refresh messages when screen comes into focus
  useFocusEffect(
    useCallback(() => {
      console.log('Screen focused, refreshing messages');
      fetchMessages();
    }, [fetchMessages])
  );

  useEffect(() => {
    navigation.setOptions({
      headerShown: true,
      headerTitle: () => (
        <View style={styles.headerTitleContainer}>
          <View style={styles.headerAvatar}>
            <Text style={styles.headerAvatarText}>{group.avatar}</Text>
          </View>
          <View>
            <Text style={styles.headerName}>{group.name}</Text>
            <Text style={styles.headerStatus}>
              {groupMembers.length} members • {group.language}
            </Text>
          </View>
        </View>
      ),
      headerRight: () => (
        <View style={styles.headerActions}>
          <TouchableOpacity
            style={styles.headerButton}
            onPress={() => navigation.navigate('GroupCall', { group })}
          >
            <Ionicons name="call" size={24} color="#FF8A00" />
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.headerButton}
            onPress={() => navigation.navigate('GroupCall', { group })}
          >
            <Ionicons name="videocam" size={24} color="#FF8A00" />
          </TouchableOpacity>
          <TouchableOpacity style={styles.headerButton}>
            <Ionicons name="people" size={24} color="#FF8A00" />
          </TouchableOpacity>
          <TouchableOpacity style={styles.headerButton}>
            <Ionicons name="ellipsis-horizontal" size={24} color="#FF8A00" />
          </TouchableOpacity>
        </View>
      ),
      headerStyle: {
        backgroundColor: '#FFFFFF',
      },
      headerShadowVisible: true,
      headerTintColor: '#FF8A00',
    });
  }, [navigation, group, groupMembers.length]);

  useEffect(() => {
    // Animate typing dots
    if (typingUsers.length > 0) {
      const animateTypingDots = () => {
        const createAnimation = (animValue: Animated.Value, delay: number) => {
          return Animated.loop(
            Animated.sequence([
              Animated.timing(animValue, {
                toValue: 1,
                duration: 400,
                delay,
                useNativeDriver: true,
              }),
              Animated.timing(animValue, {
                toValue: 0.3,
                duration: 400,
                useNativeDriver: true,
              }),
            ])
          );
        };

        Animated.parallel([
          createAnimation(dot1Anim, 0),
          createAnimation(dot2Anim, 200),
          createAnimation(dot3Anim, 400),
        ]).start();
      };

      animateTypingDots();

      const timer = setTimeout(() => {
        setTypingUsers([]);
        // Simulate receiving a message
        const responses = [
          {
            text: 'Das ist eine großartige Idee!',
            translatedText: 'That\'s a great idea!',
            sender: 'user3',
            senderName: 'Hans',
            senderAvatar: '👨‍🏫',
          },
          {
            text: 'Je suis d\'accord! Continuons.',
            translatedText: 'I agree! Let\'s continue.',
            sender: 'user1',
            senderName: 'Marie',
            senderAvatar: '👩‍🎨',
          }
        ];

        const randomResponse = responses[Math.floor(Math.random() * responses.length)];
        const response: Message = {
          id: Date.now().toString(),
          text: randomResponse.text,
          sender_id: randomResponse.sender,
          conversation_id: group.id,
          type: 'text',
          created_at: new Date().toISOString(),
          senderName: randomResponse.senderName,
          senderAvatar: randomResponse.senderAvatar,
          isTranslationVisible: false,
          translated_content: randomResponse.translatedText,
        };

        setMessages(prev => [...prev, response]);
        setTimeout(() => {
          scrollViewRef.current?.scrollToEnd({ animated: true });
        }, 100);
      }, 3000);

      return () => clearTimeout(timer);
    }
  }, [typingUsers.length, dot1Anim, dot2Anim, dot3Anim]);

  const sendMessage = async () => {
    if (!newMessage.trim() || !user?.id || isSending) return;

    setIsSending(true);
    const messageText = newMessage.trim();

    // Create optimistic message for immediate UI update
    const optimisticMessage: Message = {
      id: `temp-${Date.now()}`, // Temporary ID
      text: messageText,
      sender_id: user.id,
      conversation_id: group.id,
      type: 'text',
      created_at: new Date().toISOString(),
      senderName: 'You',
      senderAvatar: '👤',
      isTranslationVisible: false,
    };

    // Add optimistic message to state immediately
    setMessages(prev => [...prev, optimisticMessage]);

    // Clear input immediately
    setNewMessage('');

    // Scroll to bottom immediately
    setTimeout(() => {
      scrollViewRef.current?.scrollToEnd({ animated: true });
    }, 100);

    try {
      // Send message to database
      const { data, error } = await supabase
        .from('messages')
        .insert({
          conversation_id: group.id,
          sender_id: user.id,
          text: messageText,
          type: 'text',
        })
        .select()
        .single();

      if (error) {
        console.error('Error sending message:', error);

        // Remove optimistic message on error
        setMessages(prev => prev.filter(msg => msg.id !== optimisticMessage.id));

        Alert.alert('Error', 'Failed to send message. Please try again.');
        return;
      }

      // Replace optimistic message with real message
      setMessages(prev => prev.map(msg =>
        msg.id === optimisticMessage.id
          ? {
              ...data,
              senderName: 'You',
              senderAvatar: '👤',
              isTranslationVisible: false,
            } as Message
          : msg
      ));

    } catch (error) {
      console.error('Error in sendMessage:', error);

      // Remove optimistic message on error
      setMessages(prev => prev.filter(msg => msg.id !== optimisticMessage.id));

      Alert.alert('Error', 'Failed to send message. Please try again.');
    } finally {
      setIsSending(false);
    }
  };

  const toggleTranslation = (messageId: string) => {
    setMessages(messages.map(msg =>
      msg.id === messageId
        ? { ...msg, isTranslationVisible: !msg.isTranslationVisible }
        : msg
    ));
  };

  const startVoiceRecording = () => {
    setIsRecording(true);
    Alert.alert(
      'Voice Recording',
      'Recording started... Your message will be translated for all group members!',
      [
        {
          text: 'Stop Recording',
          onPress: stopVoiceRecording,
        }
      ]
    );
  };

  const stopVoiceRecording = () => {
    setIsRecording(false);

    const voiceMessage: Message = {
      id: Date.now().toString(),
      sender_id: user?.id || '',
      conversation_id: group.id,
      type: 'voice',
      created_at: new Date().toISOString(),
      senderName: 'You',
      senderAvatar: '👤',
      isTranslationVisible: false,
      media_url: 'mock-audio-url', // Mock audio URL
      payload: {
        duration: 8,
        translated_content: `[Auto-translated to ${group.language}]`
      },
      duration: 8, // 8 seconds as a number
      translated_content: `[Auto-translated to ${group.language}]`,
    };

    setMessages([...messages, voiceMessage]);
    setTypingUsers(['user2']); // Simulate response

    setTimeout(() => {
      scrollViewRef.current?.scrollToEnd({ animated: true });
    }, 100);
  };

  const playVoiceMessage = (messageId: string) => {
    Alert.alert(
      'Playing Voice Message',
      'Voice message would play here with real-time translation overlay for all languages!'
    );
  };

  const renderMessage = (message: Message) => {
    const isMe = message.sender_id === user?.id;
    const timestamp = new Date(message.created_at).toLocaleTimeString([], {
      hour: '2-digit',
      minute: '2-digit'
    });

    return (
      <View key={message.id} style={[
        styles.messageContainer,
        isMe ? styles.myMessageContainer : styles.theirMessageContainer
      ]}>
        {!isMe && (
          <View style={styles.senderInfo}>
            <Text style={styles.senderAvatar}>{message.senderAvatar}</Text>
            <Text style={styles.senderName}>{message.senderName}</Text>
          </View>
        )}

        <TouchableOpacity
          style={[
            styles.messageBubble,
            isMe ? styles.myMessageBubble : styles.theirMessageBubble
          ]}
          onPress={() => message.translated_content && toggleTranslation(message.id)}
          activeOpacity={0.8}
        >
          {message.type === 'voice' ? (
            <TouchableOpacity
              style={styles.voiceMessageContent}
              onPress={() => playVoiceMessage(message.id)}
            >
              <Ionicons
                name="play-circle"
                size={32}
                color={isMe ? "#FFFFFF" : "#FF8A00"}
              />
              <View style={styles.voiceMessageInfo}>
                <Text style={[
                  styles.voiceMessageText,
                  isMe ? styles.myMessageText : styles.theirMessageText
                ]}>
                  Voice Message
                </Text>
                <Text style={[
                  styles.voiceMessageDuration,
                  isMe ? styles.myMessageText : styles.theirMessageText
                ]}>
                  {message.duration ? `${Math.floor(message.duration / 60)}:${(message.duration % 60).toString().padStart(2, '0')}` : '0:00'}
                </Text>
              </View>
              <View style={styles.waveformContainer}>
                {[1, 2, 3, 4, 5].map((bar) => (
                  <View
                    key={bar}
                    style={[
                      styles.waveformBar,
                      {
                        height: Math.random() * 20 + 10,
                        backgroundColor: isMe ? "#FFFFFF" : "#FF8A00"
                      }
                    ]}
                  />
                ))}
              </View>
            </TouchableOpacity>
          ) : (
            <Text style={[
              styles.messageText,
              isMe ? styles.myMessageText : styles.theirMessageText
            ]}>
              {message.text}
            </Text>
          )}

          {message.translated_content && (showTranslations || message.isTranslationVisible) && (
            <View style={styles.translationContainer}>
              <Text style={[
                styles.translationText,
                isMe ? styles.myTranslationText : styles.theirTranslationText
              ]}>
                🔄 {message.translated_content}
              </Text>
            </View>
          )}

          <Text style={[
            styles.messageTimestamp,
            isMe ? styles.myTimestamp : styles.theirTimestamp
          ]}>
            {timestamp}
          </Text>
        </TouchableOpacity>
      </View>
    );
  };

  const renderTypingIndicator = () => {
    if (typingUsers.length === 0) return null;

    return (
      <View style={styles.typingContainer}>
        <View style={styles.typingBubble}>
          <View style={styles.typingDots}>
            <Animated.View style={[styles.typingDot, { opacity: dot1Anim }]} />
            <Animated.View style={[styles.typingDot, { opacity: dot2Anim }]} />
            <Animated.View style={[styles.typingDot, { opacity: dot3Anim }]} />
          </View>
        </View>
        <Text style={styles.typingText}>
          {typingUsers.length === 1
            ? `Someone is typing...`
            : `${typingUsers.length} people are typing...`
          }
        </Text>
      </View>
    );
  };

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor="#FFFFFF" />

      {/* Translation Toggle */}
      <View style={[styles.translationToggle, { paddingTop: insets.top + 12 }]}>
        <TouchableOpacity
          style={styles.translationButton}
          onPress={() => setShowTranslations(!showTranslations)}
        >
          <Ionicons
            name={showTranslations ? "language" : "language-outline"}
            size={16}
            color="#10B981"
          />
          <Text style={styles.translationButtonText}>
            {showTranslations ? 'Hide Translations' : 'Show Translations'}
          </Text>
        </TouchableOpacity>

        <View style={styles.languageIndicator}>
          <Text style={styles.languageIndicatorText}>
            Multi-language • {group.language}
          </Text>
        </View>
      </View>

      {/* Messages */}
      <ScrollView
        ref={scrollViewRef}
        style={styles.messagesContainer}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.messagesContent}
      >
        {isLoading ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color="#FF8A00" />
            <Text style={styles.loadingText}>Loading messages...</Text>
          </View>
        ) : (
          <>
            {messages.map(renderMessage)}
            {renderTypingIndicator()}
          </>
        )}
      </ScrollView>

      {/* Input Area */}
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={[styles.inputContainer, { paddingBottom: insets.bottom + 12 }]}
      >
        <View style={styles.inputRow}>
          <TouchableOpacity style={styles.attachButton}>
            <Ionicons name="add" size={24} color="#999" />
          </TouchableOpacity>

          <View style={styles.textInputContainer}>
            <TextInput
              style={styles.textInput}
              placeholder={`Type in your language... (translates to ${group.language} for group)`}
              value={newMessage}
              onChangeText={setNewMessage}
              multiline
              maxLength={500}
              placeholderTextColor="#999"
            />
            {newMessage.length > 0 && (
              <Text style={styles.characterCount}>
                {newMessage.length}/500
              </Text>
            )}
          </View>

          {newMessage.trim() ? (
            <TouchableOpacity
              style={[styles.sendButton, isSending && styles.sendingButton]}
              onPress={sendMessage}
              disabled={isSending}
            >
              {isSending ? (
                <ActivityIndicator size="small" color="#FFFFFF" />
              ) : (
                <Ionicons name="send" size={20} color="#FFFFFF" />
              )}
            </TouchableOpacity>
          ) : (
            <TouchableOpacity
              style={[styles.voiceButton, isRecording && styles.recordingButton]}
              onPressIn={startVoiceRecording}
              onPressOut={stopVoiceRecording}
            >
              <Ionicons
                name={isRecording ? "stop" : "mic"}
                size={20}
                color="#FFFFFF"
              />
            </TouchableOpacity>
          )}
        </View>

        <View style={styles.inputHint}>
          <Ionicons name="information-circle" size={12} color="#10B981" />
          <Text style={styles.inputHintText}>
            Messages are translated for all {group.members} group members
          </Text>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8F9FA',
  },
  headerTitleContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  headerAvatar: {
    width: 35,
    height: 35,
    borderRadius: 17.5,
    backgroundColor: '#F3F4F6',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 10,
  },
  headerAvatarText: {
    fontSize: 18,
  },
  headerName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1F2937',
  },
  headerStatus: {
    fontSize: 12,
    color: '#10B981',
  },
  headerActions: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  headerButton: {
    marginLeft: 15,
  },
  translationToggle: {
    backgroundColor: '#FFFFFF',
    paddingHorizontal: width * 0.05,
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E5E5',
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  translationButton: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  translationButtonText: {
    marginLeft: 6,
    fontSize: 12,
    color: '#10B981',
    fontWeight: '500',
  },
  languageIndicator: {
    backgroundColor: '#FEF3E2',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  languageIndicatorText: {
    fontSize: 10,
    color: '#D97706',
    fontWeight: '500',
  },
  messagesContainer: {
    flex: 1,
  },
  messagesContent: {
    paddingHorizontal: width * 0.05,
    paddingVertical: 10,
  },
  messageContainer: {
    marginBottom: 16,
  },
  myMessageContainer: {
    alignItems: 'flex-end',
  },
  theirMessageContainer: {
    alignItems: 'flex-start',
  },
  senderInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
    paddingHorizontal: 4,
  },
  senderAvatar: {
    fontSize: 14,
    marginRight: 6,
  },
  senderName: {
    fontSize: 12,
    fontWeight: '600',
    color: '#6B7280',
  },
  messageBubble: {
    maxWidth: '80%',
    borderRadius: 18,
    paddingHorizontal: 16,
    paddingVertical: 12,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
  },
  myMessageBubble: {
    backgroundColor: '#FF8A00',
  },
  theirMessageBubble: {
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E5E5E5',
  },
  messageText: {
    fontSize: 16,
    lineHeight: 20,
  },
  myMessageText: {
    color: '#FFFFFF',
  },
  theirMessageText: {
    color: '#1F2937',
  },
  voiceMessageContent: {
    flexDirection: 'row',
    alignItems: 'center',
    minWidth: 180,
  },
  voiceMessageInfo: {
    marginLeft: 10,
    flex: 1,
  },
  voiceMessageText: {
    fontSize: 14,
    fontWeight: '500',
  },
  voiceMessageDuration: {
    fontSize: 12,
    opacity: 0.8,
    marginTop: 2,
  },
  waveformContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginLeft: 10,
  },
  waveformBar: {
    width: 2,
    marginHorizontal: 1,
    borderRadius: 1,
  },
  translationContainer: {
    marginTop: 8,
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: 'rgba(255, 255, 255, 0.3)',
  },
  translationText: {
    fontSize: 14,
    fontStyle: 'italic',
    lineHeight: 18,
  },
  myTranslationText: {
    color: 'rgba(255, 255, 255, 0.9)',
  },
  theirTranslationText: {
    color: '#6B7280',
  },
  messageTimestamp: {
    fontSize: 11,
    marginTop: 6,
    alignSelf: 'flex-end',
  },
  myTimestamp: {
    color: 'rgba(255, 255, 255, 0.7)',
  },
  theirTimestamp: {
    color: '#9CA3AF',
  },
  typingContainer: {
    alignItems: 'flex-start',
    marginBottom: 16,
  },
  typingBubble: {
    backgroundColor: '#FFFFFF',
    borderRadius: 18,
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderWidth: 1,
    borderColor: '#E5E5E5',
  },
  typingDots: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  typingDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#9CA3AF',
    marginHorizontal: 2,
  },
  typingText: {
    fontSize: 12,
    color: '#9CA3AF',
    marginTop: 4,
    fontStyle: 'italic',
  },
  inputContainer: {
    backgroundColor: '#FFFFFF',
    borderTopWidth: 1,
    borderTopColor: '#E5E5E5',
    paddingHorizontal: width * 0.05,
    paddingTop: 12,
    paddingBottom: 8,
  },
  inputRow: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    marginBottom: 8,
  },
  attachButton: {
    padding: 8,
    marginRight: 8,
  },
  textInputContainer: {
    flex: 1,
    position: 'relative',
  },
  textInput: {
    borderWidth: 1,
    borderColor: '#E5E5E5',
    borderRadius: 20,
    paddingHorizontal: 16,
    paddingVertical: 10,
    fontSize: 16,
    maxHeight: 100,
    marginRight: 8,
    backgroundColor: '#F8F9FA',
  },
  characterCount: {
    position: 'absolute',
    bottom: -15,
    right: 20,
    fontSize: 10,
    color: '#9CA3AF',
  },
  sendButton: {
    backgroundColor: '#FF8A00',
    borderRadius: 20,
    padding: 12,
    justifyContent: 'center',
    alignItems: 'center',
    elevation: 2,
    shadowColor: '#FF8A00',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
  },
  voiceButton: {
    backgroundColor: '#10B981',
    borderRadius: 20,
    padding: 12,
    justifyContent: 'center',
    alignItems: 'center',
    elevation: 2,
    shadowColor: '#10B981',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
  },
  recordingButton: {
    backgroundColor: '#EF4444',
    shadowColor: '#EF4444',
  },
  inputHint: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 4,
  },
  inputHintText: {
    marginLeft: 4,
    fontSize: 10,
    color: '#10B981',
    fontStyle: 'italic',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 60,
  },
  loadingText: {
    marginTop: 12,
    fontSize: 16,
    color: '#6B7280',
    fontWeight: '500',
  },
  sendingButton: {
    opacity: 0.7,
  },
});

export default GroupChatScreen;