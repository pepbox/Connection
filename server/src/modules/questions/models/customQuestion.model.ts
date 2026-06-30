import { Schema, model, Document } from 'mongoose';

export interface ICustomQuestion extends Document {
  player: Schema.Types.ObjectId;
  session: Schema.Types.ObjectId;
  questionText: string;
  correctAnswer?: string;
  createdAt: Date;
  updatedAt: Date;
}

const customQuestionSchema = new Schema<ICustomQuestion>({
  player: { type: Schema.Types.ObjectId, ref: 'Player', required: true },
  session: { type: Schema.Types.ObjectId, ref: 'Session', required: true },
  questionText: { type: String, required: true, trim: true },
  correctAnswer: { type: String, trim: true }
}, {
  timestamps: true
});

export const CustomQuestion = model<ICustomQuestion>('CustomQuestion', customQuestionSchema);
