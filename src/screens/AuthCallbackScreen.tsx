import React, { useEffect } from 'react';
import { View, ActivityIndicator, Text, StyleSheet } from 'react-native';
import { useLinkTo, useRoute } from '@react-navigation/native';
import { supabase } from '../supabaseClient';

const AuthCallbackScreen: React.FC = () => {
  const route = useRoute<any>();
  const params = route.params || {};

  useEffect(() => {
    const run = async () => {
      try {
        // If using expo linking, you may receive the full URL via route params
        const code = params?.code || params?.queryParams?.code;
        if (code) {
          await supabase.auth.exchangeCodeForSession(code);
        }
      } catch (e) {
        // no-op, AuthGate will handle next state
      }
    };
    run();
  }, [params]);

  return (
    <View style={styles.container}>
      <ActivityIndicator size="large" color="#FF8A00" />
      <Text style={styles.text}>Completing sign in...</Text>
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: '#FFFFFF' },
  text: { marginTop: 12, color: '#6B7280' },
});

export default AuthCallbackScreen;


