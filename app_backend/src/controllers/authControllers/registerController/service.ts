import bcrypt from "bcryptjs";
import prisma from "@/utils/db";
import { RegisterUserInput, RegisterServiceResponse } from "./schema";
import { findUserByEmail } from "@/helpers/dbCalls/users";
import { generateVerificationToken } from "@/services/token.service";
import { sendVerificationEmail } from "@/services/email.service";
import { AppError } from "@/utils/error";
import { HTTP_STATUS } from "@/constants";

export const registerUserService = async (
  data: RegisterUserInput
): Promise<RegisterServiceResponse> => {
  const { email, password } = data;

  // Check if user already exists
  const existingUser = await findUserByEmail(email);

  if (existingUser) {
    throw new AppError("User already exists", HTTP_STATUS.BAD_REQUEST);
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
