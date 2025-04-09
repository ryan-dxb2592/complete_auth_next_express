import {Request, Response} from "express"
import { catchAsync } from "@/helpers/catchAsync"
import { OAuth2Client } from "google-auth-library";
import { sendError, sendSuccess } from "@/helpers/apiResponse";
import { GOOGLE_CLIENT_ID, GOOGLE_CLIENT_SECRET, HTTP_STATUS } from "@/constants";
import { encrypt } from "@/utils/encrypt-decrypt";
import { UAParser } from "ua-parser-js";
import requestIp from "request-ip";
import prisma from "@/utils/db";
import { generateTokens } from "@/services/token.service";
import { isMobile } from "@/utils/isMobile";

/**
 * @swagger
 * /auth/google:
 *   post:
 *     summary: Authenticate with Google
 *     tags: [Authentication]
 *     description: Authenticates a user with Google OAuth 2.0
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - code
 *             properties:
 *               code:
 *                 type: string
 *                 description: Authorization code from Google OAuth 2.0 flow
 *                 example: "4/0AY0e-g7..."
 *     responses:
 *       200:
 *         description: Google authentication successful
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 message:
 *                   type: string
 *                   example: "Google authentication successful"
 *                 data:
 *                   type: object
 *                   properties:
 *                     user:
 *                       type: object
 *                       properties:
 *                         id:
 *                           type: string
 *                           format: uuid
 *                           example: "550e8400-e29b-41d4-a716-446655440000"
 *                         email:
 *                           type: string
 *                           format: email
 *                           example: "user@gmail.com"
 *                         isVerified:
 *                           type: boolean
 *                           example: true
 *                         googleId:
 *                           type: string
 *                           example: "109872384756293846523"
 *                         profile:
 *                           type: object
 *                           properties:
 *                             firstName:
 *                               type: string
 *                               example: "John"
 *                             lastName:
 *                               type: string
 *                               example: "Doe"
 *                             avatar:
 *                               type: string
 *                               example: "https://lh3.googleusercontent.com/a/ACg8ocJH..."
 *                     session:
 *                       type: object
 *                       properties:
 *                         id:
 *                           type: string
 *                           format: uuid
 *                           example: "550e8400-e29b-41d4-a716-446655440000"
 *                         deviceType:
 *                           type: string
 *                           example: "desktop"
 *                         browser:
 *                           type: string
 *                           example: "Chrome"
 *                         os:
 *                           type: string
 *                           example: "Windows"
 *                     accessToken:
 *                       type: string
 *                       example: "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
 *                       description: Only included in response for mobile clients
 *                     refreshToken:
 *                       type: string
 *                       example: "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
 *                       description: Only included in response for mobile clients
 *       400:
 *         description: Google authentication failed
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: false
 *                 message:
 *                   type: string
 *                   example: "Google authentication failed"
 */
