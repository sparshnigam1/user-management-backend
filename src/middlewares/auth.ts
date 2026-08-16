import { jwtConfig, requireEnv } from "@/config/index.js";
import {
  isTokenNearExpiry,
  reIssueToken,
  veriftToken,
} from "@/helpers/authHelper.js";
import { HttpStatus } from "@/lib/http/status.js";
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

export const authenticate = async (
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
    return res
      .status(HttpStatus.UNAUTHORIZED)
      .json({ error: "Session missing" });
  }

  try {
    const decodedToken = veriftToken(token);
    req.session = decodedToken;

    if (!decodedToken.exp || !decodedToken.iat) {
      return res.status(HttpStatus.UNAUTHORIZED).json({
        status: false,
        message: "Invalid token - Access Denied",
      });
    }
    const user = await UserModel.conditionalFindAll({
      id: decodedToken.user,
      status: USER_STATUS.ACTIVE,
    });

    if (!user || !user.length) {
      return res
        .status(HttpStatus.FORBIDDEN)
        .json({ error: "Access denied. Contact admin." });
    }

    const tokenLifespanMs = (decodedToken.exp - decodedToken.iat) * 1000;
    const refreshExpiryMs = expiresInToMs(jwtConfig.jwtRefreshExpiresIn);

    const isRefreshTypeToken =
      Math.abs(tokenLifespanMs - refreshExpiryMs) < 1000;

    if (isTokenNearExpiry({ decodedToken }) && !isRefreshTypeToken) {
      const refreshedToken = reIssueToken(decodedToken);
      const maxAge = expiresInToMs(jwtConfig.jwtRefreshExpiresIn);
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
        .status(HttpStatus.UNAUTHORIZED)
        .json({ status: false, message: "Session expired" });
    }
    if (error.name === "JsonWebTokenError") {
      return res
        .status(HttpStatus.UNAUTHORIZED)
        .json({ status: false, message: "Invalid session" });
    }
    if (error.name === "NotBeforeError") {
      return res
        .status(HttpStatus.UNAUTHORIZED)
        .json({ status: false, message: "Token not active yet" });
    }

    return res
      .status(HttpStatus.UNAUTHORIZED)
      .json({ error: "Session validation failed" });
  }
};

export const authorize = ({ isRoleBased }: { isRoleBased?: boolean } = {}) => {
  return async (req: Request, res: Response, next: NextFunction) => {
    if (!req.session) {
      return res.status(HttpStatus.UNAUTHORIZED).json({
        status: false,
        message: "Unauthenticated Access - Access Denied",
      });
    }

    const session = req.session;

    if (!!isRoleBased) {
    }

    next();
  };
};
