// src/screens/ChatDetailScreen.tsx
import React, { useState, useRef, useEffect } from 'react';
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
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
// Update these imports to use the correct types
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import type { RootStackParamList } from '../../App'; // Adjust path as needed

const { width, height } = Dimensions.get('window');

interface Message {
  id: string;
  text: string;
  translatedText?: string;
  sender: 'me' | 'them';
  timestamp: string;
  isVoiceMessage?: boolean;
  duration?: string;
  isTranslationVisible?: boolean;
}

// Update Props type to use the correct navigation types
type Props = NativeStackScreenProps<RootStackParamList, 'ChatDetail'>;

const mockMessages: Message[] = [
  {
    id: '1',
    text: 'Ndewo! Kedu ka ị mere?',
    translatedText: 'Hello! How are you doing?',
    sender: 'them',
    timestamp: '10:30 AM',
  },
  {
    id: '2',
    text: 'Hello! I\'m doing well, thank you. How about you?',
    translatedText: 'Nke ahụ dị mma! Ka anyị gaa n\'ihu.',
    sender: 'me',
    timestamp: '10:32 AM',
  },
  {
    id: '3',
    text: 'Ọ dị mma! Achọrọ m ịmụta Yoruba. Ị nwere ike inyere m aka?',
    translatedText: 'That\'s good! I want to learn Yoruba. Can you help me?',
    sender: 'them',
    timestamp: '10:35 AM',
  },
  {
    id: '4',
    text: 'Of course! I\'d be happy to help you learn Yoruba.',
    translatedText: 'N\'ezie! Ọ ga-amasị m inyere gị aka ịmụta Yoruba.',
    sender: 'me',
    timestamp: '10:36 AM',
    isVoiceMessage: true,
    duration: '0:15',
  },
  {
    id: '5',
    text: 'Daalụ! Kedu mgbe anyị ga-amalite?',
    translatedText: 'Thank you! When shall we start?',
    sender: 'them',
    timestamp: '10:38 AM',
  },
  {
    id: '6',
    text: 'We can start right now if you want. Let me teach you some basic Yoruba greetings.',
    translatedText: 'Anyị nwere ike ịmalite ugbu a ma ọ bụrụ na ịchọrọ. Ka m kuziere gị ụfọdụ ekele Yoruba ndị bụ isi.',
    sender: 'me',
    timestamp: '10:40 AM',
  },
  {
    id: '7',
    text: 'That sounds perfect! I\'m excited to learn.',
    translatedText: 'Nke ahụ dị mma! Ọ na-amasị m ịmụta.',
    sender: 'me',
    timestamp: '10:41 AM',
    isVoiceMessage: true,
    duration: '0:08',
  },
];

