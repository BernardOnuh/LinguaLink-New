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
  ActivityIndicator,
  Platform,
  ScrollView,
  TextInput,
} from 'react-native';
import { Audio } from 'expo-av';
import * as DocumentPicker from 'expo-document-picker';
import { Ionicons } from '@expo/vector-icons';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RootStackParamList } from '../../App';
import { useAuth } from '../context/AuthProvider';
import { supabase } from '../supabaseClient';
import { uploadAudioFile } from '../utils/storage';

const { width, height } = Dimensions.get('window');

type RecordVoiceScreenNavigationProp = NativeStackNavigationProp<
  RootStackParamList,
  'RecordVoice'
>;

interface Props {
  navigation: RecordVoiceScreenNavigationProp;
  route?: {
    params?: {
      mode?: 'record' | 'upload';
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
  const { user: authUser } = useAuth();
  const [isRecording, setIsRecording] = useState(false);
  const [recordingTime, setRecordingTime] = useState(0);
  const [hasRecorded, setHasRecorded] = useState(false);
  const [selectedLanguage, setSelectedLanguage] = useState<Language | null>(null);
  const [showLanguageModal, setShowLanguageModal] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [uploadProgress, setUploadProgress] = useState<string>('');
  const [audioUri, setAudioUri] = useState<string | null>(null);
  const [phrase, setPhrase] = useState('');
  const [translation, setTranslation] = useState('');
  const [isEditingPrompt, setIsEditingPrompt] = useState(false);
  const [customPrompt, setCustomPrompt] = useState('');

  // Audio recording state
  const [recording, setRecording] = useState<Audio.Recording | null>(null);
  const [recordingStatus, setRecordingStatus] = useState<Audio.RecordingStatus | null>(null);
  const [hasPermission, setHasPermission] = useState<boolean | null>(null);

  const pulseAnimation = useRef(new Animated.Value(1)).current;
  const animationRef = useRef<Animated.CompositeAnimation | null>(null);

  const isRemix = route?.params?.isRemix || false;
  const isDuet = route?.params?.isDuet || false;
  const originalClip = route?.params?.originalClip;
  const mode = route?.params?.mode || 'record';

  // Request audio recording permissions
  useEffect(() => {
    (async () => {
      const { status } = await Audio.requestPermissionsAsync();
      setHasPermission(status === 'granted');
    })();
  }, []);

  // Default to editing prompt for regular record/upload so users can type theirs
  useEffect(() => {
    if (!isRemix && !isDuet) {
      setIsEditingPrompt(true);
    }
  }, []);

  // Set up audio mode for recording
  useEffect(() => {
    (async () => {
      try {
        await Audio.setAudioModeAsync({
          allowsRecordingIOS: true,
          playsInSilentModeIOS: true,
          staysActiveInBackground: false,
          shouldDuckAndroid: true,
          playThroughEarpieceAndroid: false,
        });
      } catch (error) {
        console.error('Error setting audio mode:', error);
      }
    })();
  }, []);

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

  const handleRecord = async () => {
    if (mode === 'upload') return; // recording disabled in upload mode
    if (!selectedLanguage) {
      Alert.alert('Select Language', 'Please select the language you\'ll be speaking in before recording.');
      setShowLanguageModal(true);
      return;
    }

    if (!hasPermission) {
      Alert.alert('Permission Required', 'Please grant microphone permission to record audio.');
      return;
    }

    if (isRecording) {
      // Stop recording
      try {
        if (recording) {
          await recording.stopAndUnloadAsync();
          const uri = recording.getURI();
          setAudioUri(uri);
          setRecording(null);
          setRecordingStatus(null);
        }
        setIsRecording(false);
        setHasRecorded(true);
        setPhrase(getPromptText());
        setTranslation('Translation will be added later');
        Alert.alert('Recording Complete', 'Your voice clip has been recorded!');
      } catch (error) {
        console.error('Error stopping recording:', error);
        Alert.alert('Error', 'Failed to stop recording. Please try again.');
      }
    } else {
      // Start recording
      if (recordingTime >= 60) {
        Alert.alert('Maximum Length', 'Recordings are limited to 60 seconds');
        return;
      }

      try {
        const { recording: newRecording } = await Audio.Recording.createAsync(
          Audio.RecordingOptionsPresets.HIGH_QUALITY
        );

        setRecording(newRecording);
        setIsRecording(true);
        setRecordingTime(0);
        setHasRecorded(false);
        setAudioUri(null);
        setPhrase('');
        setTranslation('');

        // Set up status update listener
        newRecording.setOnRecordingStatusUpdate((status) => {
          setRecordingStatus(status);
          if (status.isRecording) {
            setRecordingTime(Math.floor(status.durationMillis / 1000));
          }
        });

      } catch (error) {
        console.error('Error starting recording:', error);
        Alert.alert('Error', 'Failed to start recording. Please try again.');
      }
    }
  };

  const handleChooseAudio = async () => {
    try {
      const result = await DocumentPicker.getDocumentAsync({
        type: ['audio/*'],
        copyToCacheDirectory: true,
        multiple: false,
      });

      if (result.canceled) return;
      const file = result.assets?.[0];
      if (!file?.uri) return;

      setAudioUri(file.uri);
      setHasRecorded(true);
      setRecordingTime(0);
      if (!customPrompt.trim()) {
        setPhrase('');
      }
      Alert.alert('Audio Selected', 'Your audio file is ready to upload.');
    } catch (e) {
      console.error('Document picker error:', e);
      Alert.alert('Error', 'Failed to pick audio file');
    }
  };

  const handleSave = async () => {
    if (!authUser?.id || !selectedLanguage || !audioUri) {
      Alert.alert('Error', 'Missing required information to save recording.');
      return;
    }

    const finalPhrase = (customPrompt || phrase).trim();
    if (!finalPhrase) {
      Alert.alert('Add a prompt', 'Please write a short phrase describing your audio.');
      return;
    }

    setIsSaving(true);
    setUploadProgress('Preparing upload...');

    try {
      // Upload audio file to Supabase Storage
      console.log('Uploading audio file to Supabase Storage...');
      setUploadProgress('Uploading audio file...');
      const uploadResult = await uploadAudioFile(audioUri, authUser.id);

      if (!uploadResult.success) {
        throw new Error(uploadResult.error || 'Failed to upload audio file');
      }

      console.log('Audio file uploaded successfully:', uploadResult.url);
      setUploadProgress('Saving to database...');

      // Save the voice clip with the cloud URL
      const { data, error } = await supabase
        .from('voice_clips')
        .insert({
          user_id: authUser.id,
          phrase: finalPhrase,
          translation: translation || 'Translation will be added later',
          audio_url: uploadResult.url, // Use the cloud URL
          language: selectedLanguage.name,
          dialect: selectedLanguage.dialect || null,
          duration: recordingTime,
          likes_count: 0,
          comments_count: 0,
          validations_count: 0,
          is_validated: false,
          // Duet/Remix tracking
          original_clip_id: isDuet || isRemix ? originalClip?.id : null,
          clip_type: isDuet ? 'duet' : isRemix ? 'remix' : 'original'
        })
        .select()
        .single();

      if (error) throw error;

      console.log('Voice clip saved successfully:', data);
      console.log('Audio file available at:', uploadResult.url);

      // If this is a duet, update the original clip's duet count
      if (isDuet && originalClip?.id) {
        try {
          // Get current duet count and increment it
          const { data: currentClip } = await supabase
            .from('voice_clips')
            .select('duets_count')
            .eq('id', originalClip.id)
            .single();

          const newDuetCount = (currentClip?.duets_count || 0) + 1;

          const { error: duetError } = await supabase
            .from('voice_clips')
            .update({
              duets_count: newDuetCount
            })
            .eq('id', originalClip.id);

          if (duetError) {
            console.error('Error updating duet count:', duetError);
          } else {
            console.log('Duet count updated for original clip:', originalClip.id);
          }
        } catch (duetCountError) {
          console.error('Error updating duet count:', duetCountError);
        }
      }

      const clipType = isRemix ? 'remix' : isDuet ? 'duet' : 'original clip';
      Alert.alert(
        'Success!',
        `Your ${clipType} has been saved to your library! It will be available for validation by native speakers of ${selectedLanguage.name}${selectedLanguage.dialect ? ` (${selectedLanguage.dialect})` : ''}.`,
        [
          {
            text: 'OK',
            onPress: () => {
              // Navigate back to profile to see the new clip
              navigation.goBack();
            }
          }
        ]
      );
    } catch (error) {
      console.error('Error saving voice clip:', error);
      Alert.alert('Error', 'Failed to save your recording. Please try again.');
    } finally {
      setIsSaving(false);
      setUploadProgress('');
    }
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
          onPress: async () => {
            // Stop recording if it's active
            if (recording) {
              try {
                await recording.stopAndUnloadAsync();
              } catch (error) {
                console.error('Error stopping recording:', error);
              }
            }
            setIsRecording(false);
            setRecordingTime(0);
            setHasRecorded(false);
            setRecording(null);
            setRecordingStatus(null);
            setAudioUri(null);
          }
        }
      ]
    );
  };

  // Cleanup recording on component unmount
  useEffect(() => {
    return () => {
      if (recording) {
        recording.stopAndUnloadAsync();
      }
    };
  }, [recording]);

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const getScreenTitle = () => {
    if (isRemix) return 'Create Remix';
    if (isDuet) return 'Record Duet';
    return mode === 'upload' ? 'Upload Audio' : 'Record Voice';
  };

  const getPromptText = () => {
    if (customPrompt.trim()) return customPrompt.trim();
    if (isRemix && originalClip) {
      return `Create your own version of "${originalClip.phrase}" or say it in your dialect`;
    }
    if (isDuet && originalClip) {
      return `Respond to "${originalClip.phrase}"`;
    }
    return '';
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

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* User Info */}
        {authUser && (
          <View style={styles.userInfoContainer}>
            <Text style={styles.userInfoText}>
              Recording as: {authUser.user_metadata?.full_name || authUser.user_metadata?.name || authUser.email}
            </Text>
          </View>
        )}

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
              {originalClip.language}
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
          <View style={styles.promptHeader}>
            <Text style={styles.promptTitle}>
              {isRemix ? 'Remix Prompt' : isDuet ? 'Duet Prompt' : 'Your Prompt'}
            </Text>
            <View style={styles.promptActions}>
              {!isEditingPrompt && customPrompt.trim() && (
                <TouchableOpacity
                  style={styles.resetPromptButton}
                  onPress={() => {
                    setCustomPrompt('');
                  }}
                >
                  <Ionicons name="refresh-outline" size={16} color="#6B7280" />
                </TouchableOpacity>
              )}
              <TouchableOpacity
                style={styles.editPromptButton}
                onPress={() => {
                  if (isEditingPrompt) {
                    // Save the custom prompt
                    setIsEditingPrompt(false);
                  } else {
                    // Start editing - initialize with current prompt
                    const currentPrompt = customPrompt.trim() ||
                      (isRemix && originalClip ? `Create your own version of "${originalClip.phrase}" or say it in your dialect` :
                       isDuet && originalClip ? `Respond to "${originalClip.phrase}"` :
                       '');
                    setCustomPrompt(currentPrompt);
                    setIsEditingPrompt(true);
                  }
                }}
              >
                <Ionicons
                  name={isEditingPrompt ? "checkmark" : "create-outline"}
                  size={16}
                  color="#D97706"
                />
              </TouchableOpacity>
            </View>
          </View>

          {isEditingPrompt ? (
            <TextInput
              style={styles.promptInput}
              value={customPrompt}
              onChangeText={setCustomPrompt}
              placeholder="Enter your custom prompt..."
              multiline
              textAlignVertical="top"
              autoFocus
            />
          ) : (
            <Text style={styles.promptText}>
              {getPromptText() || 'Describe what you are saying...'}
            </Text>
          )}

          <Text style={styles.promptSubtext}>
            {isRemix || isDuet ? 'Express it in your own way!' : 'Write a short phrase that matches your audio'}
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

          {mode === 'record' ? (
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
                  (!selectedLanguage || !hasPermission) && styles.disabledButton
                ]}
                onPress={handleRecord}
                disabled={!hasPermission}
              >
                <Ionicons
                  name={isRecording ? "stop" : "mic"}
                  size={32}
                  color="#FFFFFF"
                />
              </TouchableOpacity>
            </Animated.View>
          </View>
          ) : (
          <View style={styles.recordButtonContainer}>
            <TouchableOpacity
              style={[styles.recordButton, (!selectedLanguage) && styles.disabledButton]}
              onPress={handleChooseAudio}
              disabled={!selectedLanguage}
            >
              <Ionicons name="cloud-upload" size={28} color="#FFFFFF" />
            </TouchableOpacity>
          </View>
          )}

          <View style={styles.statusContainer}>
            {!hasPermission && (
              <Text style={styles.statusText}>Microphone permission required</Text>
            )}
            {!selectedLanguage && hasPermission && (
              <Text style={styles.statusText}>Select a language to start recording</Text>
            )}
            {selectedLanguage && !isRecording && !hasRecorded && hasPermission && (
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

            <TouchableOpacity
              style={[styles.saveButton, isSaving && styles.disabledButton]}
              onPress={handleSave}
              disabled={isSaving}
            >
              {isSaving ? (
                <ActivityIndicator size="small" color="#FFFFFF" />
              ) : (
                <Ionicons name="checkmark" size={20} color="#FFFFFF" />
              )}
              <Text style={styles.saveButtonText}>
                {isSaving ? (uploadProgress || 'Saving...') : `Save ${isRemix ? 'Remix' : isDuet ? 'Duet' : 'Clip'}`}
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
      </ScrollView>

      <LanguageModal />
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8F9FA',
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
    paddingBottom: 20,
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
  userInfoContainer: {
    backgroundColor: '#F3F4F6',
    paddingHorizontal: width * 0.05,
    paddingVertical: 8,
  },
  userInfoText: {
    fontSize: 14,
    color: '#6B7280',
    textAlign: 'center',
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
  promptHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  promptTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#D97706',
    flex: 1,
  },
  promptActions: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  editPromptButton: {
    padding: 4,
    borderRadius: 4,
  },
  resetPromptButton: {
    padding: 4,
    borderRadius: 4,
    marginRight: 8,
  },
  promptInput: {
    fontSize: 16,
    color: '#92400E',
    marginBottom: 4,
    lineHeight: 22,
    backgroundColor: '#FFFFFF',
    borderRadius: 8,
    padding: 12,
    borderWidth: 1,
    borderColor: '#F3F4F6',
    minHeight: 60,
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
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: width * 0.05,
    paddingVertical: 40,
    minHeight: 400,
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