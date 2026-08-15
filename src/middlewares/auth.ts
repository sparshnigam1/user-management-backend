import { jwtConfig, requireEnv } from "@/config/index.js";
import {
  isTokenNearExpiry,
  reIssueToken,
  veriftToken,
} from "@/helpers/authHelper.js";
import { USER_STATUS } from "@/lib/types/user.js";
import { UserModel } from "@/models/users.model.js";
import { expiresInToMs, getSessionCookieOptions } from "@/utils/cookies.js";
import { NextFunction, Request, Response } from "express";
import { JwtPayload } from "jsonwebtoken";

declare global {
  namespace Express {
    interface Request {
      session?: JwtPayload;
    }
  }
}

export const authenticate = (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  //   const authHeader = req.headers["authorization"];

  //   if (!authHeader || !authHeader.startsWith("Bearer ")) {
  //     return res
  //       .status(401)
  //       .json({ error: "Missing or malformed Authorization header" });
  //   }
  const sessionCookieName = requireEnv("COOKIE_KEY");

  const token = req.cookies?.[sessionCookieName];

  if (!token) {
    return res.status(401).json({ error: "Session missing" });
  }

  try {
    const decodedToken = veriftToken(token);
    req.session = decodedToken;

    if (isTokenNearExpiry({ decodedToken })) {
      const refreshedToken = reIssueToken(decodedToken);
      const maxAge = expiresInToMs(jwtConfig.jwtExpiresIn);
      res.cookie(
        sessionCookieName,
        refreshedToken,
        getSessionCookieOptions(maxAge),
      );
      //   // Send the new token back to the client
      //   res.setHeader("X-Refreshed-Token", refreshedToken);
      //   // Also expose the header to browser JS clients if this is a cross-origin API
      //   res.setHeader("Access-Control-Expose-Headers", "X-Refreshed-Token");
    }

    return next();
  } catch (error: any) {
    res.clearCookie(sessionCookieName, { path: "/" });

    if (error.name === "TokenExpiredError") {
      return res
        .status(401)
        .json({ status: false, message: "Session expired" });
    }
    if (error.name === "JsonWebTokenError") {
      return res
        .status(401)
        .json({ status: false, message: "Invalid session" });
    }
    // if (error.name === "NotBeforeError") {
    //   return res.status(401).json({ status: false, message: "Token not active yet" });
    // }

    return res.status(401).json({ error: "Session validation failed" });
  }
};

export const authorize = (...allowedRoles: string[]) => {
  return async (req: Request, res: Response, next: NextFunction) => {
    if (!req.session) {
      return res.status(401).json({
        status: false,
        message: "Unauthenticated Access - Access Denied",
      });
    }

    const session = req.session;
    const user = await UserModel.conditionalFindAll({
      id: session.user,
      status: USER_STATUS.ACTIVE,
    });
    if (!user || !user.length) {
      return res.status(403).json({ error: "Insufficient permissions" });
    }

    next();
  };
};
