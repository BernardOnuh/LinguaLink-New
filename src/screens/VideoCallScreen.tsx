// src/screens/VideoCallScreen.tsx
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
  Alert,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
// Update the import to use the correct types from App.tsx
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import type { RootStackParamList } from '../../App'; // Adjust path as needed

const { width, height } = Dimensions.get('window');

// Update the Props type to use the correct navigation types
type Props = NativeStackScreenProps<RootStackParamList, 'VideoCall'>;

const VideoCallScreen: React.FC<Props> = ({ route, navigation }) => {
  const { contact } = route.params;
  const [isMuted, setIsMuted] = useState(false);
  const [isVideoOff, setIsVideoOff] = useState(false);
  const [isSpeakerOn, setIsSpeakerOn] = useState(true);
  const [callDuration, setCallDuration] = useState(0);
  const [isConnected, setIsConnected] = useState(false);
  
  // Animation values
  const pulseAnim = useRef(new Animated.Value(1)).current;
  const translateAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    // Simulate call connection
    const connectionTimer = setTimeout(() => {
      setIsConnected(true);
    }, 3000);

    // Start call duration timer
    const durationTimer = setInterval(() => {
      setCallDuration(prev => prev + 1);
    }, 1000);

    // Pulse animation for avatar when not connected
    if (!isConnected) {
      const pulse = Animated.loop(
        Animated.sequence([
          Animated.timing(pulseAnim, {
            toValue: 1.1,
            duration: 1000,
            useNativeDriver: true,
          }),
          Animated.timing(pulseAnim, {
            toValue: 1,
            duration: 1000,
            useNativeDriver: true,
          }),
        ])
      );
      pulse.start();
    }

    return () => {
      clearTimeout(connectionTimer);
      clearInterval(durationTimer);
    };
  }, [isConnected, pulseAnim]);

  const formatDuration = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const endCall = () => {
    Alert.alert(
      'End Call',
      'Are you sure you want to end this video call?',
      [
        { text: 'Cancel', style: 'cancel' },
        { 
          text: 'End Call', 
          style: 'destructive',
          onPress: () => navigation.goBack()
        }
      ]
    );
  };

  const toggleMute = () => {
    setIsMuted(!isMuted);
    // Here you would implement actual mute functionality
  };

  const toggleVideo = () => {
    setIsVideoOff(!isVideoOff);
    // Here you would implement actual video toggle functionality
  };

  const toggleSpeaker = () => {
    setIsSpeakerOn(!isSpeakerOn);
    // Here you would implement actual speaker toggle functionality
  };

  const switchCamera = () => {
    // Here you would implement camera switching functionality
    Alert.alert('Camera Switched', 'Switched to front/back camera');
  };

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor="#000000" />
      
      {/* Call Status Header */}
      <View style={styles.statusHeader}>
        <View style={styles.statusInfo}>
          <Text style={styles.contactName}>{contact.name}</Text>
          <Text style={styles.callStatus}>
            {isConnected ? `Video Call • ${formatDuration(callDuration)}` : 'Connecting...'}
          </Text>
        </View>
        <TouchableOpacity 
          style={styles.minimizeButton}
          onPress={() => {
            // Here you could implement minimize functionality
            Alert.alert('Minimize', 'Video call minimized');
          }}
        >
          <Ionicons name="remove" size={20} color="#FFFFFF" />
        </TouchableOpacity>
      </View>

      {/* Video Call UI */}
      <View style={styles.videoContainer}>
        {/* Remote video area */}
        <View style={styles.remoteVideo}>
          {isConnected ? (
            // Simulated remote video feed
            <View style={styles.remoteVideoFeed}>
              <View style={styles.remoteVideoOverlay}>
                <Text style={styles.remoteVideoText}>Remote Video Feed</Text>
              </View>
            </View>
          ) : (
            // Avatar and connecting state
            <View style={styles.connectingContainer}>
              <Animated.View style={[
                styles.avatarContainer,
                { transform: [{ scale: pulseAnim }] }
              ]}>
                <Text style={styles.avatarText}>{contact.avatar}</Text>
              </Animated.View>
              <Text style={styles.connectingText}>Connecting to {contact.name}...</Text>
            </View>
          )}
        </View>

        {/* Local video preview */}
        <View style={styles.localVideo}>
          {isVideoOff ? (
            <View style={styles.videoOffContainer}>
              <Ionicons name="videocam-off" size={20} color="#FFFFFF" />
              <Text style={styles.videoOffText}>Video Off</Text>
            </View>
          ) : (
            <View style={styles.localVideoFeed}>
              <Text style={styles.localVideoText}>You</Text>
            </View>
          )}
        </View>
      </View>

      {/* Translation Status */}
      <View style={styles.translationContainer}>
        <View style={styles.translationIndicator}>
          <Ionicons name="language" size={16} color="#10B981" />
          <Text style={styles.translationText}>
            Real-time translation: Your Language ↔ {contact.language}
          </Text>
        </View>
      </View>

      {/* Call Controls */}
      <View style={styles.controlsContainer}>
        <View style={styles.controlsRow}>
          {/* Mute Button */}
          <TouchableOpacity 
            style={[
              styles.controlButton,
              isMuted && styles.activeControlButton
            ]}
            onPress={toggleMute}
          >
            <Ionicons 
              name={isMuted ? "mic-off" : "mic"} 
              size={24} 
              color="#FFFFFF" 
            />
          </TouchableOpacity>

          {/* Video Toggle Button */}
          <TouchableOpacity 
            style={[
              styles.controlButton,
              isVideoOff && styles.activeControlButton
            ]}
            onPress={toggleVideo}
          >
            <Ionicons 
              name={isVideoOff ? "videocam-off" : "videocam"} 
              size={24} 
              color="#FFFFFF" 
            />
          </TouchableOpacity>

          {/* Speaker Button */}
          <TouchableOpacity 
            style={[
              styles.controlButton,
              isSpeakerOn && styles.activeControlButton
            ]}
            onPress={toggleSpeaker}
          >
            <Ionicons 
              name={isSpeakerOn ? "volume-high" : "volume-low"} 
              size={24} 
              color="#FFFFFF" 
            />
          </TouchableOpacity>

          {/* Switch Camera Button */}
          <TouchableOpacity 
            style={styles.controlButton}
            onPress={switchCamera}
          >
            <Ionicons name="camera-reverse" size={24} color="#FFFFFF" />
          </TouchableOpacity>

          {/* End Call Button */}
          <TouchableOpacity 
            style={[styles.controlButton, styles.endCallButton]}
            onPress={endCall}
          >
            <Ionicons name="call" size={24} color="#FFFFFF" />
          </TouchableOpacity>
        </View>

        {/* Additional Controls */}
        <View style={styles.additionalControls}>
          <TouchableOpacity style={styles.additionalButton}>
            <Ionicons name="chatbubble" size={20} color="#9CA3AF" />
            <Text style={styles.additionalButtonText}>Chat</Text>
          </TouchableOpacity>
          
          <TouchableOpacity style={styles.additionalButton}>
            <Ionicons name="people" size={20} color="#9CA3AF" />
            <Text style={styles.additionalButtonText}>Add</Text>
          </TouchableOpacity>
          
          <TouchableOpacity style={styles.additionalButton}>
            <Ionicons name="ellipsis-horizontal" size={20} color="#9CA3AF" />
            <Text style={styles.additionalButtonText}>More</Text>
          </TouchableOpacity>
        </View>
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000000',
  },
  statusHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 10,
  },
  statusInfo: {
    flex: 1,
  },
  contactName: {
    fontSize: 18,
    fontWeight: '600',
    color: '#FFFFFF',
    marginBottom: 2,
  },
  callStatus: {
    fontSize: 14,
    color: '#10B981',
  },
  minimizeButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  videoContainer: {
    flex: 1,
    position: 'relative',
  },
  remoteVideo: {
    flex: 1,
    backgroundColor: '#1F2937',
  },
  remoteVideoFeed: {
    flex: 1,
    backgroundColor: '#374151',
    justifyContent: 'center',
    alignItems: 'center',
  },
  remoteVideoOverlay: {
    position: 'absolute',
    top: 20,
    left: 20,
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
  },
  remoteVideoText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '500',
  },
  connectingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  avatarContainer: {
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: '#374151',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 20,
  },
  avatarText: {
    fontSize: 60,
  },
  connectingText: {
    fontSize: 18,
    color: '#D1D5DB',
    textAlign: 'center',
  },
  localVideo: {
    position: 'absolute',
    top: 40,
    right: 20,
    width: 120,
    height: 160,
    borderRadius: 12,
    overflow: 'hidden',
    borderWidth: 2,
    borderColor: '#FF8A00',
  },
  localVideoFeed: {
    flex: 1,
    backgroundColor: '#4B5563',
    justifyContent: 'flex-end',
    alignItems: 'center',
    paddingBottom: 8,
  },
  localVideoText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '500',
  },
  videoOffContainer: {
    flex: 1,
    backgroundColor: '#374151',
    justifyContent: 'center',
    alignItems: 'center',
  },
  videoOffText: {
    color: '#FFFFFF',
    fontSize: 10,
    marginTop: 4,
  },
  translationContainer: {
    paddingHorizontal: 20,
    paddingVertical: 8,
  },
  translationIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(16, 185, 129, 0.1)',
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 20,
  },
  translationText: {
    marginLeft: 8,
    fontSize: 12,
    color: '#10B981',
    fontWeight: '500',
  },
  controlsContainer: {
    paddingHorizontal: 20,
    paddingBottom: 20,
  },
  controlsRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'center',
    marginBottom: 20,
  },
  controlButton: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  activeControlButton: {
    backgroundColor: '#FF8A00',
  },
  endCallButton: {
    backgroundColor: '#EF4444',
  },
  additionalControls: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'center',
  },
  additionalButton: {
    alignItems: 'center',
    paddingVertical: 8,
  },
  additionalButtonText: {
    color: '#9CA3AF',
    fontSize: 12,
    marginTop: 4,
    fontWeight: '500',
  },
});

export default VideoCallScreen;