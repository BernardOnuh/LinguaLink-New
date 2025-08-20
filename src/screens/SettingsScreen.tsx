// src/screens/SettingsScreen.tsx
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
  Switch,
  Alert,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RootStackParamList } from '../../App';
import LanguagePicker from '../components/LanguagePicker';
import { useAuth } from '../context/AuthProvider';

const { width, height } = Dimensions.get('window');

type SettingsScreenNavigationProp = NativeStackNavigationProp<
  RootStackParamList,
  'Settings'
>;

interface Props {
  navigation: SettingsScreenNavigationProp;
}

interface Language {
  id: string;
  name: string;
  dialect?: string;
}

const SettingsScreen: React.FC<Props> = ({ navigation }) => {
  const { signOut } = useAuth();
  const [notificationSettings, setNotificationSettings] = useState({
    likes: true,
    duets: true,
    validations: false,
  });
  const [showLanguagePicker, setShowLanguagePicker] = useState(false);
  const [primaryLanguage, setPrimaryLanguage] = useState<Language>({
    id: 'yoruba-ekiti',
    name: 'Yoruba',
    dialect: 'Ekiti Dialect'
  });

  const handleLogout = () => {
    Alert.alert(
      'Logout',
      'Are you sure you want to logout?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Logout',
          style: 'destructive',
          onPress: async () => {
            await signOut();
            navigation.reset({
              index: 0,
              routes: [{ name: 'Welcome' }],
            });
          }
        }
      ]
    );
  };

  const SettingsSection: React.FC<{
    title: string;
    icon: keyof typeof Ionicons.glyphMap;
    iconColor: string;
    children: React.ReactNode;
  }> = ({ title, icon, iconColor, children }) => (
    <View style={styles.section}>
      <View style={styles.sectionHeader}>
        <Ionicons name={icon} size={20} color={iconColor} />
        <Text style={styles.sectionTitle}>{title}</Text>
      </View>
      <View style={styles.sectionContent}>
        {children}
      </View>
    </View>
  );

  const SettingsItem: React.FC<{
    title: string;
    subtitle?: string;
    onPress?: () => void;
    showArrow?: boolean;
    rightContent?: React.ReactNode;
  }> = ({ title, subtitle, onPress, showArrow = true, rightContent }) => (
    <TouchableOpacity
      style={styles.settingsItem}
      onPress={onPress}
      disabled={!onPress}
    >
      <View style={styles.settingsItemContent}>
        <Text style={styles.settingsItemTitle}>{title}</Text>
        {subtitle && (
          <Text style={styles.settingsItemSubtitle}>{subtitle}</Text>
        )}
      </View>
      {rightContent || (showArrow && onPress && (
        <Ionicons name="chevron-forward" size={20} color="#9CA3AF" />
      ))}
    </TouchableOpacity>
  );

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor="#FFFFFF" />

      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Ionicons name="arrow-back" size={24} color="#1F2937" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Settings</Text>
        <View style={{ width: 24 }} />
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {/* Account Section */}
        <SettingsSection
          title="Account"
          icon="person-outline"
          iconColor="#FF8A00"
        >
          <SettingsItem
            title="Edit Profile"
            onPress={() => Alert.alert('Edit Profile', 'Profile editing coming soon!')}
          />
          <SettingsItem
            title="Change Password"
            onPress={() => Alert.alert('Change Password', 'Password change coming soon!')}
          />
          <SettingsItem
            title="Privacy Settings"
            onPress={() => Alert.alert('Privacy Settings', 'Privacy settings coming soon!')}
          />
        </SettingsSection>

        {/* Language Settings */}
        <SettingsSection
          title="Language Settings"
          icon="globe-outline"
          iconColor="#10B981"
        >
          <SettingsItem
            title="Primary Language"
            subtitle={`${primaryLanguage.name}${primaryLanguage.dialect ? ` / ${primaryLanguage.dialect}` : ''}`}
            onPress={() => setShowLanguagePicker(true)}
          />
          <SettingsItem
            title="Add Languages"
            onPress={() => Alert.alert('Add Languages', 'Coming soon! You\'ll be able to add multiple languages.')}
          />
        </SettingsSection>

        {/* Notifications */}
        <SettingsSection
          title="Notifications"
          icon="notifications-outline"
          iconColor="#8B5CF6"
        >
          <SettingsItem
            title="Likes on my clips"
            subtitle="Get notified when someone likes your voice clips"
            showArrow={false}
            rightContent={
              <Switch
                value={notificationSettings.likes}
                onValueChange={(value) =>
                  setNotificationSettings(prev => ({ ...prev, likes: value }))
                }
                trackColor={{ false: '#D1D5DB', true: '#FF8A00' }}
                thumbColor="#FFFFFF"
              />
            }
          />
          <SettingsItem
            title="Duet replies"
            subtitle="When someone creates a duet response"
            showArrow={false}
            rightContent={
              <Switch
                value={notificationSettings.duets}
                onValueChange={(value) =>
                  setNotificationSettings(prev => ({ ...prev, duets: value }))
                }
                trackColor={{ false: '#D1D5DB', true: '#FF8A00' }}
                thumbColor="#FFFFFF"
              />
            }
          />
          <SettingsItem
            title="Validation requests"
            subtitle="New clips to validate in your languages"
            showArrow={false}
            rightContent={
              <Switch
                value={notificationSettings.validations}
                onValueChange={(value) =>
                  setNotificationSettings(prev => ({ ...prev, validations: value }))
                }
                trackColor={{ false: '#D1D5DB', true: '#FF8A00' }}
                thumbColor="#FFFFFF"
              />
            }
          />
        </SettingsSection>

        {/* App Info */}
        <SettingsSection
          title="About"
          icon="information-circle-outline"
          iconColor="#6B7280"
        >
          <SettingsItem
            title="Version"
            subtitle="1.0.0"
            showArrow={false}
          />
          <SettingsItem
            title="Terms of Service"
            onPress={() => Alert.alert('Terms of Service', 'Terms coming soon!')}
          />
          <SettingsItem
            title="Privacy Policy"
            onPress={() => Alert.alert('Privacy Policy', 'Privacy policy coming soon!')}
          />
          <SettingsItem
            title="Contact Support"
            onPress={() => Alert.alert('Contact Support', 'Support: hello@lingualink.app')}
          />
        </SettingsSection>

        {/* Logout Button */}
        <TouchableOpacity style={styles.logoutButton} onPress={handleLogout}>
          <Ionicons name="log-out-outline" size={20} color="#EF4444" />
          <Text style={styles.logoutText}>Logout</Text>
        </TouchableOpacity>

        <View style={styles.bottomPadding} />
      </ScrollView>

      {/* Language Picker Modal */}
      <LanguagePicker
        visible={showLanguagePicker}
        onClose={() => setShowLanguagePicker(false)}
        onSelect={(language) => setPrimaryLanguage(language)}
        selectedLanguage={primaryLanguage}
      />
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
  content: {
    flex: 1,
  },
  section: {
    marginTop: 24,
    marginHorizontal: width * 0.05,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1F2937',
    marginLeft: 8,
  },
  sectionContent: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 2,
  },
  settingsItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
  },
  settingsItemContent: {
    flex: 1,
  },
  settingsItemTitle: {
    fontSize: 16,
    fontWeight: '500',
    color: '#1F2937',
    marginBottom: 2,
  },
  settingsItemSubtitle: {
    fontSize: 14,
    color: '#6B7280',
    lineHeight: 18,
  },
  logoutButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
    marginHorizontal: width * 0.05,
    marginTop: 32,
    borderWidth: 1,
    borderColor: '#FEE2E2',
  },
  logoutText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#EF4444',
    marginLeft: 8,
  },
  bottomPadding: {
    height: 40,
  },
});

export default SettingsScreen;