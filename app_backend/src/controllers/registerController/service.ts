import bcrypt from "bcryptjs";
import prisma from "@/utils/db";
import { RegisterUserInput, RegisterResponse } from "./schema";
import { findUserByEmail } from "@/helpers/dbCalls/users";
import { generateVerificationToken } from "@/services/token.service";
import { sendVerificationEmail } from "@/services/email.service";

export const registerUserService = async (
  data: RegisterUserInput
): Promise<RegisterResponse> => {
  const { email, password } = data;

  // Check if user already exists
  const existingUser = await findUserByEmail(email);

  if (existingUser) {
    throw new Error("User already exists");
  }

  // Hash password
  const hashedPassword = await bcrypt.hash(password, 10);

  // Generate Verification Token
  const { token, expiresAt } = generateVerificationToken();

  // Create User (with hashed password and verification token)
  const user = await prisma.user.create({
    data: {
      email: email.toLowerCase(),
      password: hashedPassword,
      emailVerification: {
        create: {
          token,
          expiresAt,
        },
      },
    },
    select: {
      id: true,
      email: true,
      createdAt: true,
    },
  });

  // Send Verification Email
  await sendVerificationEmail({
    to: user.email,
    userId: user.id,
    token,
    expiresIn: expiresAt.toISOString(),
  });

  // Return Success Response
  return user;
};
