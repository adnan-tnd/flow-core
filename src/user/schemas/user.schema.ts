import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';
import { UserType } from 'src/user/types/user';
export type UserDocument = User & Document;



@Schema()
export class User {
  @Prop({type: String, required: true })
  name: string;

  @Prop({ type: String, required: true, unique: true })
  email: string;

  @Prop({ type: String, required: true })
  password: string;

  @Prop({ type: String, required: true, enum: UserType })
  type: UserType;
}

export const UserSchema = SchemaFactory.createForClass(User);


