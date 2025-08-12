import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types, Schema as mongooseSchema } from 'mongoose';
// import { User } from '../user/schemas/user.schema';

export type TrelloBoardDocument = TrelloBoard & Document;

@Schema()
class PendingInvitation {
  @Prop({ type: String, required: true })
  token: string;

  @Prop({ type: mongooseSchema.Types.ObjectId, ref: 'User', required: true })
  userId: Types.ObjectId;

  @Prop({ type: Date, required: true })
  expiresAt: Date;
}

@Schema({ timestamps: true })
export class TrelloBoard {
  @Prop({ type: String, required: true })
  name: string;

  @Prop({ type: mongooseSchema.Types.ObjectId, required: true, ref: 'User' })
  createdBy: Types.ObjectId;

  @Prop({ type: [{ type: mongooseSchema.Types.ObjectId, ref: 'User' }], default: [] })
  members: Types.ObjectId[];

  @Prop({ type: [{ type: mongooseSchema.Types.ObjectId, ref: 'User' }], default: [] })
  invitedUsers: Types.ObjectId[];

   @Prop({ type: [PendingInvitation], default: [] })
  pendingInvitations: PendingInvitation[];

  @Prop({ default: 0 })
  lastCardNumber: number;
}

export const TrelloBoardSchema = SchemaFactory.createForClass(TrelloBoard);