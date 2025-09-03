// src/screens/SignInScreen.tsx
import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  SafeAreaView,
  ScrollView,
  StatusBar,
  Alert,
  Dimensions,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RootStackParamList } from '../../App';
import { useAuth } from '../context/AuthProvider';

const { width, height } = Dimensions.get('window');

type SignInScreenNavigationProp = NativeStackNavigationProp<
  RootStackParamList,
  'SignIn'
>;

interface Props {
  navigation: SignInScreenNavigationProp;
}

const SignInScreen: React.FC<Props> = ({ navigation }) => {
  const { signIn, signInWithGoogle, loading } = useAuth();
  const [credentials, setCredentials] = useState({
    email: '',
    password: '',
  });
  const [showPassword, setShowPassword] = useState(false);

  const handleGoogleSignIn = async () => {
    const error = await signInWithGoogle();
    if (error) {
      Alert.alert('Google Sign-In Failed', error);
    }
  };

  const handleSignIn = async () => {
    if (!credentials.email || !credentials.password) {
      Alert.alert('Error', 'Please enter your email and password');
      return;
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(credentials.email)) {
      Alert.alert('Error', 'Please enter a valid email address');
      return;
    }

    const err = await signIn(credentials.email, credentials.password);
    if (err) {
      Alert.alert('Sign In Failed', err);
      return;
    }
    // AuthGate will switch stacks to MainTabs when session exists.
  };

  const handleDemoAccess = () => {
    setCredentials({
      email: 'demo@lingualink.app',
      password: 'demo123',
    });
    Alert.alert(
      'Demo Access',
      'Demo credentials filled in! Tap Sign In to continue.',
      [
        {
          text: 'Sign In Now',
          onPress: () => {
            Alert.alert(
              'Demo Login Success',
              'Welcome to LinguaLink Demo!'
            );
          }
        },
        {
          text: 'OK',
          style: 'cancel'
        }
      ]
    );
  };

  const handleForgotPassword = () => {
    Alert.alert(
      'Forgot Password',
      'Password reset functionality would be implemented here. For demo purposes, use:\n\nEmail: demo@lingualink.app\nPassword: demo123'
    );
  };


  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor="#FF8A00" />
      <KeyboardAvoidingView
        style={styles.keyboardAvoidingView}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      >
        {/* Header */}
        <View style={styles.formHeader}>
          <TouchableOpacity onPress={() => navigation.goBack()}>
            <Ionicons name="arrow-back" size={24} color="#FFFFFF" />
          </TouchableOpacity>
          <Text style={styles.formTitle}>Welcome Back</Text>
        </View>
        <Text style={styles.formSubtitle}>Continue preserving languages together</Text>

        <ScrollView
          style={styles.formContent}
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
          {/* Email */}
          <View style={styles.inputGroup}>
            <Text style={styles.inputLabel}>Email Address</Text>
            <View style={styles.inputContainer}>
              <Ionicons name="mail-outline" size={20} color="#999" style={styles.inputIcon} />
              <TextInput
                style={styles.textInput}
                placeholder="Enter your email"
                placeholderTextColor="#999"
                keyboardType="email-address"
                autoCapitalize="none"
                value={credentials.email}
                onChangeText={(text) => setCredentials({ ...credentials, email: text })}
              />
            </View>
          </View>

          {/* Password */}
          <View style={styles.inputGroup}>
            <Text style={styles.inputLabel}>Password</Text>
            <View style={styles.inputContainer}>
              <Ionicons name="lock-closed-outline" size={20} color="#999" style={styles.inputIcon} />
              <TextInput
                style={styles.textInput}
                placeholder="Enter your password"
                placeholderTextColor="#999"
                secureTextEntry={!showPassword}
                value={credentials.password}
                onChangeText={(text) => setCredentials({ ...credentials, password: text })}
              />
              <TouchableOpacity onPress={() => setShowPassword(!showPassword)}>
                <Ionicons
                  name={showPassword ? "eye-off-outline" : "eye-outline"}
                  size={20}
                  color="#999"
                />
              </TouchableOpacity>
            </View>
          </View>

          {/* Forgot Password */}
          <TouchableOpacity style={styles.forgotPassword} onPress={handleForgotPassword}>
            <Text style={styles.forgotPasswordText}>Forgot Password?</Text>
          </TouchableOpacity>

          {/* Sign In Button */}
          <TouchableOpacity style={styles.primaryButton} onPress={handleSignIn} disabled={loading}>
            <Text style={styles.primaryButtonText}>{loading ? 'Signing in...' : 'Sign In'}</Text>
          </TouchableOpacity>

          {/* Google Sign In */}
          <TouchableOpacity style={styles.googleButton} onPress={handleGoogleSignIn} disabled={loading}>
            <Ionicons name="logo-google" size={18} color="#EA4335" style={{ marginRight: 8 }} />
            <Text style={styles.googleButtonText}>Continue with Google</Text>
          </TouchableOpacity>

          {/* Sign Up Link */}
          <View style={styles.linkContainer}>
            <Text style={styles.linkText}>Don't have an account? </Text>
            <TouchableOpacity onPress={() => navigation.navigate('SignUp')}>
              <Text style={styles.linkButton}>Sign Up</Text>
            </TouchableOpacity>
          </View>

          {/* Demo Access */}
          <TouchableOpacity style={styles.demoAccess} onPress={handleDemoAccess}>
            <Text style={styles.demoTitle}>Demo Access</Text>
            <Text style={styles.demoDescription}>Use any email and password to sign in</Text>
            <Text style={styles.demoExample}>Example: demo@lingualink.app</Text>
            <Text style={styles.demoPassword}>Password: demo123</Text>
          </TouchableOpacity>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FF8A00',
  },
  keyboardAvoidingView: {
    flex: 1,
  },
  formHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: width * 0.05,
    paddingTop: height * 0.06,
    paddingBottom: height * 0.02,
  },
  formTitle: {
    fontSize: width * 0.06,
    fontWeight: 'bold',
    color: '#FFFFFF',
    marginLeft: 20,
  },
  formSubtitle: {
    fontSize: width * 0.04,
    color: 'rgba(255, 255, 255, 0.9)',
    paddingHorizontal: width * 0.05,
    paddingBottom: height * 0.02,
  },
  formContent: {
    flex: 1,
    backgroundColor: '#F8F9FA',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
  },
  scrollContent: {
    paddingHorizontal: width * 0.05,
    paddingTop: height * 0.04,
    paddingBottom: height * 0.05,
    flexGrow: 1,
    justifyContent: 'center',
  },
  inputGroup: {
    marginBottom: height * 0.025,
  },
  inputLabel: {
    fontSize: width * 0.04,
    fontWeight: '600',
    color: '#1F2937',
    marginBottom: 8,
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F3F4F6',
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: height * 0.015,
    minHeight: 50,
  },
  inputIcon: {
    marginRight: 12,
  },
  textInput: {
    flex: 1,
    fontSize: width * 0.04,
    color: '#1F2937',
  },
  forgotPassword: {
    alignSelf: 'flex-end',
    marginBottom: height * 0.04,
  },
  forgotPasswordText: {
    fontSize: width * 0.035,
    color: '#FF8A00',
    fontWeight: '500',
  },
  primaryButton: {
    backgroundColor: '#FF8A00',
    paddingVertical: height * 0.02,
    paddingHorizontal: 24,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
    minHeight: 50,
  },
  primaryButtonText: {
    color: '#FFFFFF',
    fontSize: width * 0.04,
    fontWeight: '600',
  },
  googleButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E5E7EB',
    paddingVertical: height * 0.018,
    borderRadius: 12,
    marginBottom: 16,
  },
  googleButtonText: {
    color: '#111827',
    fontSize: width * 0.04,
    fontWeight: '600',
  },
  linkContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginTop: 20,
    marginBottom: 30,
  },
  linkText: {
    fontSize: width * 0.035,
    color: '#6B7280',
  },
  linkButton: {
    fontSize: width * 0.035,
    color: '#FF8A00',
    fontWeight: '600',
  },
  demoAccess: {
    backgroundColor: '#EEF2FF',
    borderRadius: 12,
    padding: 16,
    marginTop: 20,
    marginBottom: 30,
  },
  demoTitle: {
    fontSize: width * 0.04,
    fontWeight: '600',
    color: '#4F46E5',
    marginBottom: 4,
  },
  demoDescription: {
    fontSize: width * 0.035,
    color: '#6366F1',
    marginBottom: 8,
  },
  demoExample: {
    fontSize: width * 0.03,
    color: '#6366F1',
    fontWeight: '500',
  },
  demoPassword: {
    fontSize: width * 0.03,
    color: '#6366F1',
    fontWeight: '500',
  },
});

export default SignInScreen;