import { supabase } from '../supabaseClient';
import * as FileSystem from 'expo-file-system';

export interface UploadResult {
  success: boolean;
  url?: string;
  error?: string;
}

/**
 * Upload an audio file to Supabase Storage
 * @param fileUri - Local file URI from Expo AV recording
 * @param userId - User ID for organizing files
 * @param fileName - Optional custom filename
 * @returns Promise<UploadResult>
 */
export const uploadAudioFile = async (
  fileUri: string,
  userId: string,
  fileName?: string
): Promise<UploadResult> => {
  try {
    console.log('Starting audio file upload...');
    console.log('File URI:', fileUri);
    console.log('User ID:', userId);

    // Generate a unique filename if not provided
    const timestamp = Date.now();
    const randomId = Math.random().toString(36).substring(2, 15);
    const finalFileName = fileName || `audio_${timestamp}_${randomId}.m4a`;

    // Create the storage path
    const storagePath = `${userId}/${finalFileName}`;

    console.log('Storage path:', storagePath);

    // Read the file as base64
    const base64Data = await FileSystem.readAsStringAsync(fileUri, {
      encoding: FileSystem.EncodingType.Base64,
    });

    console.log('File read successfully, size:', base64Data.length);

    // Convert base64 to Uint8Array
    const binaryString = atob(base64Data);
    const bytes = new Uint8Array(binaryString.length);
    for (let i = 0; i < binaryString.length; i++) {
      bytes[i] = binaryString.charCodeAt(i);
    }

    // Upload to Supabase Storage
    const { data, error } = await supabase.storage
      .from('voice-clips')
      .upload(storagePath, bytes, {
        contentType: 'audio/m4a',
        cacheControl: '3600',
        upsert: false,
      });

    if (error) {
      console.error('Supabase storage upload error:', error);
      return {
        success: false,
        error: error.message,
      };
    }

    console.log('File uploaded successfully:', data);

    // Get the public URL
    const { data: urlData } = supabase.storage
      .from('voice-clips')
      .getPublicUrl(storagePath);

    const publicUrl = urlData.publicUrl;
    console.log('Public URL:', publicUrl);

    return {
      success: true,
      url: publicUrl,
    };
  } catch (error) {
    console.error('Error uploading audio file:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }
};

/**
 * Delete an audio file from Supabase Storage
 * @param filePath - Storage path of the file to delete
 * @returns Promise<boolean>
 */
export const deleteAudioFile = async (filePath: string): Promise<boolean> => {
  try {
    const { error } = await supabase.storage
      .from('voice-clips')
      .remove([filePath]);

    if (error) {
      console.error('Error deleting audio file:', error);
      return false;
    }

    return true;
  } catch (error) {
    console.error('Error deleting audio file:', error);
    return false;
  }
};
