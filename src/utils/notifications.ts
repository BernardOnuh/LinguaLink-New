import { supabase } from '../supabaseClient';

export interface Notification {
  id: string;
  user_id: string;
  type: 'new_follower' | 'new_validation' | 'clip_validated' | 'new_comment' | 'new_like' | 'comment_liked' | 'mention' | 'achievement' | 'welcome';
  title: string;
  message: string;
  data?: any;
  is_read: boolean;
  created_at: string;
}

export interface NotificationCounts {
  total_notifications: number;
  unread_count: number;
}

export interface NotificationTemplate {
  id: string;
  type: string;
  title_template: string;
  message_template: string;
}

/**
 * Get notifications for the current user
 * @param limit - Maximum number of notifications to return
 * @param offset - Number of notifications to skip (for pagination)
 * @param unreadOnly - Only return unread notifications
 * @returns Promise<Notification[]>
 */
export const getNotifications = async (
  limit: number = 20,
  offset: number = 0,
  unreadOnly: boolean = false
): Promise<Notification[]> => {
  try {
    const currentUserId = (await supabase.auth.getUser()).data.user?.id;
    if (!currentUserId) return [];

    let query = supabase
      .from('notifications')
      .select('*')
      .eq('user_id', currentUserId)
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1);

    if (unreadOnly) {
      query = query.eq('is_read', false);
    }

    const { data, error } = await query;

    if (error) {
      console.error('Error getting notifications:', error);
      return [];
    }

    return data || [];
  } catch (error) {
    console.error('Error getting notifications:', error);
    return [];
  }
};

/**
 * Get notification counts for the current user
 * @returns Promise<NotificationCounts | null>
 */
export const getNotificationCounts = async (): Promise<NotificationCounts | null> => {
  try {
    const currentUserId = (await supabase.auth.getUser()).data.user?.id;
    if (!currentUserId) return null;

    const { data, error } = await supabase
      .from('notification_counts')
      .select('total_notifications, unread_count')
      .eq('user_id', currentUserId)
      .maybeSingle();

    if (error) {
      console.error('Error getting notification counts:', error);
      return null;
    }

    // If no row exists (user has no notifications), return zero counts
    if (!data) {
      return {
        total_notifications: 0,
        unread_count: 0,
      };
    }

    return {
      total_notifications: data.total_notifications || 0,
      unread_count: data.unread_count || 0,
    };
  } catch (error) {
    console.error('Error getting notification counts:', error);
    return null;
  }
};

/**
 * Mark notifications as read
 * @param notificationIds - Array of notification IDs to mark as read (optional, marks all if not provided)
 * @returns Promise<boolean>
 */
export const markNotificationsAsRead = async (notificationIds?: string[]): Promise<boolean> => {
  try {
    const currentUserId = (await supabase.auth.getUser()).data.user?.id;
    if (!currentUserId) return false;

    let query = supabase
      .from('notifications')
      .update({ is_read: true })
      .eq('user_id', currentUserId);

    if (notificationIds && notificationIds.length > 0) {
      query = query.in('id', notificationIds);
    } else {
      query = query.eq('is_read', false);
    }

    const { error } = await query;

    if (error) {
      console.error('Error marking notifications as read:', error);
      return false;
    }

    return true;
  } catch (error) {
    console.error('Error marking notifications as read:', error);
    return false;
  }
};

/**
 * Delete a notification
 * @param notificationId - ID of the notification to delete
 * @returns Promise<boolean>
 */
export const deleteNotification = async (notificationId: string): Promise<boolean> => {
  try {
    const currentUserId = (await supabase.auth.getUser()).data.user?.id;
    if (!currentUserId) return false;

    const { error } = await supabase
      .from('notifications')
      .delete()
      .eq('id', notificationId)
      .eq('user_id', currentUserId);

    if (error) {
      console.error('Error deleting notification:', error);
      return false;
    }

    return true;
  } catch (error) {
    console.error('Error deleting notification:', error);
    return false;
  }
};

/**
 * Create a notification for a user
 * @param userId - ID of the user to notify
 * @param type - Type of notification
 * @param title - Notification title
 * @param message - Notification message
 * @param data - Additional data (optional)
 * @returns Promise<boolean>
 */
export const createNotification = async (
  userId: string,
  type: Notification['type'],
  title: string,
  message: string,
  data?: any
): Promise<boolean> => {
  try {
    const { error } = await supabase
      .from('notifications')
      .insert({
        user_id: userId,
        type,
        title,
        message,
        data: data || null,
      });

    if (error) {
      console.error('Error creating notification:', error);
      return false;
    }

    return true;
  } catch (error) {
    console.error('Error creating notification:', error);
    return false;
  }
};

/**
 * Create a follower notification
 * @param followerId - ID of the user who followed
 * @param followedId - ID of the user who was followed
 * @returns Promise<boolean>
 */
export const createFollowerNotification = async (
  followerId: string,
  followedId: string
): Promise<boolean> => {
  try {
    // Get follower's profile info
    const { data: followerProfile } = await supabase
      .from('profiles')
      .select('full_name, username')
      .eq('id', followerId)
      .single();

    if (!followerProfile) return false;

    const followerName = followerProfile.full_name || followerProfile.username;
    const title = 'New Follower';
    const message = `${followerName} started following you`;

    return await createNotification(followedId, 'new_follower', title, message, {
      follower_id: followerId,
      follower_name: followerName,
    });
  } catch (error) {
    console.error('Error creating follower notification:', error);
    return false;
  }
};

/**
 * Create a validation notification
 * @param validatorId - ID of the user who validated
 * @param clipOwnerId - ID of the clip owner
 * @param clipId - ID of the voice clip
 * @param clipPhrase - Phrase from the voice clip
 * @returns Promise<boolean>
 */
