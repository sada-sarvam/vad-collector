import mongoose, { Schema, Document, Model } from 'mongoose';
import { Recording as RecordingType, GameType, Language, Label, Category } from '@/types';

export interface RecordingDocument extends Omit<RecordingType, '_id'>, Document {}

const RecordingSchema = new Schema<RecordingDocument>(
  {
    id: { type: String, required: true, unique: true },
    expertId: { type: String, required: true, index: true },
    expertName: { type: String, required: true },
    gameType: {
      type: String,
      enum: ['finish-thought', 'quick-answer', 'storyteller', 'memory-lane', 'number-dictation'],
      required: true,
      index: true,
    },
    language: {
      type: String,
      enum: ['hi', 'en', 'ta'],
      required: true,
      index: true,
    },
    label: {
      type: String,
      enum: ['complete', 'incomplete'],
      required: true,
      index: true,
    },
    category: {
      type: String,
      enum: ['complete-nofiller', 'complete-withfiller', 'incomplete-midfiller', 'incomplete-endfiller'],
      required: true,
      index: true,
    },
    audioUrl: { type: String, required: true },
    gcsPath: { type: String },  // GCS path for direct access: gs://bucket/path
    audioDuration: { type: Number, required: true },
    promptId: { type: String, required: true },
    promptText: { type: String, required: true },
    instruction: { type: String, required: true },
    validated: { type: Boolean, default: false },
    validatedBy: { type: String },
    validatedAt: { type: Date },
    rejected: { type: Boolean, default: false },
    rejectionReason: { type: String },
  },
  {
    timestamps: true,
  }
);

// Compound indexes for efficient queries
RecordingSchema.index({ language: 1, category: 1 });
RecordingSchema.index({ expertId: 1, createdAt: -1 });
RecordingSchema.index({ gameType: 1, language: 1 });

// Prevent model recompilation in development
const Recording: Model<RecordingDocument> =
  mongoose.models.Recording || mongoose.model<RecordingDocument>('Recording', RecordingSchema);

export default Recording;
