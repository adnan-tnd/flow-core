import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';
import { Schema as mongooseSchema } from 'mongoose';
import { ProjectStatus } from '../types/project';
import { User } from 'src/user/schemas/user.schema';

export type ProjectDocument = Project & Document;

@Schema({ timestamps: true })
export class Project {
  @Prop({ type: String, required: true })
  name: string;

  @Prop({ type: String, required: true })
  description: string;

  @Prop({ type: mongooseSchema.Types.ObjectId, required: true })
  createdBy: mongooseSchema.Types.ObjectId;

  @Prop({ type: mongooseSchema.Types.ObjectId, default: null })
  projectManager: mongooseSchema.Types.ObjectId | null;

  @Prop({ type: [{ type: mongooseSchema.Types.ObjectId }], default: [] })
  frontendDevs: mongooseSchema.Types.ObjectId[];

  @Prop({ type: [{ type: mongooseSchema.Types.ObjectId }], default: [] })
  backendDevs: mongooseSchema.Types.ObjectId[];

  @Prop({ type: String, enum: Object.values(ProjectStatus), default: ProjectStatus.ToDo })
  status: string;
}

export const ProjectSchema = SchemaFactory.createForClass(Project);