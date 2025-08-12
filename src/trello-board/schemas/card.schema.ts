import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';
import { CardStatus } from 'src/trello-board/types/card' // Adjust path as needed

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

  @Prop({ type: String, enum: Object.values(CardStatus), default: CardStatus.Pending })
  status: CardStatus;

  @Prop({ required: true })
  cardNumber: number;
}

export type CardDocument = Card & Document;
export const CardSchema = SchemaFactory.createForClass(Card);