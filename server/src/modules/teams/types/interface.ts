import mongoose from "mongoose";

export interface ITeam extends Document {
    teamNumber: number;
    teamScore: number;
    session: mongoose.Types.ObjectId;
}