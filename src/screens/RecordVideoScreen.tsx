// src/screens/RecordVideoScreen.tsx
import React, { useEffect, useRef, useState } from 'react';
import {
  SafeAreaView,
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  StatusBar,
  Dimensions,
  ScrollView,
  Modal,
  TextInput,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { VideoView, useVideoPlayer } from 'expo-video';
import * as DocumentPicker from 'expo-document-picker';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RootStackParamList } from '../../App';
import { useAuth } from '../context/AuthProvider';
import { supabase } from '../supabaseClient';
import { uploadVideoFile } from '../utils/storage';

const { width, height } = Dimensions.get('window');

type RecordVideoScreenNavigationProp = NativeStackNavigationProp<
  RootStackParamList,
  'RecordVideo'
>;

interface Props {
  navigation: RecordVideoScreenNavigationProp;
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

const RecordVideoScreen: React.FC<Props> = ({ navigation }) => {
  const { user } = useAuth();
  const [selectedLanguage, setSelectedLanguage] = useState<Language | null>(null);
  const [showLanguageModal, setShowLanguageModal] = useState(false);
  const [prompt, setPrompt] = useState('');
  const [isSaving, setIsSaving] = useState(false);
  const [uploadProgress, setUploadProgress] = useState('');
  const [videoUri, setVideoUri] = useState<string | null>(null);
  const player = useVideoPlayer(videoUri ? { uri: videoUri } : undefined as any, (p) => {
    p.loop = false;
    p.staysActiveInBackground = false;
  });

  useEffect(() => {
    // Default to editing prompt immediately
  }, []);

  const handlePickVideo = async () => {
    if (!selectedLanguage) {
      Alert.alert('Select Language', "Please select the language you'll be speaking in before uploading.");
      setShowLanguageModal(true);
      return;
    }
    try {
      const result = await DocumentPicker.getDocumentAsync({
        type: ['video/*'],
        multiple: false,
        copyToCacheDirectory: true,
      });
      if (result.canceled) return;
      const file = result.assets?.[0];
      if (!file?.uri) return;
      setVideoUri(file.uri);
      Alert.alert('Video Selected', 'Your video is ready to upload.');
    } catch (e) {
      console.error('pick video error', e);
      Alert.alert('Error', 'Failed to pick video');
    }
  };

  const handleSave = async () => {

  if (!selectedLanguage || !videoUri) {
    Alert.alert('Error', 'Missing required information.');
    return;
  }
    const finalPrompt = prompt.trim();
    if (!finalPrompt) {
      Alert.alert('Add a prompt', 'Please write a short phrase that describes the video.');
      return;
    }

    setIsSaving(true);
    setUploadProgress('Uploading video...');
    try {
      const upload = await uploadVideoFile(videoUri, user!.id);
      if (!upload.success || !upload.url) {
        throw new Error(upload.error || 'Upload failed');
      }
      setUploadProgress('Saving to database...');

      const { error } = await supabase
        .from('video_clips')
        .insert({
          phrase: finalPrompt,
          translation: '',
          video_url: upload.url,
          thumbnail_url: null,
          language: selectedLanguage.name,
          dialect: selectedLanguage.dialect || null,
          duration: null,
          clip_type: 'original',
        });

      if (error) throw error;

      Alert.alert('Success', 'Your video has been uploaded!', [
        { text: 'OK', onPress: () => navigation.goBack() },
      ]);
    } catch (e) {
      console.error('save video error', e);
      Alert.alert('Error', 'Failed to save video');
    } finally {
      setIsSaving(false);
      setUploadProgress('');
    }
  };

  const LanguageModal = () => (
    <Modal visible={showLanguageModal} animationType="slide" onRequestClose={() => setShowLanguageModal(false)}>
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
              style={[styles.languageItem, selectedLanguage?.id === language.id && styles.selectedLanguageItem]}
              onPress={() => { setSelectedLanguage(language); setShowLanguageModal(false); }}
            >
              <View style={styles.languageInfo}>
                <Text style={styles.languageName}>{language.name}</Text>
                {language.dialect && <Text style={styles.dialectText}>/ {language.dialect}</Text>}
              </View>
              {selectedLanguage?.id === language.id && <Ionicons name="checkmark" size={20} color="#FF8A00" />}
            </TouchableOpacity>
          ))}
        </View>
      </SafeAreaView>
    </Modal>
  );

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor="#FFFFFF" />
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Ionicons name="arrow-back" size={24} color="#1F2937" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Upload Video</Text>
        <View style={{ width: 24 }} />
      </View>

      <ScrollView style={styles.scrollView} contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        {/* Language selector */}
        <TouchableOpacity style={styles.languageSelector} onPress={() => setShowLanguageModal(true)}>
          <Ionicons name="globe-outline" size={20} color="#FF8A00" />
          <Text style={[styles.languageSelectorText, selectedLanguage && styles.languageSelected]}>
            {selectedLanguage ? `${selectedLanguage.name}${selectedLanguage.dialect ? ` / ${selectedLanguage.dialect}` : ''}` : 'Select your language'}
          </Text>
          <Ionicons name="chevron-down" size={20} color="#999" />
        </TouchableOpacity>

        {/* Prompt */}
        <View style={styles.promptCard}>
          <View style={styles.promptHeader}>
            <Text style={styles.promptTitle}>Your Prompt</Text>
          </View>
          <TextInput
            style={styles.promptInput}
            value={prompt}
            onChangeText={setPrompt}
            placeholder="Describe what you're saying in the video..."
            multiline
            textAlignVertical="top"
          />
          <Text style={styles.promptSubtext}>Write a short phrase that matches your video</Text>
        </View>

        {/* Upload */}
        <View style={styles.uploadContainer}>
          <TouchableOpacity
            style={[styles.uploadButton, (!selectedLanguage) && styles.disabledButton]}
            onPress={handlePickVideo}
            disabled={!selectedLanguage}
          >
            <Ionicons name="cloud-upload" size={28} color="#FFFFFF" />
            <Text style={styles.uploadText}>{videoUri ? 'Change Video' : 'Choose Video'}</Text>
          </TouchableOpacity>
        </View>

        {/* Preview */}
        {videoUri && (
          <View style={styles.previewContainer}>
            <VideoView
              style={styles.videoPreview}
              player={player}
              fullscreenOptions={{ enable: true }}
              allowsPictureInPicture
              nativeControls
            />
          </View>
        )}

        {/* Save */}
        {videoUri && (
          <View style={styles.actionButtons}>
            <TouchableOpacity
              style={[styles.saveButton, isSaving && styles.disabledButton]}
              onPress={handleSave}
              disabled={isSaving}
            >
              {isSaving ? <ActivityIndicator size="small" color="#FFFFFF" /> : <Ionicons name="checkmark" size={20} color="#FFFFFF" />}
              <Text style={styles.saveButtonText}>{isSaving ? (uploadProgress || 'Saving...') : 'Save Video'}</Text>
            </TouchableOpacity>
          </View>
        )}
      </ScrollView>

      <LanguageModal />
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F8F9FA' },
  scrollView: { flex: 1 },
  scrollContent: { flexGrow: 1, paddingBottom: 20 },
  header: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: width * 0.05, paddingVertical: 16, backgroundColor: '#FFFFFF',
    borderBottomWidth: 1, borderBottomColor: '#E5E5E5',
  },
  headerTitle: { fontSize: 18, fontWeight: '600', color: '#1F2937' },
  languageSelector: {
    flexDirection: 'row', alignItems: 'center', backgroundColor: '#FFFFFF',
    marginHorizontal: width * 0.05, padding: 16, borderRadius: 12, marginBottom: 16,
    borderWidth: 1, borderColor: '#E5E5E5',
  },
  languageSelectorText: { flex: 1, fontSize: 16, color: '#9CA3AF', marginLeft: 12 },
  languageSelected: { color: '#1F2937', fontWeight: '500' },
  promptCard: { backgroundColor: '#FEF3E2', margin: width * 0.05, padding: 20, borderRadius: 16 },
  promptHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 },
  promptTitle: { fontSize: 16, fontWeight: '600', color: '#D97706', flex: 1 },
  promptInput: {
    fontSize: 16, color: '#92400E', marginBottom: 4, lineHeight: 22, backgroundColor: '#FFFFFF',
    borderRadius: 8, padding: 12, borderWidth: 1, borderColor: '#F3F4F6', minHeight: 60,
  },
  promptSubtext: { fontSize: 14, color: '#A16207' },
  uploadContainer: { alignItems: 'center', marginTop: 16 },
  uploadButton: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center', backgroundColor: '#FF8A00',
    borderRadius: 12, paddingVertical: 16, paddingHorizontal: 20,
  },
  uploadText: { color: '#FFFFFF', fontSize: 16, fontWeight: '600', marginLeft: 8 },
  previewContainer: { marginTop: 16, marginHorizontal: width * 0.05, borderRadius: 12, overflow: 'hidden', backgroundColor: '#000' },
  videoPreview: { width: '100%', height: 220 },
  disabledButton: { backgroundColor: '#D1D5DB' },
  actionButtons: { paddingHorizontal: width * 0.05, paddingBottom: 30, marginTop: 16 },
  saveButton: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center', backgroundColor: '#FF8A00',
    borderRadius: 12, paddingVertical: 16,
  },
  saveButtonText: { color: '#FFFFFF', fontSize: 16, fontWeight: '600', marginLeft: 8 },
  modalContainer: { flex: 1, backgroundColor: '#FFFFFF' },
  modalHeader: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 20,
    paddingVertical: 16, borderBottomWidth: 1, borderBottomColor: '#E5E5E5',
  },
  modalTitle: { fontSize: 18, fontWeight: '600', color: '#1F2937' },
  languageList: { flex: 1, paddingHorizontal: 20, paddingTop: 16 },
  languageItem: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingVertical: 16, borderBottomWidth: 1, borderBottomColor: '#F3F4F6' },
  selectedLanguageItem: { backgroundColor: '#FEF3E2' },
  languageInfo: { flex: 1 },
  languageName: { fontSize: 16, fontWeight: '500', color: '#1F2937' },
  dialectText: { fontSize: 14, color: '#6B7280', marginTop: 2 },
});

export default RecordVideoScreen;


