import React, { useEffect, useMemo, useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  SafeAreaView,
  StatusBar,
  Dimensions,
  Alert,
  ScrollView,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { RootStackParamList } from '../../App';
import { supabase } from '../supabaseClient';
import { Audio } from 'expo-av';
import { getPlayableAudioUrl } from '../utils/storage';
import { useAuth } from '../context/AuthProvider';

const { width, height } = Dimensions.get('window');

// Helper to extract original prompt from nested remix chains
const extractOriginalPrompt = (phrase: string) => {
  // If the phrase contains nested remix text, extract the original
  if (phrase.includes('"Create your own version of "') || phrase.includes('"Respond to "')) {
    // Find the innermost quoted text (the original prompt)
    const matches = phrase.match(/"([^"]*)"(?: by [^"]*)?$/);
    if (matches && matches[1]) {
      // Check if this is the actual original (not another nested remix)
      const extracted = matches[1];
      if (!extracted.includes('"Create your own version of "') && !extracted.includes('"Respond to "')) {
        return extracted;
      }
      // If it's still nested, try to find the deepest level
      return extractOriginalPrompt(extracted);
    }
  }
  // If no nested text found, return the phrase as-is
  return phrase;
};

type Props = NativeStackScreenProps<RootStackParamList, 'Validation'>;

interface ValidationClip {
  id: string;
  phrase: string;
  pronunciation: string;
  language: string;
  dialect: string;
  user: string;
  audioWaveform: number[];
  context?: string;
}

const mockValidationClip: ValidationClip = {
  id: '1',
  phrase: 'Ndewo',
  pronunciation: '/n-de-wo/',
  language: 'Igbo',
  dialect: 'Nsukka',
  user: 'Chidi Okafor',
  audioWaveform: [30, 50, 70, 40, 60, 80, 90, 70, 40, 20, 50, 60, 30, 40, 60, 50],
  context: 'Common greeting used in the morning and afternoon'
};

