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
import { useSafeAreaInsets } from 'react-native-safe-area-context';
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
  const insets = useSafeAreaInsets();
  const { signIn, signInWithGoogle, loading } = useAuth();
  const [credentials, setCredentials] = useState({
    email: '',
    password: '',
  });
  const [showPassword, setShowPassword] = useState(false);

  // Error handling states
  const [emailError, setEmailError] = useState<string>('');
  const [passwordError, setPasswordError] = useState<string>('');
  const [generalError, setGeneralError] = useState<string>('');
  const [isSigningIn, setIsSigningIn] = useState(false);

  const handleGoogleSignIn = async () => {
    // Clear previous errors
    setGeneralError('');

    const error = await signInWithGoogle();
    if (error) {
      setGeneralError(error);
    }
  };

  const handleSignIn = async () => {
    console.log('Starting sign in process...');

    // Clear previous errors
    setEmailError('');
    setPasswordError('');
    setGeneralError('');

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!credentials.email) {
      setEmailError('Email is required');
      return;
    }
    if (!emailRegex.test(credentials.email)) {
      setEmailError('Please enter a valid email address');
      return;
    }

    if (!credentials.password) {
      setPasswordError('Password is required');
      return;
    }

    console.log('Validation passed, starting authentication...');
    // Only show loading state after validation passes
    setIsSigningIn(true);
    try {
      const err = await signIn(credentials.email, credentials.password);
      console.log('Sign in result:', err);
      if (err) {
        console.log('Sign in error:', err);
        // Handle specific error types
        if (err.includes('Invalid login credentials')) {
          setGeneralError('Invalid email or password');
        } else if (err.includes('Email not confirmed')) {
          setGeneralError('Please verify your email before signing in');
        } else {
          setGeneralError(err);
        }
        return;
      }
      console.log('Sign in successful!');
      // AuthGate will switch stacks to MainTabs when session exists.
    } catch (error: any) {
      console.log('Sign in exception:', error);
      setGeneralError('An unexpected error occurred. Please try again.');
    } finally {
      setIsSigningIn(false);
    }
  };


  const handleForgotPassword = () => {
    navigation.navigate('ForgotPassword');
  };


  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor="#FF8A00" />
      <KeyboardAvoidingView
        style={styles.keyboardAvoidingView}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      >
        {/* Header */}
        <View style={[styles.formHeader, { paddingTop: insets.top + 16 }]}>
          <TouchableOpacity onPress={() => navigation.goBack()}>
            <Ionicons name="arrow-back" size={24} color="#FFFFFF" />
          </TouchableOpacity>
          <Text style={styles.formTitle}>Welcome Back</Text>
        </View>
        <Text style={styles.formSubtitle}>Continue preserving languages together</Text>

        <ScrollView
          style={styles.formContent}
          contentContainerStyle={[styles.scrollContent, { paddingBottom: insets.bottom + 24 }]}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
          {/* Email */}
          <View style={styles.inputGroup}>
            <Text style={styles.inputLabel}>Email Address</Text>
            <View style={[
              styles.inputContainer,
              emailError ? styles.inputContainerError : null
            ]}>
              <Ionicons name="mail-outline" size={20} color="#999" style={styles.inputIcon} />
              <TextInput
                style={styles.textInput}
                placeholder="Enter your email"
                placeholderTextColor="#999"
                keyboardType="email-address"
                autoCapitalize="none"
                importantForAutofill="no"
                value={credentials.email}
                onChangeText={(text) => {
                  setCredentials({ ...credentials, email: text });
                  if (emailError) setEmailError(''); // Clear error when user starts typing
                }}
              />
              {emailError ? (
                <Ionicons name="close-circle" size={16} color="#EF4444" />
              ) : null}
            </View>
            {emailError ? (
              <Text style={styles.errorText}>{emailError}</Text>
            ) : null}
          </View>

          {/* Password */}
          <View style={styles.inputGroup}>
            <Text style={styles.inputLabel}>Password</Text>
            <View style={[
              styles.inputContainer,
              passwordError ? styles.inputContainerError : null
            ]}>
              <Ionicons name="lock-closed-outline" size={20} color="#999" style={styles.inputIcon} />
              <TextInput
                style={styles.textInput}
                placeholder="Enter your password"
                placeholderTextColor="#999"
                secureTextEntry={!showPassword}
                importantForAutofill="no"
                value={credentials.password}
                onChangeText={(text) => {
                  setCredentials({ ...credentials, password: text });
                  if (passwordError) setPasswordError(''); // Clear error when user starts typing
                }}
              />
              <TouchableOpacity onPress={() => setShowPassword(!showPassword)}>
                <Ionicons
                  name={showPassword ? "eye-off-outline" : "eye-outline"}
                  size={20}
                  color="#999"
                />
              </TouchableOpacity>
              {passwordError ? (
                <Ionicons name="close-circle" size={16} color="#EF4444" style={{ marginLeft: 8 }} />
              ) : null}
            </View>
            {passwordError ? (
              <Text style={styles.errorText}>{passwordError}</Text>
            ) : null}
          </View>

          {/* General Error Message */}
          {generalError ? (
            <View style={styles.errorContainer}>
              <Ionicons name="alert-circle" size={16} color="#EF4444" />
              <Text style={styles.errorText}>{generalError}</Text>
            </View>
          ) : null}

          {/* Forgot Password */}
          <TouchableOpacity style={styles.forgotPassword} onPress={handleForgotPassword}>
            <Text style={styles.forgotPasswordText}>Forgot Password?</Text>
          </TouchableOpacity>

          {/* Sign In Button */}
          <TouchableOpacity style={styles.primaryButton} onPress={handleSignIn} disabled={isSigningIn}>
            <Text style={styles.primaryButtonText}>{isSigningIn ? 'Signing in...' : 'Sign In'}</Text>
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
  inputContainerError: {
    borderColor: '#EF4444',
    borderWidth: 1,
    backgroundColor: '#FEF2F2',
  },
  errorContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FEF2F2',
    borderColor: '#EF4444',
    borderWidth: 1,
    borderRadius: 8,
    padding: 12,
    marginBottom: 16,
  },
  errorText: {
    fontSize: width * 0.035,
    color: '#EF4444',
    marginLeft: 8,
    flex: 1,
    fontWeight: '500',
  },
});

export default SignInScreen;