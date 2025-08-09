// src/screens/LibraryScreen.tsx
import React, { useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  SafeAreaView,
  ScrollView,
  StatusBar,
  Dimensions,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { CompositeNavigationProp } from '@react-navigation/native';
import { BottomTabNavigationProp } from '@react-navigation/bottom-tabs';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RootStackParamList, TabParamList } from '../../App';

const { width, height } = Dimensions.get('window');

type LibraryScreenNavigationProp = CompositeNavigationProp<
  BottomTabNavigationProp<TabParamList, 'Library'>,
  NativeStackNavigationProp<RootStackParamList>
>;

interface Props {
  navigation: LibraryScreenNavigationProp;
}

const LibraryScreen: React.FC<Props> = ({ navigation }) => {
  const [activeTab, setActiveTab] = useState<'Voice Clips' | 'AI Stories'>('Voice Clips');

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor="#FF8A00" />
      
      {/* Header */}
      <View style={styles.header}>
        <View style={styles.headerContent}>
          <Text style={styles.headerTitle}>My Library</Text>
          <TouchableOpacity>
            <Text style={styles.editButton}>Edit</Text>
          </TouchableOpacity>
        </View>
        
        {/* Tab Selector */}
        <View style={styles.tabSelector}>
          <TouchableOpacity
            style={[
              styles.tabButton,
              activeTab === 'Voice Clips' && styles.activeTabButton
            ]}
            onPress={() => setActiveTab('Voice Clips')}
          >
            <Text style={[
              styles.tabButtonText,
              activeTab === 'Voice Clips' && styles.activeTabButtonText
            ]}>
              Voice Clips (0)
            </Text>
          </TouchableOpacity>
          
          <TouchableOpacity
            style={[
              styles.tabButton,
              activeTab === 'AI Stories' && styles.activeTabButton
            ]}
            onPress={() => setActiveTab('AI Stories')}
          >
            <Text style={[
              styles.tabButtonText,
              activeTab === 'AI Stories' && styles.activeTabButtonText
            ]}>
              AI Stories (0)
            </Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* Content */}
      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {activeTab === 'Voice Clips' && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Your Voice Contributions</Text>
            <Text style={styles.sectionDescription}>
              Voice clips you've shared to help preserve languages
            </Text>
            
            <TouchableOpacity 
              style={styles.recordButton}
              onPress={() => navigation.navigate('RecordVoice')}
            >
              <Text style={styles.recordButtonText}>Record New Clip</Text>
            </TouchableOpacity>

            {/* Empty State */}
            <View style={styles.emptyState}>
              <Ionicons name="mic-outline" size={64} color="#D1D5DB" />
              <Text style={styles.emptyStateTitle}>No voice clips yet</Text>
              <Text style={styles.emptyStateDescription}>
                Start recording to build your personal language archive
              </Text>
            </View>
          </View>
        )}

        {activeTab === 'AI Stories' && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Your AI Stories</Text>
            <Text style={styles.sectionDescription}>
              Stories you've created with AI animation
            </Text>
            
            <TouchableOpacity 
              style={styles.createStoryButton}
              onPress={() => navigation.navigate('TellStory')}
            >
              <Ionicons name="sparkles" size={16} color="#FFFFFF" />
              <Text style={styles.createStoryButtonText}>Create New Story</Text>
            </TouchableOpacity>

            {/* Empty State */}
            <View style={styles.emptyState}>
              <Ionicons name="book-outline" size={64} color="#D1D5DB" />
              <Text style={styles.emptyStateTitle}>No AI stories yet</Text>
              <Text style={styles.emptyStateDescription}>
                Tell your first story and watch AI bring it to life
              </Text>
            </View>
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8F9FA',
  },
  header: {
    backgroundColor: '#FF8A00',
    paddingTop: height * 0.02,
    paddingBottom: height * 0.02,
    paddingHorizontal: width * 0.05,
  },
  headerContent: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  headerTitle: {
    fontSize: width * 0.06,
    fontWeight: 'bold',
    color: '#FFFFFF',
  },
  editButton: {
    fontSize: 16,
    fontWeight: '500',
    color: '#FFFFFF',
  },
  tabSelector: {
    flexDirection: 'row',
    gap: 8,
  },
  tabButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
  },
  activeTabButton: {
    backgroundColor: '#FFFFFF',
  },
  tabButtonText: {
    fontSize: 14,
    fontWeight: '500',
    color: 'rgba(255, 255, 255, 0.8)',
  },
  activeTabButtonText: {
    color: '#FF8A00',
  },
  content: {
    flex: 1,
  },
  section: {
    padding: width * 0.05,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: '#1F2937',
    marginBottom: 8,
  },
  sectionDescription: {
    fontSize: 14,
    color: '#6B7280',
    marginBottom: 20,
  },
  recordButton: {
    backgroundColor: '#FF8A00',
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 8,
    alignSelf: 'flex-start',
    marginBottom: 40,
  },
  recordButtonText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '600',
  },
  createStoryButton: {
    backgroundColor: '#8B5CF6',
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 8,
    alignSelf: 'flex-start',
    marginBottom: 40,
    flexDirection: 'row',
    alignItems: 'center',
  },
  createStoryButtonText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '600',
    marginLeft: 8,
  },
  emptyState: {
    alignItems: 'center',
    paddingVertical: 60,
  },
  emptyStateTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#374151',
    marginTop: 16,
    marginBottom: 8,
  },
  emptyStateDescription: {
    fontSize: 14,
    color: '#6B7280',
    textAlign: 'center',
    lineHeight: 20,
    maxWidth: 250,
  },
});

export default LibraryScreen;