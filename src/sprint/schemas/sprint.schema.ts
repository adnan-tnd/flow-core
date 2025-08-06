import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';
import { HydratedDocument, Schema as mongooseSchema } from 'mongoose';

export enum SprintStatus {
  ToDo = 'To Do',
  InProgress = 'In Progress',
  Complete = 'Complete',
}

export type SprintDocument = Sprint & Document;

@Schema({ timestamps: true })
export class Sprint {
  @Prop({ required: true })
  name: string;

  @Prop()
  description: string;

  @Prop({ required: true })
  startTime: Date;

  @Prop({ required: true })
  endTime: Date;

  @Prop({ required: true, enum: SprintStatus, default: SprintStatus.ToDo })
  status: SprintStatus;

  @Prop({ type: mongooseSchema.Types.ObjectId, ref: 'Project', required: true })
  projectId: mongooseSchema.Types.ObjectId;

  @Prop({ type: mongooseSchema.Types.ObjectId, ref: 'User', required: true })
  createdBy:mongooseSchema.Types.ObjectId;
}

export const SprintSchema = SchemaFactory.createForClass(Sprint);