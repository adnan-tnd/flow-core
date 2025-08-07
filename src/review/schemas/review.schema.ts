import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';
import { HydratedDocument, Schema as mongooseSchema } from 'mongoose';
import { User } from 'src/user/schemas/user.schema';
import { Project } from 'src/project/schemas/project.schema';
import { ReviewType } from 'src/review/types/review'; // Adjusted path


export type ReviewDocument = Review & Document;

@Schema({ timestamps: true })
export class Review extends Document {
 

  @Prop({ type: mongooseSchema.Types.ObjectId, ref: User.name, required: true })
  reviewedBy:  mongooseSchema.Types.ObjectId;

  @Prop({type: Number, required: true, min: 1, max: 5 })
  rating: number;

  @Prop({ type: String, required: true, trim: true })
  comment: string;

  @Prop({ type: mongooseSchema.Types.ObjectId, ref: Project.name, required: false })
  projectId?: mongooseSchema.Types.ObjectId;

  @Prop({ type: mongooseSchema.Types.ObjectId, ref: User.name, required: false })
  userId?: mongooseSchema.Types.ObjectId;

  @Prop({ type: String, enum: ReviewType, required: true })
  reviewType: ReviewType;
}

export const ReviewSchema = SchemaFactory.createForClass(Review);