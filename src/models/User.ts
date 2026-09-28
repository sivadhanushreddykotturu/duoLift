import mongoose, { Schema, Document, Model } from "mongoose";

export interface IUser extends Document {
  clerkId: string;
  name: string;
  email: string;
  image?: string;        // profile picture URL
  code: string;          // 6-char unique code to share with buddy
  partnerId?: string;    // clerkId of paired partner
  logs: string[];        // array of "YYYY-MM-DD" date strings
  workoutLogs?: {
    date: string;
    exercises: {
      name: string;
      sets?: string | number;
      reps?: string | number;
    }[];
    updatedAt?: Date;
  }[];
  photos: {
    url: string;
    caption?: string;
    date: string;
  }[];
}

const UserSchema = new Schema<IUser>({
  clerkId:   { type: String, required: true, unique: true },
  name:      { type: String, required: true },
  email:     { type: String, required: true },
  image:     { type: String },
  code:      { type: String, required: true, unique: true },
  partnerId: { type: String },
  logs:      [{ type: String }],
  workoutLogs: [{
    date: { type: String, required: true },
    exercises: [{
      name: { type: String, required: true },
      sets: { type: Schema.Types.Mixed },
      reps: { type: Schema.Types.Mixed },
    }],
    updatedAt: { type: Date, default: Date.now },
  }],
  photos: [{
    url:     { type: String, required: true },
    caption: { type: String },
    date:    { type: String, required: true },
  }],
}, { timestamps: true });

if (mongoose.models.User && (!mongoose.models.User.schema.path("workoutLogs") || !mongoose.models.User.schema.path("image"))) {
  delete mongoose.models.User;
}

export const User: Model<IUser> =
  mongoose.models.User || mongoose.model<IUser>("User", UserSchema);
