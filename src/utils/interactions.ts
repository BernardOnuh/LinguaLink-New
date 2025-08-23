import { supabase } from '../supabaseClient';

export interface Comment {
  id: string;
  voice_clip_id: string;
  user_id: string;
  parent_comment_id?: string;
  content: string;
  audio_url?: string;
  audio_duration?: number;
  likes_count: number;
  replies_count: number;
  created_at: string;
  updated_at: string;
  user: {
    id: string;
    username: string;
    full_name: string;
    avatar_url?: string;
  };
  is_liked_by_current_user?: boolean;
}

export interface Like {
  id: string;
  user_id: string;
  target_type: 'voice_clip' | 'comment';
  target_id: string;
  created_at: string;
}

export interface InteractionStats {
  likes_count: number;
  comments_count: number;
  is_liked_by_current_user: boolean;
}

/**
 * Get comments for a voice clip
 * @param clipId - ID of the voice clip
 * @param limit - Maximum number of comments to return
 * @param offset - Number of comments to skip (for pagination)
 * @param parentCommentId - Parent comment ID for replies (optional)
 * @returns Promise<Comment[]>
 */
export const getComments = async (
  clipId: string,
  limit: number = 20,
  offset: number = 0,
  parentCommentId?: string
): Promise<Comment[]> => {
  try {
    const currentUserId = (await supabase.auth.getUser()).data.user?.id;

    let query = supabase
      .from('comments')
      .select(`
        *,
        profiles!comments_user_id_fkey (
          id,
          username,
          full_name,
          avatar_url
        )
      `)
      .eq('voice_clip_id', clipId)
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1);

    if (parentCommentId) {
      query = query.eq('parent_comment_id', parentCommentId);
    } else {
      query = query.is('parent_comment_id', null); // Only top-level comments
    }

    const { data, error } = await query;

    if (error) {
      console.error('Error getting comments:', error);
      return [];
    }

    // Check if current user liked each comment
    const commentsWithLikes = await Promise.all(
      (data || []).map(async (comment) => {
        if (!currentUserId) {
          return { ...comment, user: comment.profiles, is_liked_by_current_user: false };
        }

        const { data: likeData } = await supabase
          .from('likes')
          .select('id')
          .eq('user_id', currentUserId)
          .eq('target_type', 'comment')
          .eq('target_id', comment.id)
          .single();

        return {
          ...comment,
          user: comment.profiles,
          is_liked_by_current_user: !!likeData,
        };
      })
    );

    return commentsWithLikes;
  } catch (error) {
    console.error('Error getting comments:', error);
    return [];
  }
};

/**
 * Create a new comment
 * @param clipId - ID of the voice clip
 * @param content - Comment text content
 * @param parentCommentId - Parent comment ID for replies (optional)
 * @param audioUrl - Audio URL for voice comments (optional)
 * @param audioDuration - Audio duration in seconds (optional)
 * @returns Promise<Comment | null>
 */
export const createComment = async (
  clipId: string,
  content: string,
  parentCommentId?: string,
  audioUrl?: string,
  audioDuration?: number
): Promise<Comment | null> => {
  try {
    const currentUserId = (await supabase.auth.getUser()).data.user?.id;
    if (!currentUserId) return null;

    // Get clip details for notification
    const { data: clipData } = await supabase
      .from('voice_clips')
      .select('user_id, phrase')
      .eq('id', clipId)
      .single();

    if (!clipData) return null;

    const { data, error } = await supabase
      .from('comments')
      .insert({
        voice_clip_id: clipId,
        user_id: currentUserId,
        parent_comment_id: parentCommentId || null,
        content,
        audio_url: audioUrl || null,
        audio_duration: audioDuration || null,
      })
      .select(`
        *,
        profiles!comments_user_id_fkey (
          id,
          username,
          full_name,
          avatar_url
        )
      `)
      .single();

    if (error) {
      console.error('Error creating comment:', error);
      return null;
    }

    // Create notification for the clip owner (only for top-level comments)
    if (!parentCommentId) {
      const { createCommentNotification } = await import('./notifications');
      await createCommentNotification(
        currentUserId,
        clipData.user_id,
        clipId,
        clipData.phrase,
        content
      );
    }

    return {
      ...data,
      user: data.profiles,
      is_liked_by_current_user: false,
    };
  } catch (error) {
    console.error('Error creating comment:', error);
    return null;
  }
};

