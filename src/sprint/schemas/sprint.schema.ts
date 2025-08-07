import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';
import { HydratedDocument, Schema as mongooseSchema } from 'mongoose';
import {SprintStatus} from 'src/sprint/types/sprint';


export type SprintDocument = Sprint & Document;

@Schema({ timestamps: true })
export class Sprint {
  @Prop({type: String, required: true })
  name: string;

  @Prop()
  description: string;

  @Prop({type: Date, required: true })
  startTime: Date;

  @Prop({ type: Date, required: true })
  endTime: Date;

  @Prop({ type: String, required: true, enum: SprintStatus, default: SprintStatus.ToDo })
  status: SprintStatus;

  @Prop({ type: mongooseSchema.Types.ObjectId, required: true })
  projectId: mongooseSchema.Types.ObjectId;

  @Prop({ type: mongooseSchema.Types.ObjectId, required: true })
  createdBy:mongooseSchema.Types.ObjectId;
}

export const SprintSchema = SchemaFactory.createForClass(Sprint);