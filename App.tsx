// App.tsx - Updated with new navigation routes
import React, { useState } from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { View, TouchableOpacity, Modal, Text, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';

// Import all screens
import WelcomeScreen from './src/screens/WelcomeScreen';
import SignUpScreen from './src/screens/SignUpScreen';
import SignInScreen from './src/screens/SignInScreen';
import EnhancedHomeScreen from './src/screens/EnhancedHomeScreen';
import RecordVoiceScreen from './src/screens/RecordVoiceScreen';
import TellStoryScreen from './src/screens/TellStoryScreen';
import LibraryScreen from './src/screens/LibraryScreen';
import RewardsScreen from './src/screens/RewardsScreen';
import ProfileScreen from './src/screens/ProfileScreen';
import SettingsScreen from './src/screens/SettingsScreen';
import ValidationScreen from './src/screens/ValidationScreen';

// Import new Chat screens
import ChatListScreen from './src/screens/ChatListScreen';
import ChatDetailScreen from './src/screens/ChatDetailScreen';
import GroupChatScreen from './src/screens/GroupChatScreen';
import VoiceCallScreen from './src/screens/VoiceCallScreen';
import VideoCallScreen from './src/screens/VideoCallScreen';
import GroupCallScreen from './src/screens/GroupCallScreen';

// Import new feature screens
import TurnVerseScreen from './src/screens/TurnVerseScreen';
import LiveStreamingScreen from './src/screens/LiveStreamingScreen';
import ContactDiscoveryScreen from './src/screens/ContactDiscoveryScreen';

// Import navigation types
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import type { BottomTabScreenProps } from '@react-navigation/bottom-tabs';

// Define shared contact interface
interface Contact {
  id: string;
  name: string;
  username: string;
  avatar: string;
  language: string;
  isOnline: boolean;
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
  user: Contact;
  thumbnail: string;
  timestamp: string;
  viewed: boolean;
}

export type RootStackParamList = {
  Welcome: undefined;
  SignUp: undefined;
  SignIn: undefined;
  MainTabs: undefined;
  RecordVoice: {
    mode?: 'record' | 'upload';
    isRemix?: boolean;
    isDuet?: boolean;
    originalClip?: {
      id: string;
      phrase: string;
      user: string;
      language: string;
    };
  } | undefined;
  RecordVideo: {
    mode?: 'record' | 'upload';
    isRemix?: boolean;
    isDuet?: boolean;
    originalClip?: {
      id: string;
      phrase: string;
      user: string;
      language: string;
    };
  } | undefined;
  TellStory: undefined;
  Settings: undefined;
  Validation: {
    clipId?: string;
    language?: string;
  } | undefined;
  
  // Chat routes
  ChatDetail: {
    contact: Contact;
  };
  VoiceCall: {
    contact: Contact;
  };
  VideoCall: {
    contact: Contact;
  };
  GroupChat: {
    group: Group;
  };
  GroupCall: {
    group: Group;
  };
  
  // New feature routes
  TurnVerse: undefined;
  WordChain: undefined;
  StartLive: undefined;
  LiveStream: {
    isHost?: boolean;
    roomId?: string;
  };
  CreateGroup: undefined;
  CreateStory: undefined;
  StoryView: {
    story: Story;
  };
  ContactDiscovery: undefined;
  UserProfile: {
    user: Contact;
  };
};

export type TabParamList = {
  Home: undefined;
  Library: undefined;
  Create: undefined;
  Chat: undefined;
  Profile: undefined;
};

// Export navigation prop types for use in components
export type RootStackScreenProps<T extends keyof RootStackParamList> = 
  NativeStackScreenProps<RootStackParamList, T>;

export type TabScreenProps<T extends keyof TabParamList> = 
  BottomTabScreenProps<TabParamList, T>;

const Stack = createNativeStackNavigator<RootStackParamList>();
const Tab = createBottomTabNavigator<TabParamList>();

// Create a context for the modal
const CreateModalContext = React.createContext<{
  showCreateModal: boolean;
  setShowCreateModal: (show: boolean) => void;
}>({
  showCreateModal: false,
  setShowCreateModal: () => {},
});

// Empty component for Create tab since we're using modal
const CreateComponent = () => {
  return <View />;
};

// Enhanced Create Modal Component
const CreateModal = () => {
  const navigation = useNavigation<any>();
  const { showCreateModal, setShowCreateModal } = React.useContext(CreateModalContext);

  return (
    <Modal
      visible={showCreateModal}
      transparent
      animationType="fade"
      onRequestClose={() => setShowCreateModal(false)}
    >
      <View style={styles.modalOverlay}>
        <TouchableOpacity 
          style={styles.modalBackground}
          onPress={() => setShowCreateModal(false)}
        />
        <View style={styles.createModalContent}>
          <Text style={styles.createModalTitle}>What would you like to create?</Text>
          
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
};

const MainTabs = () => {
  const [showCreateModal, setShowCreateModal] = useState(false);

  return (
    <CreateModalContext.Provider value={{ showCreateModal, setShowCreateModal }}>
      <Tab.Navigator
        screenOptions={({ route }) => ({
          headerShown: false,
          tabBarIcon: ({ focused, color, size }) => {
            let iconName: keyof typeof Ionicons.glyphMap;

            if (route.name === 'Home') {
              iconName = focused ? 'home' : 'home-outline';
            } else if (route.name === 'Library') {
              iconName = focused ? 'library' : 'library-outline';
            } else if (route.name === 'Create') {
              iconName = 'add';
            } else if (route.name === 'Chat') {
              iconName = focused ? 'chatbubbles' : 'chatbubbles-outline';
            } else if (route.name === 'Profile') {
              iconName = focused ? 'person' : 'person-outline';
            } else {
              iconName = 'home-outline';
            }

            if (route.name === 'Create') {
              return (
                <View style={styles.createTabIcon}>
                  <Ionicons name={iconName} size={24} color="white" />
                </View>
              );
            }

            return <Ionicons name={iconName} size={size} color={color} />;
          },
          tabBarActiveTintColor: '#FF8A00',
          tabBarInactiveTintColor: '#999',
          tabBarStyle: {
            backgroundColor: '#FFFFFF',
            borderTopColor: '#E5E5E5',
            height: 80,
            paddingBottom: 20,
            paddingTop: 10,
          },
          tabBarLabelStyle: {
            fontSize: 12,
            fontWeight: '500',
          },
        })}
        screenListeners={({ navigation }) => ({
          tabPress: (e) => {
            if (e.target?.includes('Create')) {
              e.preventDefault();
              setShowCreateModal(true);
            }
          },
        })}
      >
        <Tab.Screen 
          name="Home" 
          component={EnhancedHomeScreen}
          options={{ tabBarLabel: 'Home' }}
        />
        <Tab.Screen 
          name="Library" 
          component={LibraryScreen}
          options={{ tabBarLabel: 'Library' }}
        />
        <Tab.Screen 
          name="Create" 
          component={CreateComponent}
          options={{ 
            tabBarLabel: '',
          }}
        />
        <Tab.Screen 
          name="Chat" 
          component={ChatListScreen}
          options={{ 
            tabBarLabel: 'Chat',
            tabBarBadge: 3, // Show unread messages count
          }}
        />
        <Tab.Screen 
          name="Profile" 
          component={ProfileScreen}
          options={{ tabBarLabel: 'Profile' }}
        />
      </Tab.Navigator>
      <CreateModal />
    </CreateModalContext.Provider>
  );
};

export default function App() {
  return (
    <NavigationContainer>
      <Stack.Navigator
        initialRouteName="Welcome"
        screenOptions={{
          headerShown: false,
        }}
      >
        {/* Authentication Screens */}
        <Stack.Screen 
          name="Welcome" 
          component={WelcomeScreen}
          options={{
            gestureEnabled: false,
          }}
        />
        <Stack.Screen 
          name="SignUp" 
          component={SignUpScreen}
          options={{
            animation: 'slide_from_right',
          }}
        />
        <Stack.Screen 
          name="SignIn" 
          component={SignInScreen}
          options={{
            animation: 'slide_from_right',
          }}
        />

        {/* Main App */}
        <Stack.Screen 
          name="MainTabs" 
          component={MainTabs}
          options={{
            gestureEnabled: false,
            animation: 'fade',
          }}
        />

        {/* Content Creation Screens */}
        <Stack.Screen 
          name="RecordVoice" 
          component={RecordVoiceScreen}
          options={{
            animation: 'slide_from_bottom',
            presentation: 'modal',
          }}
        />
        <Stack.Screen 
          name="RecordVideo" 
          component={RecordVoiceScreen} // You can create a separate RecordVideoScreen
          options={{
            animation: 'slide_from_bottom',
            presentation: 'modal',
          }}
        />
        <Stack.Screen 
          name="TellStory" 
          component={TellStoryScreen}
          options={{
            animation: 'slide_from_bottom',
            presentation: 'modal',
          }}
        />

        {/* Validation Screen */}
        <Stack.Screen 
          name="Validation" 
          component={ValidationScreen}
          options={{
            animation: 'slide_from_right',
          }}
        />

        {/* Settings Screen */}
        <Stack.Screen 
          name="Settings" 
          component={SettingsScreen}
          options={{
            animation: 'slide_from_right',
          }}
        />

        {/* Chat Screens */}
        <Stack.Screen 
          name="ChatDetail" 
          component={ChatDetailScreen}
          options={{
            animation: 'slide_from_right',
            headerShown: true,
          }}
        />
        <Stack.Screen 
          name="GroupChat" 
          component={GroupChatScreen}
          options={{
            animation: 'slide_from_right',
            headerShown: true,
          }}
        />
        <Stack.Screen 
          name="VoiceCall" 
          component={VoiceCallScreen}
          options={{
            animation: 'slide_from_bottom',
            presentation: 'fullScreenModal',
            headerShown: false,
          }}
        />
        <Stack.Screen 
          name="VideoCall" 
          component={VideoCallScreen}
          options={{
            animation: 'slide_from_bottom',
            presentation: 'fullScreenModal',
            headerShown: false,
          }}
        />
        <Stack.Screen 
          name="GroupCall" 
          component={GroupCallScreen}
          options={{
            animation: 'slide_from_bottom',
            presentation: 'fullScreenModal',
            headerShown: false,
          }}
        />

        {/* Games and Entertainment */}
        <Stack.Screen 
          name="TurnVerse" 
          component={TurnVerseScreen}
          options={{
            animation: 'slide_from_right',
            headerShown: false,
          }}
        />
        <Stack.Screen 
          name="WordChain" 
          component={TurnVerseScreen} // Can reuse or create separate WordChainScreen
          options={{
            animation: 'slide_from_right',
            headerShown: false,
          }}
        />

        {/* Live Streaming */}
        <Stack.Screen 
          name="StartLive" 
          component={LiveStreamingScreen}
          options={{
            animation: 'slide_from_bottom',
            presentation: 'modal',
            headerShown: false,
          }}
        />
        <Stack.Screen 
          name="LiveStream" 
          component={LiveStreamingScreen}
          options={{
            animation: 'slide_from_bottom',
            presentation: 'fullScreenModal',
            headerShown: false,
          }}
        />

        {/* Social Features */}
        <Stack.Screen 
          name="ContactDiscovery" 
          component={ContactDiscoveryScreen}
          options={{
            animation: 'slide_from_right',
          }}
        />
        <Stack.Screen 
          name="UserProfile" 
          component={ProfileScreen} // Can reuse or create separate UserProfileScreen
          options={{
            animation: 'slide_from_right',
          }}
        />

        {/* Story Features */}
        <Stack.Screen 
          name="CreateStory" 
          component={TellStoryScreen} // Can reuse or create separate CreateStoryScreen
          options={{
            animation: 'slide_from_bottom',
            presentation: 'modal',
          }}
        />
        <Stack.Screen 
          name="StoryView" 
          component={TellStoryScreen} // Can create separate StoryViewScreen
          options={{
            animation: 'fade',
            presentation: 'fullScreenModal',
            headerShown: false,
          }}
        />

        {/* Group Management */}
        <Stack.Screen 
          name="CreateGroup" 
          component={ContactDiscoveryScreen} // Can create separate CreateGroupScreen
          options={{
            animation: 'slide_from_bottom',
            presentation: 'modal',
          }}
        />
      </Stack.Navigator>
    </NavigationContainer>
  );
}

const styles = StyleSheet.create({
  createTabIcon: {
    width: 56,
    height: 56,
    borderRadius: 16,
    backgroundColor: '#FF8A00',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 20,
    shadowColor: '#FF8A00',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
  modalOverlay: {
    flex: 1,
    justifyContent: 'flex-end',
  },
  modalBackground: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
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
    borderWidth: 1,
    borderColor: '#E5E7EB',
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
    lineHeight: 18,
  },
});