/**
 * Update a comment
 * @param commentId - ID of the comment to update
 * @param content - New comment content
 * @returns Promise<boolean>
 */
export const updateComment = async (
  commentId: string,
  content: string
): Promise<boolean> => {
  try {
    const currentUserId = (await supabase.auth.getUser()).data.user?.id;
    if (!currentUserId) return false;

    const { error } = await supabase
      .from('comments')
      .update({
        content,
        updated_at: new Date().toISOString(),
      })
      .eq('id', commentId)
      .eq('user_id', currentUserId);

    if (error) {
      console.error('Error updating comment:', error);
      return false;
    }

    return true;
  } catch (error) {
    console.error('Error updating comment:', error);
    return false;
  }
};

/**
 * Delete a comment
 * @param commentId - ID of the comment to delete
 * @returns Promise<boolean>
 */
export const deleteComment = async (commentId: string): Promise<boolean> => {
  try {
    const currentUserId = (await supabase.auth.getUser()).data.user?.id;
    if (!currentUserId) return false;

    const { error } = await supabase
      .from('comments')
      .delete()
      .eq('id', commentId)
      .eq('user_id', currentUserId);

    if (error) {
      console.error('Error deleting comment:', error);
      return false;
    }

    return true;
  } catch (error) {
    console.error('Error deleting comment:', error);
    return false;
  }
};

/**
 * Like or unlike a voice clip
 * @param clipId - ID of the voice clip
 * @returns Promise<boolean>
 */
export const toggleVoiceClipLike = async (clipId: string): Promise<boolean> => {
  try {
    const currentUserId = (await supabase.auth.getUser()).data.user?.id;
    if (!currentUserId) return false;

    // Get clip details for notification
    const { data: clipData } = await supabase
      .from('voice_clips')
      .select('user_id, phrase')
      .eq('id', clipId)
      .single();

    if (!clipData) return false;

    // Check if already liked
    const { data: existingLike } = await supabase
      .from('likes')
      .select('id')
      .eq('user_id', currentUserId)
      .eq('target_type', 'voice_clip')
      .eq('target_id', clipId)
      .single();

    if (existingLike) {
      // Unlike
      const { error } = await supabase
        .from('likes')
        .delete()
        .eq('id', existingLike.id);

      if (error) {
        console.error('Error unliking voice clip:', error);
        return false;
      }
    } else {
      // Like
      const { error } = await supabase
        .from('likes')
        .insert({
          user_id: currentUserId,
          target_type: 'voice_clip',
          target_id: clipId,
        });

      if (error) {
        console.error('Error liking voice clip:', error);
        return false;
      }

      // Create notification for the clip owner
      const { createLikeNotification } = await import('./notifications');
      await createLikeNotification(
        currentUserId,
        clipData.user_id,
        clipId,
        'voice_clip',
        clipData.phrase
      );
    }

    return true;
  } catch (error) {
    console.error('Error toggling voice clip like:', error);
    return false;
  }
};

/**
 * Like or unlike a comment
 * @param commentId - ID of the comment
 * @returns Promise<boolean>
 */
export const toggleCommentLike = async (commentId: string): Promise<boolean> => {
  try {
    const currentUserId = (await supabase.auth.getUser()).data.user?.id;
    if (!currentUserId) return false;

    // Get comment details for notification
    const { data: commentData } = await supabase
      .from('comments')
      .select('user_id, content')
      .eq('id', commentId)
      .single();

    if (!commentData) return false;

    // Check if already liked
    const { data: existingLike } = await supabase
      .from('likes')
      .select('id')
      .eq('user_id', currentUserId)
      .eq('target_type', 'comment')
      .eq('target_id', commentId)
      .single();

    if (existingLike) {
      // Unlike
      const { error } = await supabase
        .from('likes')
        .delete()
        .eq('id', existingLike.id);

      if (error) {
        console.error('Error unliking comment:', error);
        return false;
      }
    } else {
      // Like
      const { error } = await supabase
        .from('likes')
        .insert({
          user_id: currentUserId,
          target_type: 'comment',
          target_id: commentId,
        });

      if (error) {
        console.error('Error liking comment:', error);
        return false;
      }

      // Create notification for the comment owner
      const { createLikeNotification } = await import('./notifications');
      await createLikeNotification(
        currentUserId,
        commentData.user_id,
        commentId,
        'comment',
        commentData.content
      );
    }

    return true;
  } catch (error) {
    console.error('Error toggling comment like:', error);
    return false;
  }
};

