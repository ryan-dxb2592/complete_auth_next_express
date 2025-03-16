import prisma from "@/utils/db";

export const getSessionById = async (sessionId: string) => {};

export const getSessionByUserId = async (userId: string) => {
  const session = await prisma.session.findFirst({
    where: {
      userId,
    },
    include: {
      refreshToken: true,
      user: true,
    },
  });

  return session;
};

export const getSessionByRefreshToken = async (refreshToken: string) => {
  const session = await prisma.session.findFirst({
    where: {
      refreshToken: {
        token: refreshToken,
      },
    },
    include: {
      refreshToken: true,
      user: true,
    },
  });

  return session;
};
