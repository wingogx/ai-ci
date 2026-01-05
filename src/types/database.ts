export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export interface Database {
  public: {
    Tables: {
      users: {
        Row: {
          id: string
          nickname: string | null
          avatar_url: string | null
          invite_code: string
          invited_by: string | null
          help_count: number
          city: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id: string
          nickname?: string | null
          avatar_url?: string | null
          invite_code: string
          invited_by?: string | null
          help_count?: number
          city?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          nickname?: string | null
          avatar_url?: string | null
          invite_code?: string
          invited_by?: string | null
          help_count?: number
          city?: string | null
          created_at?: string
          updated_at?: string
        }
      }
      user_progress: {
        Row: {
          id: string
          user_id: string
          vocab_mode: string
          grade: string
          completed_levels: number
          learned_words: string[]
          helped_words: string[]
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          user_id: string
          vocab_mode: string
          grade: string
          completed_levels?: number
          learned_words?: string[]
          helped_words?: string[]
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          vocab_mode?: string
          grade?: string
          completed_levels?: number
          learned_words?: string[]
          helped_words?: string[]
          created_at?: string
          updated_at?: string
        }
      }
      user_stats: {
        Row: {
          id: string
          user_id: string
          total_words_learned: number
          total_levels_completed: number
          streak_days: number
          longest_streak: number
          last_play_date: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          user_id: string
          total_words_learned?: number
          total_levels_completed?: number
          streak_days?: number
          longest_streak?: number
          last_play_date?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          total_words_learned?: number
          total_levels_completed?: number
          streak_days?: number
          longest_streak?: number
          last_play_date?: string | null
          created_at?: string
          updated_at?: string
        }
      }
      learning_history: {
        Row: {
          id: string
          user_id: string
          date: string
          words_learned: number
          levels_completed: number
          play_time_minutes: number
          created_at: string
        }
        Insert: {
          id?: string
          user_id: string
          date: string
          words_learned?: number
          levels_completed?: number
          play_time_minutes?: number
          created_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          date?: string
          words_learned?: number
          levels_completed?: number
          play_time_minutes?: number
          created_at?: string
        }
      }
      user_badges: {
        Row: {
          id: string
          user_id: string
          badge_id: string
          unlocked_at: string
        }
        Insert: {
          id?: string
          user_id: string
          badge_id: string
          unlocked_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          badge_id?: string
          unlocked_at?: string
        }
      }
      invitations: {
        Row: {
          id: string
          inviter_id: string
          invitee_id: string
          status: string
          inviter_reward_claimed: boolean
          invitee_reward_claimed: boolean
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          inviter_id: string
          invitee_id: string
          status?: string
          inviter_reward_claimed?: boolean
          invitee_reward_claimed?: boolean
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          inviter_id?: string
          invitee_id?: string
          status?: string
          inviter_reward_claimed?: boolean
          invitee_reward_claimed?: boolean
          created_at?: string
          updated_at?: string
        }
      }
      share_logs: {
        Row: {
          id: string
          user_id: string | null
          share_type: string
          share_content: Json | null
          platform: string | null
          created_at: string
        }
        Insert: {
          id?: string
          user_id?: string | null
          share_type: string
          share_content?: Json | null
          platform?: string | null
          created_at?: string
        }
        Update: {
          id?: string
          user_id?: string | null
          share_type?: string
          share_content?: Json | null
          platform?: string | null
          created_at?: string
        }
      }
      daily_tasks: {
        Row: {
          id: string
          user_id: string
          date: string
          task_type: string
          target_value: number
          current_value: number
          completed: boolean
          reward_claimed: boolean
          created_at: string
        }
        Insert: {
          id?: string
          user_id: string
          date: string
          task_type: string
          target_value: number
          current_value?: number
          completed?: boolean
          reward_claimed?: boolean
          created_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          date?: string
          task_type?: string
          target_value?: number
          current_value?: number
          completed?: boolean
          reward_claimed?: boolean
          created_at?: string
        }
      }
    }
    Views: {
      leaderboard: {
        Row: {
          id: string
          nickname: string | null
          avatar_url: string | null
          city: string | null
          total_words_learned: number
          streak_days: number
          vocab_mode: string
          grade: string
          completed_levels: number
          grade_words_learned: number | null
          rank_in_grade: number
        }
      }
      city_leaderboard: {
        Row: {
          id: string
          nickname: string | null
          avatar_url: string | null
          city: string | null
          total_words_learned: number
          streak_days: number
          vocab_mode: string
          grade: string
          completed_levels: number
          grade_words_learned: number | null
          rank_in_city: number
        }
      }
    }
    Functions: {
      bind_invitation: {
        Args: {
          invitee_user_id: string
          inviter_code: string
        }
        Returns: boolean
      }
      get_user_rank_percentile: {
        Args: {
          p_user_id: string
          p_vocab_mode: string
          p_grade: string
        }
        Returns: number
      }
      update_invitation_status: {
        Args: {
          p_user_id: string
          p_new_status: string
        }
        Returns: undefined
      }
      update_user_city: {
        Args: {
          p_user_id: string
          p_city: string
        }
        Returns: undefined
      }
      get_user_city_rank_percentile: {
        Args: {
          p_user_id: string
          p_vocab_mode: string
          p_grade: string
        }
        Returns: number | null
      }
    }
  }
}

// 便捷类型别名
export type User = Database['public']['Tables']['users']['Row']
export type UserProgress = Database['public']['Tables']['user_progress']['Row']
export type UserStats = Database['public']['Tables']['user_stats']['Row']
export type LearningHistory = Database['public']['Tables']['learning_history']['Row']
export type UserBadge = Database['public']['Tables']['user_badges']['Row']
export type Invitation = Database['public']['Tables']['invitations']['Row']
export type ShareLog = Database['public']['Tables']['share_logs']['Row']
export type DailyTask = Database['public']['Tables']['daily_tasks']['Row']
export type LeaderboardEntry = Database['public']['Views']['leaderboard']['Row']
export type CityLeaderboardEntry = Database['public']['Views']['city_leaderboard']['Row']
