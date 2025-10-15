// src/screens/StoryViewScreen.tsx
import React, { useEffect } from 'react';
import { SafeAreaView, View, StyleSheet, Dimensions, TouchableOpacity, Text, Image } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { supabase } from '../supabaseClient';
import { useAuth } from '../context/AuthProvider';
import { VideoView, useVideoPlayer } from 'expo-video';

const { width, height } = Dimensions.get('window');

const isVideoUrl = (url?: string) => {
  if (!url) return false;
  const u = url.toLowerCase();
  return u.endsWith('.mp4') || u.endsWith('.mov') || u.endsWith('.webm');
};

const StoryViewScreen: React.FC<any> = ({ navigation, route }) => {
  const { user } = useAuth();
  const story = route.params?.story as { id: string; user: { name: string }; thumbnail: string; timestamp?: string; viewed?: boolean; mediaUrl?: string; media_url?: string } | undefined;
  const mediaUrl = (story as any)?.mediaUrl || (story as any)?.media_url || '';
  const videoPlayer = useVideoPlayer(mediaUrl);

  useEffect(() => {
    const markViewed = async () => {
      if (!user?.id || !story?.id) return;
      try {
        await supabase.from('story_views').upsert({ story_id: story.id, user_id: user.id });
      } catch {}
    };
    markViewed();
  }, [user?.id, story?.id]);

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Ionicons name="close" size={28} color="#FFFFFF" />
        </TouchableOpacity>
        <Text style={styles.title} numberOfLines={1}>{story?.user?.name || 'Story'}</Text>
        <View style={{ width: 28 }} />
      </View>

      <View style={styles.mediaBox}>
        {!mediaUrl ? (
          <Text style={{ color: '#FFF' }}>No media</Text>
        ) : isVideoUrl(mediaUrl) ? (
          <VideoView
            style={styles.media}
            player={videoPlayer}
          />
        ) : (
          <Image source={{ uri: mediaUrl }} style={styles.media} resizeMode="contain" />
        )}
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#000' },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  title: { color: '#FFF', fontWeight: '600', maxWidth: width * 0.7 },
  mediaBox: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  media: { width, height: height * 0.8 },
});

export default StoryViewScreen;


