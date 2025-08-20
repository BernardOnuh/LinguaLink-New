import React, { useEffect, useState } from 'react';
import { View, ActivityIndicator, Text, StyleSheet, Alert } from 'react-native';
import { useLinkTo, useRoute, useNavigation } from '@react-navigation/native';
import { supabase } from '../supabaseClient';

const AuthCallbackScreen: React.FC = () => {
  const route = useRoute<any>();
  const navigation = useNavigation<any>();
  const params = route.params || {};
  const [status, setStatus] = useState<'loading' | 'success' | 'error'>('loading');
  const [errorMessage, setErrorMessage] = useState('');

  useEffect(() => {
    const handleAuthCallback = async () => {
      try {
        setStatus('loading');

        // Handle different types of auth callbacks
        const code = params?.code || params?.queryParams?.code;
        const error = params?.error || params?.queryParams?.error;
        const errorDescription = params?.error_description || params?.queryParams?.error_description;

        if (error) {
          console.error('OAuth error:', error, errorDescription);
          setErrorMessage(errorDescription || 'Authentication failed');
          setStatus('error');
          return;
        }

        if (code) {
          console.log('Processing OAuth code...');
          const { data, error: exchangeError } = await supabase.auth.exchangeCodeForSession(code);

          if (exchangeError) {
            console.error('Code exchange error:', exchangeError);
            setErrorMessage(exchangeError.message);
            setStatus('error');
            return;
          }

          if (data.session) {
            console.log('OAuth sign-in successful');
            setStatus('success');
            // Navigation will be handled by AuthGate
          } else {
            setErrorMessage('No session received');
            setStatus('error');
          }
        } else {
          // No code provided, check if we have an active session
          const { data: { session } } = await supabase.auth.getSession();
          if (session) {
            setStatus('success');
          } else {
            setErrorMessage('No authentication code found');
            setStatus('error');
          }
        }
      } catch (e: any) {
        console.error('Auth callback error:', e);
        setErrorMessage(e?.message || 'Authentication failed');
        setStatus('error');
      }
    };

    handleAuthCallback();
  }, [params]);

  useEffect(() => {
    if (status === 'error') {
      // Show error alert and navigate back
      Alert.alert(
        'Authentication Failed',
        errorMessage,
        [
          {
            text: 'OK',
            onPress: () => navigation.navigate('SignIn'),
          },
        ]
      );
    }
  }, [status, errorMessage, navigation]);

  const getStatusText = () => {
    switch (status) {
      case 'loading':
        return 'Completing sign in...';
      case 'success':
        return 'Sign in successful!';
      case 'error':
        return 'Sign in failed';
      default:
        return 'Processing...';
    }
  };

  return (
    <View style={styles.container}>
      <ActivityIndicator
        size="large"
        color={status === 'error' ? '#EF4444' : '#FF8A00'}
      />
      <Text style={[
        styles.text,
        { color: status === 'error' ? '#EF4444' : '#6B7280' }
      ]}>
        {getStatusText()}
      </Text>
      {status === 'error' && (
        <Text style={styles.errorText}>{errorMessage}</Text>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 20,
  },
  text: {
    marginTop: 12,
    fontSize: 16,
    fontWeight: '500',
  },
  errorText: {
    marginTop: 8,
    color: '#EF4444',
    fontSize: 14,
    textAlign: 'center',
  },
});

export default AuthCallbackScreen;


