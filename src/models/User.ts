import mongoose, { Schema, Document, Model } from "mongoose";

export interface IUser extends Document {
  clerkId: string;
  name: string;
  email: string;
  avatar?: string;
  partnerId?: string;
  duoCode: string;
  duoGroupId?: string;
  currentStreak: number;
  lastActiveDate?: string;
  stats: {
    totalWorkouts: number;
    totalVolumeKg: number;
    prCount: number;
  };
  createdAt: Date;
  updatedAt: Date;
}

const UserSchema = new Schema<IUser>(
  {
    clerkId: { type: String, required: true, unique: true },
    name: { type: String, required: true },
    email: { type: String, required: true },
    avatar: { type: String },
    partnerId: { type: String },
    duoCode: { type: String, unique: true, sparse: true },
    duoGroupId: { type: String },
    currentStreak: { type: Number, default: 0 },
    lastActiveDate: { type: String },
    stats: {
      totalWorkouts: { type: Number, default: 0 },
      totalVolumeKg: { type: Number, default: 0 },
      prCount: { type: Number, default: 0 },
    },
  },
  { timestamps: true }
);

export const User: Model<IUser> =
  mongoose.models.User || mongoose.model<IUser>("User", UserSchema);
