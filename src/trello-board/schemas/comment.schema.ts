import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';
import { Schema as mongooseSchema } from 'mongoose';

@Schema({ timestamps: true })
export class Comment {
  @Prop({ type: mongooseSchema.Types.ObjectId, ref: 'User', required: true })
  commentBy: Types.ObjectId;

  @Prop({ required: true })
  text: string;

  @Prop({ type: mongooseSchema.Types.ObjectId, ref: 'Card', required: true })
  card: Types.ObjectId;

  @Prop({ default: Date.now })
  time: Date;
}

export type CommentDocument = Comment & Document;
export const CommentSchema = SchemaFactory.createForClass(Comment);