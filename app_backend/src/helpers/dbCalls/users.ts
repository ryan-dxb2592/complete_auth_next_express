import prisma from "@/utils/db";

export const findUserByEmail = async (email: string) => {
  const user = await prisma.user.findUnique({
    where: {
      email: email.toLowerCase(),
    },
  });
  return user;
};

export const findUserById = async (id: string) => {
  const user = await prisma.user.findUnique({
    where: {
      id,
    },
  });
  return user;
};
