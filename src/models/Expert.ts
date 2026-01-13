import mongoose, { Schema, Document, Model } from 'mongoose';
import { Language } from '@/types';

export interface ExpertDocument extends Document {
  id: string;
  name: string;
  email: string;
  languages: Language[];
  totalRecordings: number;
  todayRecordings: number;
  lastActive: Date;
  streak: number;
  createdAt: Date;
  updatedAt: Date;
}

const ExpertSchema = new Schema<ExpertDocument>(
  {
    id: { type: String, required: true, unique: true },
    name: { type: String, required: true },
    email: { type: String, required: true, unique: true },
    languages: {
      type: [String],
      enum: ['hi', 'en', 'ta'],
      default: ['hi', 'en', 'ta'],
    },
    totalRecordings: { type: Number, default: 0 },
    todayRecordings: { type: Number, default: 0 },
    lastActive: { type: Date, default: Date.now },
    streak: { type: Number, default: 0 },
  },
  {
    timestamps: true,
  }
);

const Expert: Model<ExpertDocument> =
  mongoose.models.Expert || mongoose.model<ExpertDocument>('Expert', ExpertSchema);

export default Expert;