export const googleAuth = catchAsync(async (req: Request, res: Response) => {

  const { code } = req.body;

  // Get User Agent and IP address
  const ipAddress = requestIp.getClientIp(req) || "";
  const uaParser = new UAParser(req.headers["user-agent"] || "");
  const isDeviceMobile = await isMobile(req.headers["user-agent"] || "");


  console.log(uaParser.getUA());
  
  const oAuth2Client = new OAuth2Client(
    GOOGLE_CLIENT_ID,
    GOOGLE_CLIENT_SECRET,
    "postmessage"
  );

  // Exchange the code for tokens
  const {tokens } = await oAuth2Client.getToken(code);
  if (!tokens || !tokens.id_token) {
    return sendError(res, "Google authentication failed", HTTP_STATUS.BAD_REQUEST);
  }

  // Verify the tokens
  const tokenTicket = await oAuth2Client.verifyIdToken({
    idToken: tokens.id_token,
    audience: GOOGLE_CLIENT_ID,
  });

  const googlePayload = tokenTicket.getPayload();

  if (!googlePayload?.email) {
    return sendError(res, "Google authentication failed", HTTP_STATUS.BAD_REQUEST);
  }


  // Encrypt the tokens
  const encryptedAccessToken = encrypt(tokens.access_token || "");
  const encryptedRefreshToken = tokens.refresh_token ? encrypt(tokens.refresh_token) : null;
  const tokenExpiry = tokens.expiry_date ? new Date(tokens.expiry_date) : null;

  // Check if user exists with this email
  let user = await prisma.user.findUnique({
    where: { email: googlePayload.email }
  });

  // Create or update user
  if (!user) {
    // Create new user
    user = await prisma.user.create({
      data: {
        email: googlePayload.email,
        isVerified: true, // Google emails are already verified
        googleId: googlePayload.sub,
        googleAccessToken: encryptedAccessToken,
        googleRefreshToken: encryptedRefreshToken,
        googleTokenExpiry: tokenExpiry,
        profile: {
          create: {
            firstName: googlePayload.given_name,
            lastName: googlePayload.family_name,
            avatar: googlePayload.picture
          }
        }
      }
    });
  } else {
    // Update existing user
    user = await prisma.user.update({
      where: { email: googlePayload.email },
      data: {
        googleId: googlePayload.sub,
        googleAccessToken: encryptedAccessToken,
        googleRefreshToken: encryptedRefreshToken,
        googleTokenExpiry: tokenExpiry,
        isVerified: true, // Ensure the account is marked as verified
        profile: {
          upsert: {
            create: {
              firstName: googlePayload.given_name,
              lastName: googlePayload.family_name,
              avatar: googlePayload.picture
            },
            update: {
              firstName: googlePayload.given_name,
              lastName: googlePayload.family_name,
              avatar: googlePayload.picture
            }
          }
        }
      }
    });
  }

  // Generate JWT tokens
  const { accessToken, refreshToken } = generateTokens(user.id, user.email);

  // Create or update session
  const existingSession = await prisma.session.findFirst({
    where: {
      userId: user.id,
      ipAddress,
      userAgent: uaParser.getUA(),
    },
  });

  let session;
  if (existingSession) {
    // Update existing session
    session = await prisma.session.update({
      where: { id: existingSession.id },
      data: {
        lastUsed: new Date(),
        userAgent: uaParser.getUA(),
        deviceType: uaParser.getDevice().type || null,
        deviceName: uaParser.getDevice().model || null,
        browser: uaParser.getBrowser().name || null,
        os: uaParser.getOS().name || null,
        refreshToken: {
          update: {
            token: refreshToken,
            expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 days
          },
        },
      },
      include: {
        user: true,
        refreshToken: true,
      },
    });
  } else {
    // Create new session
    session = await prisma.session.create({
      data: {
        userId: user.id,
        ipAddress,
        userAgent: uaParser.getUA(),
        deviceType: uaParser.getDevice().type || null,
        deviceName: uaParser.getDevice().model || null,
        browser: uaParser.getBrowser().name || null,
        os: uaParser.getOS().name || null,
        expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 days
        refreshToken: {
          create: {
            token: refreshToken,
            expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 days
          },
        },
      },
      include: {
        user: true,
        refreshToken: true,
      },
    });
  }

  // Format response based on device
  const { refreshToken: refreshTokenObj, ...sessionWithoutTokens } = session;

  // Handle response based on device type (mobile vs web)
  if (isDeviceMobile) {
    res.setHeader("Authorization", `Bearer ${accessToken}`);
    res.setHeader("x-access-token", accessToken);
    res.setHeader("x-refresh-token", refreshToken);

    return sendSuccess(
      res,
      "Google authentication successful",
      {
        user: session.user,
        session: sessionWithoutTokens,
        accessToken,
        refreshToken,
      },
      HTTP_STATUS.OK
    );
  }

  // Handle web response with cookies
  const cookieOptions = {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: process.env.NODE_ENV === "production" ? "none" : "lax",
  } as const;

  res.cookie("accessToken", accessToken, {
    ...cookieOptions,
    maxAge: 1 * 60 * 1000, // 15 minutes
  });

  res.cookie("refreshToken", refreshToken, {
    ...cookieOptions,
    maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
  });

  return sendSuccess(
    res,
    "Google authentication successful",
    {
      user: session.user,
      session: sessionWithoutTokens,
    },
    HTTP_STATUS.OK
  );
});


