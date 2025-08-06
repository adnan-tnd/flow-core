import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';
import { User } from 'src/user/schemas/user.schema'; // Adjusted path

export enum AttendanceStatus {
  CLOCKED_IN = 'clocked_in',
  CLOCKED_OUT = 'clocked_out',
  ABSENT = 'absent',
}

@Schema()
export class Session {
  @Prop({ required: true })
  clockInTime: Date;

  @Prop({ required: false })
  clockOutTime?: Date;

  @Prop({ required: false })
  sessionHours?: number;
}

@Schema({ timestamps: true })
export class Attendance {
  @Prop({ type: Types.ObjectId, ref: User.name, required: true })
  userId: Types.ObjectId;

  @Prop({ required: true })
  date: Date;

  @Prop({ type: String, enum: AttendanceStatus, default: AttendanceStatus.ABSENT })
  status: AttendanceStatus;

  @Prop({ type: [Session], default: [] })
  sessions: Session[];

  @Prop({ required: false })
  workingHours?: number;

  @Prop({ required: false })
  notes?: string;
}

export type AttendanceDocument = Attendance & Document;

export const AttendanceSchema = SchemaFactory.createForClass(Attendance);

// Index for efficient querying (no unique constraint)
AttendanceSchema.index({ userId: 1, date: 1 });