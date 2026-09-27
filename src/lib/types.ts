export interface ExerciseSet {
  setNumber: number;
  weight: number;
  reps: number;
  completed: boolean;
  rpe?: number;
}

export interface Exercise {
  name: string;
  muscleGroup: string;
  sets: ExerciseSet[];
}

export interface WorkoutLog {
  id: string;
  userId: string;
  userName: string;
  userAvatar: string;
  title: string;
  category: "Push" | "Pull" | "Legs" | "Full Body" | "Cardio";
  date: string; // ISO string
  durationMinutes: number;
  exercises: Exercise[];
  totalVolumeKg: number;
  notes?: string;
  isPR?: boolean;
}

export interface ProgressPhotoItem {
  id: string;
  userId: string;
  userName: string;
  userAvatar: string;
  imageUrl: string;
  caption: string;
  type: "Pump" | "Physique" | "Scale" | "Meal";
  bodyWeightKg?: number;
  date: string; // ISO string
  reactions: {
    userId: string;
    userName: string;
    emoji: string;
  }[];
}

export interface DuoPartner {
  id: string;
  name: string;
  avatar: string;
  statusToday: "completed" | "in_progress" | "pending";
  todayWorkoutTitle?: string;
  weeklyGoalDays: number;
  weeklyCompletedDays: number;
  streak: number;
  totalVolumeMonthKg: number;
}

export interface DuoState {
  code: string;
  sharedStreak: number;
  lastNudge?: {
    fromName: string;
    emoji: string;
    message: string;
    time: string;
  };
  currentUser: DuoPartner;
  partner: DuoPartner;
  workouts: WorkoutLog[];
  photos: ProgressPhotoItem[];
}