const ChatDetailScreen: React.FC<Props> = ({ route, navigation }) => {
  const { contact } = route.params;
  const [messages, setMessages] = useState<Message[]>(mockMessages);
  const [newMessage, setNewMessage] = useState('');
  const [showTranslations, setShowTranslations] = useState(true);
  const [isRecording, setIsRecording] = useState(false);
  const [isTyping, setIsTyping] = useState(false);
  const scrollViewRef = useRef<ScrollView>(null);

  // Animation values for typing dots
  const dot1Anim = useRef(new Animated.Value(0.3)).current;
  const dot2Anim = useRef(new Animated.Value(0.3)).current;
  const dot3Anim = useRef(new Animated.Value(0.3)).current;

  useEffect(() => {
    navigation.setOptions({
      headerShown: true,
      headerTitle: () => (
        <View style={styles.headerTitleContainer}>
          <View style={styles.headerAvatar}>
            <Text style={styles.headerAvatarText}>{contact.avatar}</Text>
            {contact.isOnline && <View style={styles.headerOnlineIndicator} />}
          </View>
          <View>
            <Text style={styles.headerName}>{contact.name}</Text>
            <Text style={styles.headerStatus}>
              {contact.isOnline ? `Speaking ${contact.language} • Online` : 'Offline'}
            </Text>
          </View>
        </View>
      ),
      headerRight: () => (
        <View style={styles.headerActions}>
          <TouchableOpacity 
            style={styles.headerButton}
            onPress={() => navigation.navigate('VoiceCall', { contact })}
          >
            <Ionicons name="call" size={24} color="#FF8A00" />
          </TouchableOpacity>
          <TouchableOpacity 
            style={styles.headerButton}
            onPress={() => navigation.navigate('VideoCall', { contact })}
          >
            <Ionicons name="videocam" size={24} color="#FF8A00" />
          </TouchableOpacity>
          <TouchableOpacity style={styles.headerButton}>
            <Ionicons name="ellipsis-horizontal" size={24} color="#FF8A00" />
          </TouchableOpacity>
        </View>
      ),
      headerStyle: {
        backgroundColor: '#FFFFFF',
      },
      headerShadowVisible: true, // This replaces elevation for React Navigation v6+
      headerTintColor: '#FF8A00',
    });
  }, [navigation, contact]);

  useEffect(() => {
    // Animate typing dots
    if (isTyping) {
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
        setIsTyping(false);
        // Simulate receiving a message
        const response: Message = {
          id: Date.now().toString(),
          text: 'Nke ahụ dị mma! Ka anyị gaa n\'ihu.',
          translatedText: 'That sounds great! Let\'s continue.',
          sender: 'them',
          timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        };
        setMessages(prev => [...prev, response]);
        setTimeout(() => {
          scrollViewRef.current?.scrollToEnd({ animated: true });
        }, 100);
      }, 3000);

      return () => clearTimeout(timer);
    }
  }, [isTyping, dot1Anim, dot2Anim, dot3Anim]);

  const sendMessage = () => {
    if (newMessage.trim()) {
      const message: Message = {
        id: Date.now().toString(),
        text: newMessage,
        translatedText: `[Auto-translated to ${contact.language}: ${newMessage}]`,
        sender: 'me',
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      };
      
      setMessages([...messages, message]);
      setNewMessage('');
      setIsTyping(true); // Simulate them typing back
      
      // Scroll to bottom
      setTimeout(() => {
        scrollViewRef.current?.scrollToEnd({ animated: true });
      }, 100);
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
      'Recording started... Speak naturally in your language and it will be translated!',
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
      text: '[Voice message in your language]',
      translatedText: `[Auto-translated to ${contact.language}]`,
      sender: 'me',
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      isVoiceMessage: true,
      duration: '0:05',
    };
    
    setMessages([...messages, voiceMessage]);
    setIsTyping(true); // Simulate response
    
    setTimeout(() => {
      scrollViewRef.current?.scrollToEnd({ animated: true });
    }, 100);
  };

  const playVoiceMessage = (messageId: string) => {
    Alert.alert(
      'Playing Voice Message',
      'Voice message would play here with real-time translation overlay!'
    );
  };

  const renderMessage = (message: Message) => {
    const isMe = message.sender === 'me';
    
    return (
      <View key={message.id} style={[
        styles.messageContainer,
        isMe ? styles.myMessageContainer : styles.theirMessageContainer
      ]}>
        <TouchableOpacity 
          style={[
            styles.messageBubble,
            isMe ? styles.myMessageBubble : styles.theirMessageBubble
          ]}
          onPress={() => message.translatedText && toggleTranslation(message.id)}
          activeOpacity={0.8}
        >
          {message.isVoiceMessage ? (
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
                  {message.duration}
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
          
          {message.translatedText && (showTranslations || message.isTranslationVisible) && (
            <View style={styles.translationContainer}>
              <Text style={[
                styles.translationText,
                isMe ? styles.myTranslationText : styles.theirTranslationText
              ]}>
                🔄 {message.translatedText}
              </Text>
            </View>
          )}
          
          <Text style={[
            styles.messageTimestamp,
            isMe ? styles.myTimestamp : styles.theirTimestamp
          ]}>
            {message.timestamp}
          </Text>
        </TouchableOpacity>
      </View>
    );
  };

  const renderTypingIndicator = () => {
    if (!isTyping) return null;
    
    return (
      <View style={styles.typingContainer}>
        <View style={styles.typingBubble}>
          <View style={styles.typingDots}>
            <Animated.View style={[styles.typingDot, { opacity: dot1Anim }]} />
            <Animated.View style={[styles.typingDot, { opacity: dot2Anim }]} />
            <Animated.View style={[styles.typingDot, { opacity: dot3Anim }]} />
          </View>
        </View>
        <Text style={styles.typingText}>{contact.name} is typing...</Text>
      </View>
    );
  };

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor="#FFFFFF" />
      
      {/* Translation Toggle */}
      <View style={styles.translationToggle}>
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
            Your Language ↔ {contact.language}
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
        {messages.map(renderMessage)}
        {renderTypingIndicator()}
      </ScrollView>

      {/* Input Area */}
      <KeyboardAvoidingView 
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.inputContainer}
      >
        <View style={styles.inputRow}>
          <TouchableOpacity style={styles.attachButton}>
            <Ionicons name="add" size={24} color="#999" />
          </TouchableOpacity>
          
          <View style={styles.textInputContainer}>
            <TextInput
              style={styles.textInput}
              placeholder={`Type in your language... (auto-translates to ${contact.language})`}
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
            <TouchableOpacity style={styles.sendButton} onPress={sendMessage}>
              <Ionicons name="send" size={20} color="#FFFFFF" />
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
            Messages are automatically translated in real-time
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
    position: 'relative',
  },
  headerAvatarText: {
    fontSize: 18,
  },
  headerOnlineIndicator: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: '#10B981',
    borderWidth: 2,
    borderColor: '#FFFFFF',
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
    paddingVertical: 12,
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
});

export default ChatDetailScreen;