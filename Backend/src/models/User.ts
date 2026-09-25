import { Schema, model, type HydratedDocument, type Model } from 'mongoose';
import { USER_ROLES, type UserRole } from '../types/domain';

/** A platform user (poster creator or administrator). */
export interface IUser {
  name: string;
  email: string;
  passwordHash: string;
  role: UserRole;
  createdAt: Date;
  updatedAt: Date;
}

const userSchema = new Schema<IUser>(
  {
    name: { type: String, required: true, trim: true },
    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
      index: true,
    },
    passwordHash: { type: String, required: true, select: false },
    role: { type: String, enum: USER_ROLES, default: 'user', required: true },
  },
  { timestamps: true, versionKey: false },
);

export type UserDocument = HydratedDocument<IUser>;
export const User: Model<IUser> = model<IUser>('User', userSchema);

export default User;
