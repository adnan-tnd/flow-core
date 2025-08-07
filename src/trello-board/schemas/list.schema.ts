import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';
import { Schema as mongooseSchema } from 'mongoose';
import { TrelloBoard } from './trello-board.schema';
// import { User } from '../user/schemas/user.schema';

export type ListDocument = List & Document;

@Schema({ timestamps: true })
export class List {
  @Prop({ type: String, required: true })
  name: string;

  @Prop({ type: mongooseSchema.Types.ObjectId, required: true, ref: 'TrelloBoard' })
  board: Types.ObjectId;

  @Prop({ type: mongooseSchema.Types.ObjectId, required: true, ref: 'User' })
  createdBy: Types.ObjectId;
}

export const ListSchema = SchemaFactory.createForClass(List);