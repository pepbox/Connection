import { Schema, model, Document } from 'mongoose';

export interface IConnection extends Document {
  session: Schema.Types.ObjectId;
  playerA: Schema.Types.ObjectId; // Requester
  playerB: Schema.Types.ObjectId; // Recipient
  status: 'pending' | 'connected';
  selfieA?: Schema.Types.ObjectId; // Selfie uploaded by Player A
  selfieB?: Schema.Types.ObjectId; // Selfie uploaded by Player B
  answersA?: Array<{ questionId: Schema.Types.ObjectId; answer: string }>;
  answersB?: Array<{ questionId: Schema.Types.ObjectId; answer: string }>;
  isCompleted: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const connectionSchema = new Schema<IConnection>({
  session: { type: Schema.Types.ObjectId, ref: 'Session', required: true },
  playerA: { type: Schema.Types.ObjectId, ref: 'Player', required: true },
  playerB: { type: Schema.Types.ObjectId, ref: 'Player', required: true },
  status: { type: String, enum: ['pending', 'connected'], default: 'pending' },
  selfieA: { type: Schema.Types.ObjectId, ref: 'File' },
  selfieB: { type: Schema.Types.ObjectId, ref: 'File' },
  answersA: [{
    questionId: { type: Schema.Types.ObjectId, ref: 'CustomQuestion' },
    answer: { type: String, required: true }
  }],
  answersB: [{
    questionId: { type: Schema.Types.ObjectId, ref: 'CustomQuestion' },
    answer: { type: String, required: true }
  }],
  isCompleted: { type: Boolean, default: false }
}, {
  timestamps: true
});

// Prevent duplicate connections via race conditions
connectionSchema.index(
  { session: 1, playerA: 1, playerB: 1 },
  { unique: true }
);

export const Connection = model<IConnection>('Connection', connectionSchema);