export const createValidationNotification = async (
  validatorId: string,
  clipOwnerId: string,
  clipId: string,
  clipPhrase: string
): Promise<boolean> => {
  try {
    // Get validator's profile info
    const { data: validatorProfile } = await supabase
      .from('profiles')
      .select('full_name, username')
      .eq('id', validatorId)
      .single();

    if (!validatorProfile) return false;

    const validatorName = validatorProfile.full_name || validatorProfile.username;
    const title = 'New Validation';
    const message = `${validatorName} validated your voice clip "${clipPhrase}"`;

    return await createNotification(clipOwnerId, 'new_validation', title, message, {
      validator_id: validatorId,
      validator_name: validatorName,
      clip_id: clipId,
      clip_phrase: clipPhrase,
    });
  } catch (error) {
    console.error('Error creating validation notification:', error);
    return false;
  }
};

/**
 * Create a clip validated notification (when clip reaches validation threshold)
 * @param clipOwnerId - ID of the clip owner
 * @param clipId - ID of the voice clip
 * @param clipPhrase - Phrase from the voice clip
 * @returns Promise<boolean>
 */
export const createClipValidatedNotification = async (
  clipOwnerId: string,
  clipId: string,
  clipPhrase: string
): Promise<boolean> => {
  try {
    const title = 'Clip Validated!';
    const message = `Your voice clip "${clipPhrase}" has been validated by the community`;

    return await createNotification(clipOwnerId, 'clip_validated', title, message, {
      clip_id: clipId,
      clip_phrase: clipPhrase,
    });
  } catch (error) {
    console.error('Error creating clip validated notification:', error);
    return false;
  }
};

/**
 * Create a welcome notification for new users
 * @param userId - ID of the new user
 * @returns Promise<boolean>
 */
export const createWelcomeNotification = async (userId: string): Promise<boolean> => {
  try {
    const title = 'Welcome to LinguaLink!';
    const message = 'Start recording your first voice clip to preserve languages';

    return await createNotification(userId, 'welcome', title, message);
  } catch (error) {
    console.error('Error creating welcome notification:', error);
    return false;
  }
};

/**
 * Create a comment notification
 * @param commenterId - ID of the user who commented
 * @param clipOwnerId - ID of the clip owner
 * @param clipId - ID of the voice clip
 * @param clipPhrase - Phrase from the voice clip
 * @param commentContent - Content of the comment
 * @returns Promise<boolean>
 */
export const createCommentNotification = async (
  commenterId: string,
  clipOwnerId: string,
  clipId: string,
  clipPhrase: string,
  commentContent: string
): Promise<boolean> => {
  try {
    // Don't notify if commenting on own clip
    if (commenterId === clipOwnerId) return true;

    // Get commenter's profile info
    const { data: commenterProfile } = await supabase
      .from('profiles')
      .select('full_name, username')
      .eq('id', commenterId)
      .single();

    if (!commenterProfile) return false;

    const commenterName = commenterProfile.full_name || commenterProfile.username;
    const title = 'New Comment';
    const message = `${commenterName} commented on your voice clip "${clipPhrase}"`;

    return await createNotification(clipOwnerId, 'new_comment', title, message, {
      clip_id: clipId,
      commenter_id: commenterId,
      commenter_name: commenterName,
      clip_phrase: clipPhrase,
      comment_content: commentContent.substring(0, 100), // Truncate long comments
    });
  } catch (error) {
    console.error('Error creating comment notification:', error);
    return false;
  }
};

/**
 * Create a like notification
 * @param likerId - ID of the user who liked
 * @param targetOwnerId - ID of the content owner
 * @param targetId - ID of the liked content
 * @param targetType - Type of content (voice_clip or comment)
 * @param targetContent - Content that was liked
 * @returns Promise<boolean>
 */
export const createLikeNotification = async (
  likerId: string,
  targetOwnerId: string,
  targetId: string,
  targetType: 'voice_clip' | 'comment',
  targetContent: string
): Promise<boolean> => {
  try {
    // Don't notify if liking own content
    if (likerId === targetOwnerId) return true;

    // Get liker's profile info
    const { data: likerProfile } = await supabase
      .from('profiles')
      .select('full_name, username')
      .eq('id', likerId)
      .single();

    if (!likerProfile) return false;

    const likerName = likerProfile.full_name || likerProfile.username;
    const title = targetType === 'voice_clip' ? 'New Like' : 'Comment Liked';
    const message = targetType === 'voice_clip'
      ? `${likerName} liked your voice clip "${targetContent}"`
      : `${likerName} liked your comment "${targetContent.substring(0, 50)}..."`;

    return await createNotification(targetOwnerId, 'new_like', title, message, {
      target_id: targetId,
      target_type: targetType,
      liker_id: likerId,
      liker_name: likerName,
      target_content: targetContent,
    });
  } catch (error) {
    console.error('Error creating like notification:', error);
    return false;
  }
};

/**
 * Subscribe to real-time notifications for the current user
 * @param onNotification - Callback function when new notification is received
 * @returns Promise<() => void> - Unsubscribe function
 */
export const subscribeToNotifications = async (
  onNotification: (notification: Notification) => void
): Promise<() => void> => {
  try {
    const currentUserId = (await supabase.auth.getUser()).data.user?.id;
    if (!currentUserId) return () => {};

    const subscription = supabase
      .channel('notifications')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'notifications',
          filter: `user_id=eq.${currentUserId}`,
        },
        (payload) => {
          const notification = payload.new as Notification;
          onNotification(notification);
        }
      )
      .subscribe();

    return () => {
      subscription.unsubscribe();
    };
  } catch (error) {
    console.error('Error subscribing to notifications:', error);
    return () => {};
  }
};
