import React, { useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  SafeAreaView,
  StatusBar,
  Dimensions,
  Alert,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RootStackParamList } from '../../App';

const { width, height } = Dimensions.get('window');

type ValidationScreenNavigationProp = NativeStackNavigationProp<
  RootStackParamList,
  'Validation'
>;

interface Props {
  navigation: ValidationScreenNavigationProp;
}

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

const ValidationScreen: React.FC<Props> = ({ navigation }) => {
  const [hasValidated, setHasValidated] = useState(false);
  const [validationResult, setValidationResult] = useState<'correct' | 'incorrect' | null>(null);

  const handleValidation = (isCorrect: boolean) => {
    setValidationResult(isCorrect ? 'correct' : 'incorrect');
    setHasValidated(true);

    const points = isCorrect ? 10 : 5; // Points for validation
    const message = isCorrect
      ? `Great! You've confirmed this pronunciation is correct. +${points} points earned!`
      : `Thank you for the feedback. This helps the community learn. +${points} points earned!`;

    Alert.alert('Validation Submitted', message);
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
            {mockValidationClip.language} / {mockValidationClip.dialect}
          </Text>
        </View>
        <Text style={styles.languageDescription}>
          Help validate pronunciations in your native language
        </Text>
      </View>

      {/* Clip Information */}
      <View style={styles.clipCard}>
        <View style={styles.clipHeader}>
          <Text style={styles.clipUser}>Recording by {mockValidationClip.user}</Text>
          <View style={styles.validationBadge}>
            <Ionicons name="help-circle" size={12} color="#F59E0B" />
            <Text style={styles.validationBadgeText}>Needs Validation</Text>
          </View>
        </View>

        <View style={styles.phraseContainer}>
          <Text style={styles.phrase}>{mockValidationClip.phrase}</Text>
          <Text style={styles.pronunciation}>{mockValidationClip.pronunciation}</Text>
          {mockValidationClip.context && (
            <Text style={styles.context}>{mockValidationClip.context}</Text>
          )}
        </View>

        {renderWaveform(mockValidationClip.audioWaveform)}

        <TouchableOpacity style={styles.playButton}>
          <Ionicons name="play" size={24} color="#FFFFFF" />
          <Text style={styles.playButtonText}>Listen to pronunciation</Text>
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