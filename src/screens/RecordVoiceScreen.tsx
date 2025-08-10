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
  Modal,
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
  route?: {
    params?: {
      isRemix?: boolean;
      isDuet?: boolean;
      originalClip?: {
        id: string;
        phrase: string;
        user: string;
        language: string;
      };
    };
  };
}

interface Language {
  id: string;
  name: string;
  dialect?: string;
}

const languages: Language[] = [
  { id: 'yoruba-ekiti', name: 'Yoruba', dialect: 'Ekiti Dialect' },
  { id: 'yoruba-lagos', name: 'Yoruba', dialect: 'Lagos Dialect' },
  { id: 'igbo-nsukka', name: 'Igbo', dialect: 'Nsukka' },
  { id: 'igbo-owerri', name: 'Igbo', dialect: 'Owerri' },
  { id: 'hausa-kano', name: 'Hausa', dialect: 'Kano' },
  { id: 'hausa-sokoto', name: 'Hausa', dialect: 'Sokoto' },
  { id: 'fulfulde', name: 'Fulfulde' },
  { id: 'kanuri', name: 'Kanuri' },
  { id: 'tiv', name: 'Tiv' },
  { id: 'edo', name: 'Edo' },
];

const RecordVoiceScreen: React.FC<Props> = ({ navigation, route }) => {
  const [isRecording, setIsRecording] = useState(false);
  const [recordingTime, setRecordingTime] = useState(0);
  const [hasRecorded, setHasRecorded] = useState(false);
  const [selectedLanguage, setSelectedLanguage] = useState<Language | null>(null);
  const [showLanguageModal, setShowLanguageModal] = useState(false);
  const pulseAnimation = useRef(new Animated.Value(1)).current;
  const animationRef = useRef<Animated.CompositeAnimation | null>(null);

  const isRemix = route?.params?.isRemix || false;
  const isDuet = route?.params?.isDuet || false;
  const originalClip = route?.params?.originalClip;

  useEffect(() => {
    let interval: NodeJS.Timeout | undefined;
    if (isRecording) {
      interval = setInterval(() => {
        setRecordingTime(prev => prev + 1);
      }, 1000);

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
    if (!selectedLanguage) {
      Alert.alert('Select Language', 'Please select the language you\'ll be speaking in before recording.');
      setShowLanguageModal(true);
      return;
    }

    if (isRecording) {
      setIsRecording(false);
      setHasRecorded(true);
      Alert.alert('Recording Complete', 'Your voice clip has been recorded!');
    } else {
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
    const clipType = isRemix ? 'remix' : isDuet ? 'duet' : 'original clip';
    Alert.alert(
      'Save Recording',
      `Your ${clipType} has been saved to your library! It will be available for validation by native speakers of ${selectedLanguage?.name}${selectedLanguage?.dialect ? ` (${selectedLanguage.dialect})` : ''}.`,
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

  const getScreenTitle = () => {
    if (isRemix) return 'Create Remix';
    if (isDuet) return 'Record Duet';
    return 'Record Voice';
  };

  const getPromptText = () => {
    if (isRemix && originalClip) {
      return `Create your own version of "${originalClip.phrase}" or say it in your dialect`;
    }
    if (isDuet && originalClip) {
      return `Respond to "${originalClip.phrase}" by ${originalClip.user}`;
    }
    return "Say 'Welcome to our home' in your language";
  };

  const LanguageModal = () => (
    <Modal
      visible={showLanguageModal}
      animationType="slide"
      presentationStyle="pageSheet"
      onRequestClose={() => setShowLanguageModal(false)}
    >
      <SafeAreaView style={styles.modalContainer}>
        <View style={styles.modalHeader}>
          <TouchableOpacity onPress={() => setShowLanguageModal(false)}>
            <Ionicons name="close" size={24} color="#666" />
          </TouchableOpacity>
          <Text style={styles.modalTitle}>Select your language</Text>
          <View style={{ width: 24 }} />
        </View>

        <View style={styles.languageList}>
          {languages.map((language) => (
            <TouchableOpacity
              key={language.id}
              style={[
                styles.languageItem,
                selectedLanguage?.id === language.id && styles.selectedLanguageItem
              ]}
              onPress={() => {
                setSelectedLanguage(language);
                setShowLanguageModal(false);
              }}
            >
              <View style={styles.languageInfo}>
                <Text style={styles.languageName}>{language.name}</Text>
                {language.dialect && (
                  <Text style={styles.dialectText}>/ {language.dialect}</Text>
                )}
              </View>
              {selectedLanguage?.id === language.id && (
                <Ionicons name="checkmark" size={20} color="#FF8A00" />
              )}
            </TouchableOpacity>
          ))}
        </View>
      </SafeAreaView>
    </Modal>
  );

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor="#FFFFFF" />
      
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Ionicons name="arrow-back" size={24} color="#1F2937" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>{getScreenTitle()}</Text>
        <View style={{ width: 24 }} />
      </View>

      {/* Original Clip Reference (for Remix/Duet) */}
      {(isRemix || isDuet) && originalClip && (
        <View style={styles.originalClipCard}>
          <View style={styles.originalClipHeader}>
            <Ionicons 
              name={isRemix ? "repeat" : "people"} 
              size={16} 
              color={isRemix ? "#8B5CF6" : "#10B981"} 
            />
            <Text style={styles.originalClipType}>
              {isRemix ? 'Remixing' : 'Responding to'}
            </Text>
          </View>
          <Text style={styles.originalClipPhrase}>"{originalClip.phrase}"</Text>
          <Text style={styles.originalClipMeta}>
            by {originalClip.user} • {originalClip.language}
          </Text>
        </View>
      )}

      {/* Language Selection */}
      <TouchableOpacity 
        style={styles.languageSelector}
        onPress={() => setShowLanguageModal(true)}
      >
        <Ionicons name="globe-outline" size={20} color="#FF8A00" />
        <Text style={[
          styles.languageSelectorText,
          selectedLanguage && styles.languageSelected
        ]}>
          {selectedLanguage 
            ? `${selectedLanguage.name}${selectedLanguage.dialect ? ` / ${selectedLanguage.dialect}` : ''}`
            : 'Select your language'
          }
        </Text>
        <Ionicons name="chevron-down" size={20} color="#999" />
      </TouchableOpacity>

      {/* Prompt Card */}
      <View style={styles.promptCard}>
        <Text style={styles.promptTitle}>
          {isRemix ? 'Remix Prompt' : isDuet ? 'Duet Prompt' : 'Today\'s Prompt'}
        </Text>
        <Text style={styles.promptText}>{getPromptText()}</Text>
        <Text style={styles.promptSubtext}>
          {isRemix || isDuet ? 'Express it in your own way!' : 'Optional - or record anything you\'d like!'}
        </Text>
      </View>

      {/* Recording Area */}
      <View style={styles.recordingArea}>
        {(isRecording || hasRecorded) && (
          <View style={styles.timerContainer}>
            <Text style={styles.timerText}>{formatTime(recordingTime)}</Text>
            <Text style={styles.maxTimeText}>/ 1:00</Text>
          </View>
        )}

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
                isRecording && styles.recordingButton,
                !selectedLanguage && styles.disabledButton
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

        <View style={styles.statusContainer}>
          {!selectedLanguage && (
            <Text style={styles.statusText}>Select a language to start recording</Text>
          )}
          {selectedLanguage && !isRecording && !hasRecorded && (
            <Text style={styles.statusText}>Tap to start recording in {selectedLanguage.name}</Text>
          )}
          {isRecording && (
            <Text style={styles.statusText}>Recording in {selectedLanguage?.name}...</Text>
          )}
          {!isRecording && hasRecorded && (
            <Text style={styles.statusText}>Recording complete! Ready to save.</Text>
          )}
          <Text style={styles.maxTimeSubtext}>Max 60 seconds</Text>
        </View>
      </View>

      {hasRecorded && (
        <View style={styles.actionButtons}>
          <TouchableOpacity style={styles.discardButton} onPress={handleDiscard}>
            <Ionicons name="trash-outline" size={20} color="#EF4444" />
            <Text style={styles.discardButtonText}>Discard</Text>
          </TouchableOpacity>
          
          <TouchableOpacity style={styles.saveButton} onPress={handleSave}>
            <Ionicons name="checkmark" size={20} color="#FFFFFF" />
            <Text style={styles.saveButtonText}>
              Save {isRemix ? 'Remix' : isDuet ? 'Duet' : 'Clip'}
            </Text>
          </TouchableOpacity>
        </View>
      )}

      {!isRecording && !hasRecorded && selectedLanguage && (
        <View style={styles.tipsContainer}>
          <Text style={styles.tipsTitle}>
            {isRemix ? 'Remix Tips:' : isDuet ? 'Duet Tips:' : 'Recording Tips:'}
          </Text>
          {isRemix ? (
            <>
              <Text style={styles.tipText}>• Put your own spin on the phrase</Text>
              <Text style={styles.tipText}>• Use your regional dialect</Text>
              <Text style={styles.tipText}>• Add cultural context or meaning</Text>
            </>
          ) : isDuet ? (
            <>
              <Text style={styles.tipText}>• Respond naturally to the original</Text>
              <Text style={styles.tipText}>• Share your perspective or translation</Text>
              <Text style={styles.tipText}>• Build on the conversation</Text>
            </>
          ) : (
            <>
              <Text style={styles.tipText}>• Speak clearly and naturally</Text>
              <Text style={styles.tipText}>• Hold phone close to your mouth</Text>
              <Text style={styles.tipText}>• Record in a quiet environment</Text>
            </>
          )}
        </View>
      )}

      <LanguageModal />
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
  originalClipCard: {
    backgroundColor: '#F0F9FF',
    margin: width * 0.05,
    padding: 16,
    borderRadius: 12,
    borderLeftWidth: 4,
    borderLeftColor: '#0EA5E9',
  },
  originalClipHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  originalClipType: {
    fontSize: 12,
    fontWeight: '600',
    color: '#0369A1',
    marginLeft: 4,
    textTransform: 'uppercase',
  },
  originalClipPhrase: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1F2937',
    marginBottom: 4,
  },
  originalClipMeta: {
    fontSize: 12,
    color: '#6B7280',
  },
  languageSelector: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    marginHorizontal: width * 0.05,
    padding: 16,
    borderRadius: 12,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#E5E5E5',
  },
  languageSelectorText: {
    flex: 1,
    fontSize: 16,
    color: '#9CA3AF',
    marginLeft: 12,
  },
  languageSelected: {
    color: '#1F2937',
    fontWeight: '500',
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
    lineHeight: 22,
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
  disabledButton: {
    backgroundColor: '#D1D5DB',
  },
  statusContainer: {
    alignItems: 'center',
  },
  statusText: {
    fontSize: 16,
    fontWeight: '500',
    color: '#6B7280',
    marginBottom: 4,
    textAlign: 'center',
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
  modalContainer: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E5E5',
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1F2937',
  },
  languageList: {
    flex: 1,
    paddingHorizontal: 20,
    paddingTop: 16,
  },
  languageItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
  },
  selectedLanguageItem: {
    backgroundColor: '#FEF3E2',
  },
  languageInfo: {
    flex: 1,
  },
  languageName: {
    fontSize: 16,
    fontWeight: '500',
    color: '#1F2937',
  },
  dialectText: {
    fontSize: 14,
    color: '#6B7280',
    marginTop: 2,
  },
});

export default RecordVoiceScreen;