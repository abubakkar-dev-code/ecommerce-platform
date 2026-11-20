import type { Types } from "mongoose";

export interface UserDto {
  _id: string;
  name: string;
  email: string;
  role: "customer" | "admin";
  emailVerified?: true;
}

// Explicit construction keeps current and future authentication fields private,
// even when a newly created document or password-selected query is supplied.
export const toUserDto = (user: {
  _id: Types.ObjectId;
  name: string;
  email: string;
  role: "customer" | "admin";
  emailVerifiedAt?: Date;
}): UserDto => ({
  _id: user._id.toString(),
  name: user.name,
  email: user.email,
  role: user.role,
  ...(user.emailVerifiedAt ? { emailVerified: true } : {}),
});
