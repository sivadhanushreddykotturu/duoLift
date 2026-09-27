import mongoose, { Schema, Document, Model } from "mongoose";

export interface IPhotoReaction {
  userId: string;
  userName: string;
  emoji: string;
  createdAt: Date;
}

export interface IProgressPhoto extends Document {
  userId: string;
  userName: string;
  userAvatar?: string;
  imageUrl: string;
  cloudinaryPublicId?: string;
  caption?: string;
  type: "Pump" | "Physique" | "Scale" | "Meal";
  bodyWeightKg?: number;
  date: Date;
  dateKey: string;
  reactions: IPhotoReaction[];
  createdAt: Date;
  updatedAt: Date;
}

const ProgressPhotoSchema = new Schema<IProgressPhoto>(
  {
    userId: { type: String, required: true, index: true },
    userName: { type: String, required: true },
    userAvatar: { type: String },
    imageUrl: { type: String, required: true },
    cloudinaryPublicId: { type: String },
    caption: { type: String },
    type: {
      type: String,
      enum: ["Pump", "Physique", "Scale", "Meal"],
      default: "Pump",
    },
    bodyWeightKg: { type: Number },
    date: { type: Date, default: Date.now },
    dateKey: { type: String, required: true, index: true },
    reactions: [
      {
        userId: { type: String, required: true },
        userName: { type: String, required: true },
        emoji: { type: String, required: true },
        createdAt: { type: Date, default: Date.now },
      },
    ],
  },
  { timestamps: true }
);

export const ProgressPhoto: Model<IProgressPhoto> =
  mongoose.models.ProgressPhoto ||
  mongoose.model<IProgressPhoto>("ProgressPhoto", ProgressPhotoSchema);
