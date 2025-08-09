// src/screens/RecordVoiceScreen.tsx
import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  SafeAreaView,
  StatusBar,
  Dimensions,
  Alert,
  Animated,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RootStackParamList } from '../../App';

const { width, height } = Dimensions.get('window');

type RecordVoiceScreenNavigationProp = NativeStackNavigationProp<
  RootStackParamList,
  'RecordVoice'
>;

interface Props {
  navigation: RecordVoiceScreenNavigationProp;
}

const RecordVoiceScreen: React.FC<Props> = ({ navigation }) => {
  const [isRecording, setIsRecording] = useState(false);
  const [recordingTime, setRecordingTime] = useState(0);
  const [hasRecorded, setHasRecorded] = useState(false);
  const pulseAnimation = useRef(new Animated.Value(1)).current;
  const animationRef = useRef<Animated.CompositeAnimation | null>(null);

  useEffect(() => {
    let interval: NodeJS.Timeout | undefined;
    if (isRecording) {
      interval = setInterval(() => {
        setRecordingTime(prev => prev + 1);
      }, 1000);

      // Pulse animation
      animationRef.current = Animated.loop(
        Animated.sequence([
          Animated.timing(pulseAnimation, {
            toValue: 1.2,
            duration: 500,
            useNativeDriver: true,
          }),
          Animated.timing(pulseAnimation, {
            toValue: 1,
            duration: 500,
            useNativeDriver: true,
          }),
        ])
      );
      animationRef.current.start();
    } else {
      if (interval) {
        clearInterval(interval);
      }
      if (animationRef.current) {
        animationRef.current.stop();
      }
      // Reset animation value
      pulseAnimation.setValue(1);
    }

    return () => {
      if (interval) {
        clearInterval(interval);
      }
      if (animationRef.current) {
        animationRef.current.stop();
      }
    };
  }, [isRecording, pulseAnimation]);

  const handleRecord = () => {
    if (isRecording) {
      // Stop recording
      setIsRecording(false);
      setHasRecorded(true);
      Alert.alert('Recording Complete', 'Your voice clip has been recorded!');
    } else {
      // Start recording
      if (recordingTime >= 60) {
        Alert.alert('Maximum Length', 'Recordings are limited to 60 seconds');
        return;
      }
      setIsRecording(true);
      setRecordingTime(0);
      setHasRecorded(false);
    }
  };

  const handleSave = () => {
    Alert.alert(
      'Save Recording',
      'Your voice clip has been saved to your library!',
      [
        {
          text: 'OK',
          onPress: () => navigation.goBack()
        }
      ]
    );
  };

  const handleDiscard = () => {
    Alert.alert(
      'Discard Recording',
      'Are you sure you want to discard this recording?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Discard',
          style: 'destructive',
          onPress: () => {
            setIsRecording(false);
            setRecordingTime(0);
            setHasRecorded(false);
          }
        }
      ]
    );
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor="#FFFFFF" />
      
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Ionicons name="arrow-back" size={24} color="#1F2937" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Record Voice</Text>
        <View style={{ width: 24 }} />
      </View>

      {/* Prompt Card */}
      <View style={styles.promptCard}>
        <Text style={styles.promptTitle}>Today's Prompt</Text>
        <Text style={styles.promptText}>
          Say 'Welcome to our home' in your language
        </Text>
        <Text style={styles.promptSubtext}>
          Optional - or record anything you'd like!
        </Text>
      </View>

      {/* Recording Area */}
      <View style={styles.recordingArea}>
        {/* Timer */}
        {(isRecording || hasRecorded) && (
          <View style={styles.timerContainer}>
            <Text style={styles.timerText}>{formatTime(recordingTime)}</Text>
            <Text style={styles.maxTimeText}>/ 1:00</Text>
          </View>
        )}

        {/* Waveform Visualization (when recording) */}
        {isRecording && (
          <View style={styles.waveformContainer}>
            {Array.from({ length: 20 }, (_, i) => (
              <Animated.View
                key={i}
                style={[
                  styles.waveformBar,
                  {
                    height: Math.random() * 60 + 20,
                    transform: [{ scaleY: pulseAnimation }]
                  }
                ]}
              />
            ))}
          </View>
        )}

        {/* Record Button */}
        <View style={styles.recordButtonContainer}>
          <Animated.View
            style={[
              styles.recordButtonOuter,
              isRecording && {
                transform: [{ scale: pulseAnimation }]
              }
            ]}
          >
            <TouchableOpacity
              style={[
                styles.recordButton,
                isRecording && styles.recordingButton
              ]}
              onPress={handleRecord}
            >
              <Ionicons
                name={isRecording ? "stop" : "mic"}
                size={32}
                color="#FFFFFF"
              />
            </TouchableOpacity>
          </Animated.View>
        </View>

        {/* Recording Status */}
        <View style={styles.statusContainer}>
          {!isRecording && !hasRecorded && (
            <Text style={styles.statusText}>Tap to start recording</Text>
          )}
          {isRecording && (
            <Text style={styles.statusText}>Recording...</Text>
          )}
          {!isRecording && hasRecorded && (
            <Text style={styles.statusText}>Tap to record again</Text>
          )}
          <Text style={styles.maxTimeSubtext}>Max 60 seconds</Text>
        </View>
      </View>

      {/* Action Buttons */}
      {hasRecorded && (
        <View style={styles.actionButtons}>
          <TouchableOpacity style={styles.discardButton} onPress={handleDiscard}>
            <Ionicons name="trash-outline" size={20} color="#EF4444" />
            <Text style={styles.discardButtonText}>Discard</Text>
          </TouchableOpacity>
          
          <TouchableOpacity style={styles.saveButton} onPress={handleSave}>
            <Ionicons name="checkmark" size={20} color="#FFFFFF" />
            <Text style={styles.saveButtonText}>Save Clip</Text>
          </TouchableOpacity>
        </View>
      )}

      {/* Recording Tips */}
      {!isRecording && !hasRecorded && (
        <View style={styles.tipsContainer}>
          <Text style={styles.tipsTitle}>Recording Tips:</Text>
          <Text style={styles.tipText}>• Speak clearly and naturally</Text>
          <Text style={styles.tipText}>• Hold phone close to your mouth</Text>
          <Text style={styles.tipText}>• Record in a quiet environment</Text>
        </View>
      )}
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8F9FA',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: width * 0.05,
    paddingVertical: 16,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#E5E5E5',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1F2937',
  },
  promptCard: {
    backgroundColor: '#FEF3E2',
    margin: width * 0.05,
    padding: 20,
    borderRadius: 16,
  },
  promptTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#D97706',
    marginBottom: 8,
  },
  promptText: {
    fontSize: 16,
    color: '#92400E',
    marginBottom: 4,
  },
  promptSubtext: {
    fontSize: 14,
    color: '#A16207',
  },
  recordingArea: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: width * 0.05,
  },
  timerContainer: {
    flexDirection: 'row',
    alignItems: 'baseline',
    marginBottom: 40,
  },
  timerText: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#FF8A00',
  },
  maxTimeText: {
    fontSize: 18,
    color: '#9CA3AF',
    marginLeft: 4,
  },
  waveformContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    height: 80,
    marginBottom: 40,
  },
  waveformBar: {
    width: 4,
    backgroundColor: '#FF8A00',
    marginHorizontal: 2,
    borderRadius: 2,
  },
  recordButtonContainer: {
    alignItems: 'center',
    marginBottom: 24,
  },
  recordButtonOuter: {
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: 'rgba(255, 138, 0, 0.2)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  recordButton: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: '#FF8A00',
    justifyContent: 'center',
    alignItems: 'center',
  },
  recordingButton: {
    backgroundColor: '#EF4444',
  },
  statusContainer: {
    alignItems: 'center',
  },
  statusText: {
    fontSize: 16,
    fontWeight: '500',
    color: '#6B7280',
    marginBottom: 4,
  },
  maxTimeSubtext: {
    fontSize: 14,
    color: '#9CA3AF',
  },
  actionButtons: {
    flexDirection: 'row',
    paddingHorizontal: width * 0.05,
    paddingBottom: 30,
    gap: 12,
  },
  discardButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#EF4444',
    borderRadius: 12,
    paddingVertical: 16,
  },
  discardButtonText: {
    color: '#EF4444',
    fontSize: 16,
    fontWeight: '600',
    marginLeft: 8,
  },
  saveButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#FF8A00',
    borderRadius: 12,
    paddingVertical: 16,
  },
  saveButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
    marginLeft: 8,
  },
  tipsContainer: {
    backgroundColor: '#FFFFFF',
    margin: width * 0.05,
    padding: 20,
    borderRadius: 16,
  },
  tipsTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1F2937',
    marginBottom: 12,
  },
  tipText: {
    fontSize: 14,
    color: '#6B7280',
    marginBottom: 4,
  },
});

export default RecordVoiceScreen;