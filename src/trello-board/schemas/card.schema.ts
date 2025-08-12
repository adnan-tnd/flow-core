import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';

@Schema({ timestamps: true })
export class Card extends Document {
  @Prop({ required: true })
  name: string;

  @Prop()
  description: string;

  @Prop([{ type: Types.ObjectId, ref: 'User' }])
  assignedUsers: Types.ObjectId[];

  @Prop({ type: Types.ObjectId, ref: 'List', required: true })
  list: Types.ObjectId;

  @Prop({ type: Types.ObjectId, ref: 'User', required: true })
  createdBy: Types.ObjectId;

  @Prop()
  dueDate?: Date;

  @Prop({ type: [String], default: [] })
  attachments: string[];
}

export type CardDocument = Card & Document;
export const CardSchema = SchemaFactory.createForClass(Card);