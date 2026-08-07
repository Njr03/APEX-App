export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[];

export type Database = {
  public: {
    Tables: {
      profiles: {
        Row: {
          id: string;
          display_name: string | null;
          username: string;
          avatar_url: string | null;
          unit_preference: 'kg' | 'lb';
          current_streak: number;
          longest_streak: number;
          total_xp: number;
          created_at: string;
        };
        Insert: {
          id: string;
          display_name?: string | null;
          username: string;
          avatar_url?: string | null;
          unit_preference?: 'kg' | 'lb';
          current_streak?: number;
          longest_streak?: number;
          total_xp?: number;
          created_at?: string;
        };
        Update: {
          id?: string;
          display_name?: string | null;
          username?: string;
          avatar_url?: string | null;
          unit_preference?: 'kg' | 'lb';
          current_streak?: number;
          longest_streak?: number;
          total_xp?: number;
          created_at?: string;
        };
        Relationships: [];
      };
      exercises: {
        Row: {
          id: string;
          name: string;
          muscle_group: string;
          equipment: string | null;
          exercise_type: string | null;
          is_custom: boolean;
          created_by: string | null;
          instructions: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          name: string;
          muscle_group: string;
          equipment?: string | null;
          exercise_type?: string | null;
          is_custom?: boolean;
          created_by?: string | null;
          instructions?: string | null;
          created_at?: string;
        };
        Update: {
          id?: string;
          name?: string;
          muscle_group?: string;
          equipment?: string | null;
          exercise_type?: string | null;
          is_custom?: boolean;
          created_by?: string | null;
          instructions?: string | null;
          created_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: 'exercises_created_by_fkey';
            columns: ['created_by'];
            isOneToOne: false;
            referencedRelation: 'profiles';
            referencedColumns: ['id'];
          },
        ];
      };
      routines: {
        Row: {
          id: string;
          user_id: string;
          name: string;
          description: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          name: string;
          description?: string | null;
          created_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          name?: string;
          description?: string | null;
          created_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: 'routines_user_id_fkey';
            columns: ['user_id'];
            isOneToOne: false;
            referencedRelation: 'profiles';
            referencedColumns: ['id'];
          },
        ];
      };
      routine_exercises: {
        Row: {
          id: string;
          routine_id: string;
          exercise_id: string;
          order_index: number;
          target_sets: number | null;
          target_reps: number | null;
          target_weight: number | null;
        };
        Insert: {
          id?: string;
          routine_id: string;
          exercise_id: string;
          order_index: number;
          target_sets?: number | null;
          target_reps?: number | null;
          target_weight?: number | null;
        };
        Update: {
          id?: string;
          routine_id?: string;
          exercise_id?: string;
          order_index?: number;
          target_sets?: number | null;
          target_reps?: number | null;
          target_weight?: number | null;
        };
        Relationships: [
          {
            foreignKeyName: 'routine_exercises_routine_id_fkey';
            columns: ['routine_id'];
            isOneToOne: false;
            referencedRelation: 'routines';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'routine_exercises_exercise_id_fkey';
            columns: ['exercise_id'];
            isOneToOne: false;
            referencedRelation: 'exercises';
            referencedColumns: ['id'];
          },
        ];
      };
      workouts: {
        Row: {
          id: string;
          user_id: string;
          routine_id: string | null;
          name: string;
          status: 'in_progress' | 'completed';
          started_at: string;
          completed_at: string | null;
          duration_seconds: number | null;
          total_volume: number;
          notes: string | null;
        };
        Insert: {
          id?: string;
          user_id: string;
          routine_id?: string | null;
          name: string;
          status?: 'in_progress' | 'completed';
          started_at?: string;
          completed_at?: string | null;
          duration_seconds?: number | null;
          total_volume?: number;
          notes?: string | null;
        };
        Update: {
          id?: string;
          user_id?: string;
          routine_id?: string | null;
          name?: string;
          status?: 'in_progress' | 'completed';
          started_at?: string;
          completed_at?: string | null;
          duration_seconds?: number | null;
          total_volume?: number;
          notes?: string | null;
        };
        Relationships: [
          {
            foreignKeyName: 'workouts_user_id_fkey';
            columns: ['user_id'];
            isOneToOne: false;
            referencedRelation: 'profiles';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'workouts_routine_id_fkey';
            columns: ['routine_id'];
            isOneToOne: false;
            referencedRelation: 'routines';
            referencedColumns: ['id'];
          },
        ];
      };
      workout_exercises: {
        Row: {
          id: string;
          workout_id: string;
          exercise_id: string;
          order_index: number;
          notes: string | null;
        };
        Insert: {
          id?: string;
          workout_id: string;
          exercise_id: string;
          order_index: number;
          notes?: string | null;
        };
        Update: {
          id?: string;
          workout_id?: string;
          exercise_id?: string;
          order_index?: number;
          notes?: string | null;
        };
        Relationships: [
          {
            foreignKeyName: 'workout_exercises_workout_id_fkey';
            columns: ['workout_id'];
            isOneToOne: false;
            referencedRelation: 'workouts';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'workout_exercises_exercise_id_fkey';
            columns: ['exercise_id'];
            isOneToOne: false;
            referencedRelation: 'exercises';
            referencedColumns: ['id'];
          },
        ];
      };
      sets: {
        Row: {
          id: string;
          workout_exercise_id: string;
          set_number: number;
          weight: number | null;
          reps: number | null;
          rpe: number | null;
          is_warmup: boolean;
          is_pr: boolean;
          completed_at: string | null;
        };
        Insert: {
          id?: string;
          workout_exercise_id: string;
          set_number: number;
          weight?: number | null;
          reps?: number | null;
          rpe?: number | null;
          is_warmup?: boolean;
          is_pr?: boolean;
          completed_at?: string | null;
        };
        Update: {
          id?: string;
          workout_exercise_id?: string;
          set_number?: number;
          weight?: number | null;
          reps?: number | null;
          rpe?: number | null;
          is_warmup?: boolean;
          is_pr?: boolean;
          completed_at?: string | null;
        };
        Relationships: [
          {
            foreignKeyName: 'sets_workout_exercise_id_fkey';
            columns: ['workout_exercise_id'];
            isOneToOne: false;
            referencedRelation: 'workout_exercises';
            referencedColumns: ['id'];
          },
        ];
      };
      personal_records: {
        Row: {
          id: string;
          user_id: string;
          exercise_id: string;
          record_type: 'max_weight' | 'max_reps' | 'max_volume' | 'est_1rm';
          value: number;
          achieved_at: string;
          set_id: string | null;
        };
        Insert: {
          id?: string;
          user_id: string;
          exercise_id: string;
          record_type: 'max_weight' | 'max_reps' | 'max_volume' | 'est_1rm';
          value: number;
          achieved_at?: string;
          set_id?: string | null;
        };
        Update: {
          id?: string;
          user_id?: string;
          exercise_id?: string;
          record_type?: 'max_weight' | 'max_reps' | 'max_volume' | 'est_1rm';
          value?: number;
          achieved_at?: string;
          set_id?: string | null;
        };
        Relationships: [
          {
            foreignKeyName: 'personal_records_user_id_fkey';
            columns: ['user_id'];
            isOneToOne: false;
            referencedRelation: 'profiles';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'personal_records_exercise_id_fkey';
            columns: ['exercise_id'];
            isOneToOne: false;
            referencedRelation: 'exercises';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'personal_records_set_id_fkey';
            columns: ['set_id'];
            isOneToOne: false;
            referencedRelation: 'sets';
            referencedColumns: ['id'];
          },
        ];
      };
      body_metrics: {
        Row: {
          id: string;
          user_id: string;
          date: string;
          weight: number | null;
          notes: string | null;
        };
        Insert: {
          id?: string;
          user_id: string;
          date: string;
          weight?: number | null;
          notes?: string | null;
        };
        Update: {
          id?: string;
          user_id?: string;
          date?: string;
          weight?: number | null;
          notes?: string | null;
        };
        Relationships: [
          {
            foreignKeyName: 'body_metrics_user_id_fkey';
            columns: ['user_id'];
            isOneToOne: false;
            referencedRelation: 'profiles';
            referencedColumns: ['id'];
          },
        ];
      };
    };
    Views: Record<string, never>;
    Functions: {
      delete_user_account: {
        Args: Record<string, never>;
        Returns: undefined;
      };
      is_username_available: {
        Args: { username_input: string; exclude_user_id?: string | null };
        Returns: boolean;
      };
      resolve_login_email: {
        Args: { identifier: string };
        Returns: string;
      };
    };
    Enums: Record<string, never>;
    CompositeTypes: Record<string, never>;
  };
};

export type Tables<T extends keyof Database['public']['Tables']> =
  Database['public']['Tables'][T]['Row'];

export type TablesInsert<T extends keyof Database['public']['Tables']> =
  Database['public']['Tables'][T]['Insert'];

export type TablesUpdate<T extends keyof Database['public']['Tables']> =
  Database['public']['Tables'][T]['Update'];

export type Profile = Tables<'profiles'>;
export type Exercise = Tables<'exercises'>;
export type Routine = Tables<'routines'>;
export type RoutineExercise = Tables<'routine_exercises'>;
export type Workout = Tables<'workouts'>;
export type WorkoutExercise = Tables<'workout_exercises'>;
export type Set = Tables<'sets'>;
export type PersonalRecord = Tables<'personal_records'>;
export type BodyMetric = Tables<'body_metrics'>;

export type RoutineWithExercises = Routine & {
  routine_exercises: (RoutineExercise & { exercise: Exercise })[];
};

export type WorkoutWithDetails = Workout & {
  workout_exercises: (WorkoutExercise & {
    exercise: Exercise;
    sets: Set[];
  })[];
};

export type PersonalRecordWithExercise = PersonalRecord & {
  exercise: Exercise;
};
