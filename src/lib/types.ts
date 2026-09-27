export interface WorkoutEntry {
  id: string;
  userId: "me" | "partner";
  userName: string;
  date: string; // ISO
  label: string; // e.g. "Push", "Legs", "Cardio"
  notes?: string;
}

export interface PhotoEntry {
  id: string;
  userId: "me" | "partner";
  userName: string;
  date: string;
  imageUrl: string;
  caption?: string;
}

export interface AppState {
  me: { name: string; avatar: string };
  partner: { name: string; avatar: string };
  streak: number;
  myDoneToday: boolean;
  partnerDoneToday: boolean;
  workouts: WorkoutEntry[];
  photos: PhotoEntry[];
}