const ValidationScreen: React.FC<Props> = ({ navigation, route }) => {
  const { user } = useAuth();
  const clipId = route?.params?.clipId;
  const [hasValidated, setHasValidated] = useState(false);
  const [validationResult, setValidationResult] = useState<'correct' | 'incorrect' | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [clip, setClip] = useState<{
    id: string;
    phrase?: string;
    language?: string;
    dialect?: string;
    audio_url?: string;
  } | null>(null);
  const [sound, setSound] = useState<Audio.Sound | null>(null);
  const [audioLoading, setAudioLoading] = useState(false);
  const [existingValidationId, setExistingValidationId] = useState<string | null>(null);

  // Load clip details if needed
  useEffect(() => {
    let mounted = true;
    const load = async () => {
      if (!clipId) return;
      setLoading(true);
      try {
        const { data, error: qErr } = await supabase
          .from('voice_clips')
          .select('id, phrase, language, dialect, audio_url')
          .eq('id', clipId)
          .maybeSingle();
        if (qErr) throw qErr;
        if (mounted) {
          setClip(data ?? { id: clipId });
          setError(null);
        }
      } catch (e: any) {
        if (mounted) setError(e?.message || 'Failed to load clip');
      } finally {
        if (mounted) setLoading(false);
      }
    };
    load();
    return () => {
      mounted = false;
    };
  }, [clipId]);

  // Load current user's existing validation (if any)
  useEffect(() => {
    const fetchExisting = async () => {
      if (!user?.id || !clipId) return;
      const { data, error: vErr } = await supabase
        .from('validations')
        .select('id, is_approved')
        .eq('voice_clip_id', clipId)
        .eq('validator_id', user.id)
        .maybeSingle();
      if (!vErr && data) {
        setExistingValidationId(data.id);
        setHasValidated(true);
        setValidationResult(data.is_approved ? 'correct' : 'incorrect');
      } else {
        setExistingValidationId(null);
        setHasValidated(false);
        setValidationResult(null);
      }
    };
    fetchExisting();
  }, [user?.id, clipId]);

  // Cleanup audio on unmount
  useEffect(() => {
    return () => {
      if (sound) {
        sound.unloadAsync().catch(() => {});
      }
    };
  }, [sound]);

  const handleValidation = async (isCorrect: boolean) => {
    if (!user?.id) {
      Alert.alert('Sign in required', 'Please sign in to validate clips.');
      return;
    }
    if (!clipId) return;

    // If already validated by this user, offer to remove
    if (existingValidationId) {
      Alert.alert(
        'Remove your validation?',
        'You already validated this clip. Do you want to remove your validation?',
        [
          { text: 'Cancel', style: 'cancel' },
          {
            text: 'Remove',
            style: 'destructive',
            onPress: async () => {
              const { error: delErr } = await supabase
                .from('validations')
                .delete()
                .eq('id', existingValidationId);
              if (delErr) {
                Alert.alert('Error', delErr.message || 'Failed to remove validation');
                return;
              }
              setExistingValidationId(null);
              setHasValidated(false);
              setValidationResult(null);
              Alert.alert('Removed', 'Your validation has been removed.');
            },
          },
        ]
      );
      return;
    }

    // Otherwise, submit new validation
    setValidationResult(isCorrect ? 'correct' : 'incorrect');
    setHasValidated(true);
    try {
      const { data: insData, error: insertErr } = await supabase
        .from('validations')
        .insert({
          voice_clip_id: clipId,
          validator_id: user.id,
          validation_type: 'pronunciation',
          rating: isCorrect ? 4 : 2,
          is_approved: isCorrect,
        })
        .select('id')
        .single();
      if (insertErr) throw insertErr;
      if (insData?.id) setExistingValidationId(insData.id);

      const points = isCorrect ? 10 : 5;
      const message = isCorrect
        ? `Great! You've confirmed this pronunciation is correct. +${points} points earned!`
        : `Thank you for the feedback. This helps the community learn. +${points} points earned!`;
      Alert.alert('Validation Submitted', message);
    } catch (e: any) {
      Alert.alert('Error', e?.message || 'Failed to submit validation');
      setHasValidated(false);
      setValidationResult(null);
    }
  };

  const handleSkip = () => {
    Alert.alert(
      'Skip Validation',
      'Are you sure you want to skip this validation? You can come back to it later.',
      [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Skip', onPress: () => navigation.goBack() }
      ]
    );
  };

  const handleNext = () => {
    // In a real app, this would load the next validation clip
    Alert.alert(
      'Next Validation',
      'Loading next pronunciation to validate...',
      [
        { text: 'OK', onPress: () => navigation.goBack() }
      ]
    );
  };

  const handlePlay = async () => {
    if (!clip?.audio_url) {
      Alert.alert('No audio', 'This clip does not have an audio file.');
      return;
    }
    try {
      // If already playing for this screen, toggle pause/stop
      if (sound) {
        const status = await sound.getStatusAsync();
        if ('isLoaded' in status && status.isLoaded) {
          if (status.isPlaying) {
            await sound.pauseAsync();
            return;
          }
          // If we reached end previously, reset to start
          const atEnd =
            typeof status.positionMillis === 'number' &&
            typeof status.durationMillis === 'number' &&
            status.durationMillis > 0 &&
            status.positionMillis >= status.durationMillis - 50; // allow small epsilon
          if (atEnd) {
            await sound.setPositionAsync(0);
          }
          await sound.playAsync();
          return;
        }
      }

      setAudioLoading(true);
      const uri = await getPlayableAudioUrl(clip.audio_url);
      if (!uri) {
        setAudioLoading(false);
        Alert.alert('Error', 'Unable to load audio file');
        return;
      }
      const { sound: newSound } = await Audio.Sound.createAsync({ uri }, { shouldPlay: true });
      setSound(newSound);
      setAudioLoading(false);
      newSound.setOnPlaybackStatusUpdate(async (st) => {
        if ('didJustFinish' in st && st.didJustFinish) {
          try {
            await newSound.pauseAsync();
            await newSound.setPositionAsync(0);
          } catch {}
        }
      });
    } catch (e) {
      setAudioLoading(false);
      Alert.alert('Error', 'Failed to play audio');
    }
  };

  const renderWaveform = (waveform: number[]) => (
    <View style={styles.waveformContainer}>
      {waveform.map((height, index) => (
        <View
          key={index}
          style={[
            styles.waveformBar,
            { height: height * 0.6 }
          ]}
        />
      ))}
    </View>
  );

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor="#FFFFFF" />
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Ionicons name="arrow-back" size={24} color="#1F2937" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Validate Pronunciation</Text>
        <TouchableOpacity onPress={handleSkip}>
          <Text style={styles.skipButton}>Skip</Text>
        </TouchableOpacity>
      </View>

      {/* Language Info */}
      <View style={styles.languageCard}>
        <View style={styles.languageHeader}>
          <Ionicons name="globe" size={20} color="#FF8A00" />
          <Text style={styles.languageTitle}>
            {clip?.language || '—'}{clip?.dialect ? ` / ${clip?.dialect}` : ''}
          </Text>
        </View>
        <Text style={styles.languageDescription}>
          Help validate pronunciations in your native language
        </Text>
      </View>

      {/* Clip Information */}
      <View style={styles.clipCard}>
        <View style={styles.clipHeader}>
          <Text style={styles.clipUser}>Recording</Text>
          <View style={styles.validationBadge}>
            <Ionicons name="help-circle" size={12} color="#F59E0B" />
            <Text style={styles.validationBadgeText}>Needs Validation</Text>
          </View>
        </View>

        <View style={styles.phraseContainer}>
          <Text style={styles.phrase}>{extractOriginalPrompt(clip?.phrase || '—')}</Text>
          {mockValidationClip.context && (
            <Text style={styles.context}>{mockValidationClip.context}</Text>
          )}
        </View>

        {renderWaveform(mockValidationClip.audioWaveform)}

        <TouchableOpacity style={styles.playButton} onPress={handlePlay}>
          <Ionicons name="play" size={24} color="#FFFFFF" />
          <Text style={styles.playButtonText}>{audioLoading ? 'Loading...' : 'Listen to pronunciation'}</Text>
        </TouchableOpacity>
      </View>

      {/* Validation Question */}
      <View style={styles.questionCard}>
        <Text style={styles.questionTitle}>Is this pronunciation correct?</Text>
        <Text style={styles.questionDescription}>
          As a native speaker, does this sound accurate to you?
        </Text>

        {!hasValidated ? (
          <View style={styles.validationButtons}>
            <TouchableOpacity
              style={[styles.validationButton, styles.correctButton]}
              onPress={() => handleValidation(true)}
            >
              <Ionicons name="checkmark-circle" size={24} color="#FFFFFF" />
              <Text style={styles.validationButtonText}>Yes, Correct</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.validationButton, styles.incorrectButton]}
              onPress={() => handleValidation(false)}
            >
              <Ionicons name="close-circle" size={24} color="#FFFFFF" />
              <Text style={styles.validationButtonText}>Needs Work</Text>
            </TouchableOpacity>
          </View>
        ) : (
          <View style={styles.validationResult}>
            <View style={[
              styles.resultCard,
              validationResult === 'correct' ? styles.correctResult : styles.incorrectResult
            ]}>
              <Ionicons
                name={validationResult === 'correct' ? "checkmark-circle" : "close-circle"}
                size={32}
                color={validationResult === 'correct' ? "#10B981" : "#EF4444"}
              />
              <Text style={styles.resultTitle}>
                {validationResult === 'correct' ? 'Marked as Correct!' : 'Marked as Needs Work'}
              </Text>
              <Text style={styles.resultDescription}>
                {validationResult === 'correct'
                  ? 'Your validation helps confirm accurate pronunciations.'
                  : 'Your feedback helps the community improve their pronunciation.'
                }
              </Text>
            </View>

            <TouchableOpacity
              style={styles.nextButton}
              onPress={handleNext}
            >
              <Text style={styles.nextButtonText}>Validate Next →</Text>
            </TouchableOpacity>
          </View>
        )}
      </View>

      {/* Tips */}
      <View style={styles.tipsCard}>
        <Text style={styles.tipsTitle}>Validation Tips:</Text>
        <Text style={styles.tipText}>• Consider regional dialect differences</Text>
        <Text style={styles.tipText}>• Focus on accuracy, not accent</Text>
        <Text style={styles.tipText}>• Be encouraging and constructive</Text>
      </View>
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8F9FA',
  },
  scrollContent: {
    paddingBottom: 24,
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
  skipButton: {
    fontSize: 16,
    fontWeight: '500',
    color: '#6B7280',
  },
  languageCard: {
    backgroundColor: '#FEF3E2',
    margin: width * 0.05,
    padding: 16,
    borderRadius: 12,
  },
  languageHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
  },
  languageTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#D97706',
    marginLeft: 8,
  },
  languageDescription: {
    fontSize: 14,
    color: '#92400E',
  },
  clipCard: {
    backgroundColor: '#FFFFFF',
    margin: width * 0.05,
    padding: 20,
    borderRadius: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  clipHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  clipUser: {
    fontSize: 14,
    color: '#6B7280',
  },
  validationBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FEF3E2',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
  },
  validationBadgeText: {
    fontSize: 12,
    color: '#F59E0B',
    fontWeight: '500',
    marginLeft: 4,
  },
  phraseContainer: {
    alignItems: 'center',
    marginBottom: 20,
  },
  phrase: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#1F2937',
    marginBottom: 8,
  },
  pronunciation: {
    fontSize: 16,
    color: '#6B7280',
    fontStyle: 'italic',
    marginBottom: 8,
  },
  context: {
    fontSize: 14,
    color: '#9CA3AF',
    textAlign: 'center',
    fontStyle: 'italic',
  },
  waveformContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    height: 40,
    marginBottom: 20,
  },
  waveformBar: {
    width: 3,
    backgroundColor: '#FF8A00',
    marginHorizontal: 1,
    borderRadius: 2,
  },
  playButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#FF8A00',
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 25,
  },
  playButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '500',
    marginLeft: 8,
  },
  questionCard: {
    backgroundColor: '#FFFFFF',
    margin: width * 0.05,
    padding: 20,
    borderRadius: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  questionTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: '#1F2937',
    marginBottom: 8,
    textAlign: 'center',
  },
  questionDescription: {
    fontSize: 14,
    color: '#6B7280',
    textAlign: 'center',
    marginBottom: 24,
  },
  validationButtons: {
    flexDirection: 'row',
    gap: 12,
  },
  validationButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
    borderRadius: 12,
  },
  correctButton: {
    backgroundColor: '#10B981',
  },
  incorrectButton: {
    backgroundColor: '#EF4444',
  },
  validationButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
    marginLeft: 8,
  },
  validationResult: {
    alignItems: 'center',
  },
  resultCard: {
    alignItems: 'center',
    padding: 20,
    borderRadius: 12,
    marginBottom: 20,
    width: '100%',
  },
  correctResult: {
    backgroundColor: '#ECFDF5',
  },
  incorrectResult: {
    backgroundColor: '#FEF2F2',
  },
  resultTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1F2937',
    marginTop: 8,
    marginBottom: 4,
  },
  resultDescription: {
    fontSize: 14,
    color: '#6B7280',
    textAlign: 'center',
  },
  nextButton: {
    backgroundColor: '#FF8A00',
    paddingVertical: 12,
    paddingHorizontal: 32,
    borderRadius: 25,
  },
  nextButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
  tipsCard: {
    backgroundColor: '#FFFFFF',
    margin: width * 0.05,
    padding: 16,
    borderRadius: 12,
    marginTop: 0,
  },
  tipsTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1F2937',
    marginBottom: 8,
  },
  tipText: {
    fontSize: 14,
    color: '#6B7280',
    marginBottom: 4,
  },
});

export default ValidationScreen;