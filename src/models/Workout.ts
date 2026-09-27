import mongoose, { Schema, Document, Model } from "mongoose";

export interface IExerciseSet {
  setNumber: number;
  weight: number;
  reps: number;
  completed: boolean;
  rpe?: number;
}

export interface IExerciseItem {
  name: string;
  muscleGroup: string;
  sets: IExerciseSet[];
}

export interface IWorkout extends Document {
  userId: string;
  userName: string;
  userAvatar?: string;
  title: string;
  category: "Push" | "Pull" | "Legs" | "Full Body" | "Cardio" | "Other";
  date: Date;
  dateKey: string; // YYYY-MM-DD for fast streak queries
  durationMinutes: number;
  exercises: IExerciseItem[];
  volumeKg: number;
  notes?: string;
  isPR?: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const WorkoutSchema = new Schema<IWorkout>(
  {
    userId: { type: String, required: true, index: true },
    userName: { type: String, required: true },
    userAvatar: { type: String },
    title: { type: String, required: true },
    category: {
      type: String,
      enum: ["Push", "Pull", "Legs", "Full Body", "Cardio", "Other"],
      default: "Push",
    },
    date: { type: Date, default: Date.now },
    dateKey: { type: String, required: true, index: true },
    durationMinutes: { type: Number, default: 45 },
    exercises: [
      {
        name: { type: String, required: true },
        muscleGroup: { type: String, default: "Chest" },
        sets: [
          {
            setNumber: { type: Number, required: true },
            weight: { type: Number, required: true },
            reps: { type: Number, required: true },
            completed: { type: Boolean, default: true },
            rpe: { type: Number },
          },
        ],
      },
    ],
    volumeKg: { type: Number, default: 0 },
    notes: { type: String },
    isPR: { type: Boolean, default: false },
  },
  { timestamps: true }
);

export const Workout: Model<IWorkout> =
  mongoose.models.Workout || mongoose.model<IWorkout>("Workout", WorkoutSchema);