/**
 * Get interaction stats for a voice clip
 * @param clipId - ID of the voice clip
 * @returns Promise<InteractionStats | null>
 */
export const getInteractionStats = async (
  clipId: string
): Promise<InteractionStats | null> => {
  try {
    const currentUserId = (await supabase.auth.getUser()).data.user?.id;

    // Get voice clip data
    const { data: clipData } = await supabase
      .from('voice_clips')
      .select('likes_count, comments_count')
      .eq('id', clipId)
      .single();

    if (!clipData) return null;

    // Check if current user liked the clip
    let isLikedByCurrentUser = false;
    if (currentUserId) {
      const { data: likeData } = await supabase
        .from('likes')
        .select('id')
        .eq('user_id', currentUserId)
        .eq('target_type', 'voice_clip')
        .eq('target_id', clipId)
        .single();

      isLikedByCurrentUser = !!likeData;
    }

    return {
      likes_count: clipData.likes_count || 0,
      comments_count: clipData.comments_count || 0,
      is_liked_by_current_user: isLikedByCurrentUser,
    };
  } catch (error) {
    console.error('Error getting interaction stats:', error);
    return null;
  }
};

/**
 * Get replies for a comment
 * @param commentId - ID of the parent comment
 * @param limit - Maximum number of replies to return
 * @param offset - Number of replies to skip (for pagination)
 * @returns Promise<Comment[]>
 */
export const getCommentReplies = async (
  commentId: string,
  limit: number = 10,
  offset: number = 0
): Promise<Comment[]> => {
  try {
    const currentUserId = (await supabase.auth.getUser()).data.user?.id;

    const { data, error } = await supabase
      .from('comments')
      .select(`
        *,
        profiles!comments_user_id_fkey (
          id,
          username,
          full_name,
          avatar_url
        )
      `)
      .eq('parent_comment_id', commentId)
      .order('created_at', { ascending: true })
      .range(offset, offset + limit - 1);

    if (error) {
      console.error('Error getting comment replies:', error);
      return [];
    }

    // Check if current user liked each reply
    const repliesWithLikes = await Promise.all(
      (data || []).map(async (reply) => {
        if (!currentUserId) {
          return { ...reply, user: reply.profiles, is_liked_by_current_user: false };
        }

        const { data: likeData } = await supabase
          .from('likes')
          .select('id')
          .eq('user_id', currentUserId)
          .eq('target_type', 'comment')
          .eq('target_id', reply.id)
          .single();

        return {
          ...reply,
          user: reply.profiles,
          is_liked_by_current_user: !!likeData,
        };
      })
    );

    return repliesWithLikes;
  } catch (error) {
    console.error('Error getting comment replies:', error);
    return [];
  }
};

/**
 * Subscribe to real-time comments for a voice clip
 * @param clipId - ID of the voice clip
 * @param onComment - Callback function when new comment is received
 * @returns Promise<() => void> - Unsubscribe function
 */
export const subscribeToComments = async (
  clipId: string,
  onComment: (comment: Comment) => void
): Promise<() => void> => {
  try {
    const subscription = supabase
      .channel(`comments-${clipId}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'comments',
          filter: `voice_clip_id=eq.${clipId}`,
        },
        async (payload) => {
          const comment = payload.new as Comment;

          // Get user profile for the comment
          const { data: userProfile } = await supabase
            .from('profiles')
            .select('id, username, full_name, avatar_url')
            .eq('id', comment.user_id)
            .single();

          const fullComment: Comment = {
            ...comment,
            user: userProfile || { id: comment.user_id, username: 'Unknown', full_name: 'Unknown' },
            is_liked_by_current_user: false,
          };

          onComment(fullComment);
        }
      )
      .subscribe();

    return () => {
      subscription.unsubscribe();
    };
  } catch (error) {
    console.error('Error subscribing to comments:', error);
    return () => {};
  }
};
