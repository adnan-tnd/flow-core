import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';
import { User } from 'src/user/schemas/user.schema'; // Adjusted path
import { HydratedDocument, Schema as mongooseSchema } from 'mongoose';
import { AttendanceStatus } from 'src/attendance/types/attendance'; // Adjusted path


@Schema()
export class Session {
  @Prop({ type: Date, required: true })
  clockInTime: Date;

  @Prop({type: Date, required: false })
  clockOutTime?: Date;

  @Prop({ type: Number, required: false })
  sessionHours?: number;
}

@Schema({ timestamps: true })
export class Attendance {
  @Prop({ type: mongooseSchema.Types.ObjectId, ref: User.name, required: true })
  userId: mongooseSchema.Types.ObjectId;

  @Prop({ type: Date, required: true })
  date: Date;

  @Prop({ type: String, enum: AttendanceStatus, default: AttendanceStatus.ABSENT })
  status: AttendanceStatus;

  @Prop({ type: [Session], default: [] })
  sessions: Session[];

  @Prop({ type: Number, required: false })
  workingHours?: number;

  @Prop({type: String, required: false })
  notes?: string;
}

export type AttendanceDocument = Attendance & Document;

export const AttendanceSchema = SchemaFactory.createForClass(Attendance);

// Index for efficient querying (no unique constraint)
AttendanceSchema.index({ userId: 1, date: 1 });