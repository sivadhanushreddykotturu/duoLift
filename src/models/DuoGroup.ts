import mongoose, { Schema, Document, Model } from "mongoose";

export interface IDuoGroup extends Document {
  inviteCode: string;
  members: string[]; // clerkIds
  streak: number;
  lastCheckInDate?: string;
  lastNudge?: {
    fromUserId: string;
    message: string;
    createdAt: Date;
  };
  createdAt: Date;
  updatedAt: Date;
}

const DuoGroupSchema = new Schema<IDuoGroup>(
  {
    inviteCode: { type: String, required: true, unique: true },
    members: [{ type: String, required: true }],
    streak: { type: Number, default: 0 },
    lastCheckInDate: { type: String },
    lastNudge: {
      fromUserId: { type: String },
      message: { type: String },
      createdAt: { type: Date },
    },
  },
  { timestamps: true }
);

export const DuoGroup: Model<IDuoGroup> =
  mongoose.models.DuoGroup || mongoose.model<IDuoGroup>("DuoGroup", DuoGroupSchema);
