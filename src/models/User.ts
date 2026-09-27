import mongoose, { Schema, Document, Model } from "mongoose";

export interface IUser extends Document {
  clerkId: string;
  name: string;
  email: string;
  code: string;          // 6-char unique code to share with buddy
  partnerId?: string;    // clerkId of paired partner
  logs: string[];        // array of "YYYY-MM-DD" date strings
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
  code:      { type: String, required: true, unique: true },
  partnerId: { type: String },
  logs:      [{ type: String }],
  photos: [{
    url:     { type: String, required: true },
    caption: { type: String },
    date:    { type: String, required: true },
  }],
}, { timestamps: true });

export const User: Model<IUser> =
  mongoose.models.User || mongoose.model<IUser>("User", UserSchema);
