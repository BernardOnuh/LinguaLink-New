// src/components/LanguagePicker.tsx
import React, { useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Modal,
  FlatList,
  Dimensions,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';

const { width, height } = Dimensions.get('window');

interface Language {
  id: string;
  name: string;
  dialect?: string;
}

interface Props {
  visible: boolean;
  onClose: () => void;
  onSelect: (language: Language) => void;
  selectedLanguage?: Language;
}

const languages: Language[] = [
  { id: 'yoruba-ekiti', name: 'Yoruba', dialect: 'Ekiti Dialect' },
  { id: 'yoruba-lagos', name: 'Yoruba', dialect: 'Lagos Dialect' },
  { id: 'igbo-nsukka', name: 'Igbo', dialect: 'Nsukka' },
  { id: 'hausa-kano', name: 'Hausa', dialect: 'Kano' },
  { id: 'twi-ashanti', name: 'Twi', dialect: 'Ashanti' },
  { id: 'swahili-coastal', name: 'Swahili', dialect: 'Coastal' },
  { id: 'zulu-kwazulu', name: 'Zulu', dialect: 'KwaZulu-Natal' },
  { id: 'amharic-central', name: 'Amharic', dialect: 'Central' },
  { id: 'other', name: 'Other...' },
];

const LanguagePicker: React.FC<Props> = ({ visible, onClose, onSelect, selectedLanguage }) => {
  const renderLanguageItem = ({ item }: { item: Language }) => (
    <TouchableOpacity
      style={[
        styles.languageItem,
        selectedLanguage?.id === item.id && styles.selectedLanguageItem
      ]}
      onPress={() => {
        onSelect(item);
        onClose();
      }}
    >
      <View style={styles.languageInfo}>
        <Text style={styles.languageName}>{item.name}</Text>
        {item.dialect && (
          <Text style={styles.dialectText}>/ {item.dialect}</Text>
        )}
      </View>
      {selectedLanguage?.id === item.id && (
        <Ionicons name="checkmark" size={20} color="#FF8A00" />
      )}
    </TouchableOpacity>
  );

  return (
    <Modal
      visible={visible}
      animationType="slide"
      presentationStyle="pageSheet"
      onRequestClose={onClose}
    >
      <View style={styles.container}>
        <View style={styles.header}>
          <TouchableOpacity onPress={onClose}>
            <Ionicons name="close" size={24} color="#666" />
          </TouchableOpacity>
          <Text style={styles.title}>Select Language</Text>
          <View style={{ width: 24 }} />
        </View>

        <FlatList
          data={languages}
          renderItem={renderLanguageItem}
          keyExtractor={(item) => item.id}
          style={styles.list}
          showsVerticalScrollIndicator={false}
        />
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E5E5',
  },
  title: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1F2937',
  },
  list: {
    flex: 1,
    paddingHorizontal: 20,
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

export default LanguagePicker;