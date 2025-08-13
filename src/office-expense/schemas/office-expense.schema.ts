import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';
import { Schema as mongooseSchema } from 'mongoose';
import { User } from '../../user/schemas/user.schema';

export type OfficeExpenseDocument = OfficeExpense & Document;

@Schema({ timestamps: true })
export class OfficeExpense {
  @Prop({ type: String, required: true, enum: ['ELECTRICITY', 'RENT', 'SUPPLIES', 'TRAVEL', 'OTHER'] })
  type: string;

  @Prop({ type: Number, required: true, min: 0 })
  amount: number;

  @Prop({ type: String, required: true })
  description: string;

  @Prop({ type: Date, required: true })
  date: Date;

  @Prop({ type: mongooseSchema.Types.ObjectId, required: true, ref: 'User' })
  createdBy: Types.ObjectId;

  @Prop({ type: String, default: '' })
  notes: string;

  @Prop({ type: Object, default: {} })
  metadata: Record<string, any>;
}

export const OfficeExpenseSchema = SchemaFactory.createForClass(OfficeExpense);