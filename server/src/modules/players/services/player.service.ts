import { Model, Types } from "mongoose";
import { IPlayer } from "../types/interfaces";

class PlayerService {
  private playerModel: Model<IPlayer>;

  constructor(playerModel: Model<IPlayer>) {
    this.playerModel = playerModel;
  }

  async createPlayer(data: Partial<IPlayer>): Promise<IPlayer> {
    const player = new this.playerModel({
      name: data.name,
      profilePhoto: data.profilePhoto,
      session: data.session,
      team: data.team,
    });
    return await player.save();
  }

  async getPlayerById(id: string): Promise<IPlayer | null> {
    return await this.playerModel.findById(id).populate("session");
  }

  async getPlayersBySession(sessionId: Types.ObjectId): Promise<IPlayer[]> {
    return await this.playerModel.find({ session: sessionId });
  }

  async updatePlayerById(
    playerId: string,
    updateData: Partial<IPlayer>
  ): Promise<IPlayer | null> {
    return await this.playerModel.findByIdAndUpdate(playerId, updateData, {
      new: true,
    });
  }
}

export default PlayerService;
