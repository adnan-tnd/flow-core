import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';
import { User } from '../../user/schemas/user.schema'; // Adjusted path
import { LeaveType, LeaveStatus } from 'src/leave-request/types/leave-request'; // Adjusted path
export type LeaveRequestDocument = LeaveRequest & Document;



@Schema({ timestamps: true })
export class LeaveRequest {
  @Prop({ type: Types.ObjectId, ref: 'User', required: true }) // Use string 'User' for ref
  userId: Types.ObjectId;

  @Prop({ required: true, enum: LeaveType })
  type: LeaveType;

  @Prop({ required: true, enum: LeaveStatus, default: LeaveStatus.PENDING })
  status: LeaveStatus;

  @Prop({ required: true })
  reason: string;

  @Prop({ required: true })
  quantity: number;
}

export const LeaveRequestSchema = SchemaFactory.createForClass(LeaveRequest);