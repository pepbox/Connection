import { Schema, model } from 'mongoose';
import { ITeam } from '../types/interface';

const TeamSchema = new Schema<ITeam>({
    teamNumber: { type: Number, required: true,unique: false },
    teamScore: { type: Number, required: true, default: 0 },
    session: { type: Schema.Types.ObjectId, ref: 'Session', required: true },
});

export const Team = model<ITeam>('Team', TeamSchema);