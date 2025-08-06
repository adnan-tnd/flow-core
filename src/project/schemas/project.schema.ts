import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';
import { HydratedDocument, Schema as mongooseSchema } from 'mongoose';

import { User } from 'src/user/schemas/user.schema';

export type ProjectDocument = Project & Document;

@Schema({ timestamps: true })
export class Project {
  @Prop({ required: true })
  name: string;

  @Prop({ required: true })
  description: string;

  @Prop({ type: mongooseSchema.Types.ObjectId, ref: 'User', required: true })
  createdBy: mongooseSchema.Types.ObjectId;

  @Prop({ type: mongooseSchema.Types.ObjectId, ref: 'User', default: null })
  projectManager: mongooseSchema.Types.ObjectId | null;

  @Prop({ type: [{ type: mongooseSchema.Types.ObjectId, ref: 'User' }], default: [] })
  frontendDevs:mongooseSchema.Types.ObjectId[];

  @Prop({ type: [{ type: mongooseSchema.Types.ObjectId, ref: 'User' }], default: [] })
  backendDevs: mongooseSchema.Types.ObjectId[];
}

export const ProjectSchema = SchemaFactory.createForClass(Project);