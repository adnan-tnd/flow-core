import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';
import { Schema as mongooseSchema } from 'mongoose';
import { User } from '../../user/schemas/user.schema';

export type SalaryDocument = Salary & Document;

@Schema({ timestamps: true })
export class Salary {
  @Prop({ type: mongooseSchema.Types.ObjectId, required: true, ref: 'User' })
  user: Types.ObjectId;

  @Prop({ type: Number, required: true, min: 0 })
  amount: number;

  @Prop({ type: String, required: true, match: /^\d{4}-\d{2}$/ }) // YYYY-MM format
  month: string;

  @Prop({ type: Number, min: 0, default: 0 })
  tax?: number;

  @Prop({ type: Number, min: 0, default: 0 })
  bonus?: number;

  @Prop({ type: String, default: '' })
  notes: string;

  @Prop({ type: Object, default: {} }) // For future extensibility
  metadata: Record<string, any>;
}

export const SalarySchema = SchemaFactory.createForClass(Salary);