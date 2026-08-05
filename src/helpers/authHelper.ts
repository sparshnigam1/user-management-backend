import { jwtConfig } from "@/config/index.js";
import bcrypt from "bcrypt";
import dotenv from "dotenv";
import jwt, { JwtPayload, SignOptions } from "jsonwebtoken";
dotenv.config();

const SALT_ROUNDS = 12;
const REFRESH_THRESHOLD_SECONDS = 60 * 60;

export const hashPassword = async (password: string): Promise<string> => {
  return bcrypt.hash(password, SALT_ROUNDS);
};

export const verifyPassword = async (
  password: string,
  hash: string,
): Promise<boolean> => {
  return bcrypt.compare(password, hash);
};

export const createToken = (payload: any): string => {
  return jwt.sign(payload, jwtConfig.jwtSecret, {
    issuer: jwtConfig.jwtIssuer,
    audience: jwtConfig.jwtAudience,
    expiresIn: jwtConfig.jwtExpiresIn,
    algorithm: "HS256",
  } as SignOptions);
};

export const veriftToken = (token: string): JwtPayload => {
  const decodedToken = jwt.verify(token, jwtConfig.jwtSecret, {
    issuer: jwtConfig.jwtIssuer,
    audience: jwtConfig.jwtAudience,
    algorithms: ["HS256"],
  });

  if (typeof decodedToken === "string") {
    throw new Error("Invalid token payload format");
  }
  return decodedToken;
};

export const isTokenNearExpiry = ({
  decodedToken,
  thresholdSeconds = REFRESH_THRESHOLD_SECONDS,
}: {
  decodedToken: JwtPayload;
  thresholdSeconds?: number;
}): boolean => {
  if (!decodedToken.exp) return false;
  const currentTimeInSec = Math.floor(Date.now() / 1000);
  const remainingTimeInExpiry = decodedToken.exp - currentTimeInSec;
  return remainingTimeInExpiry > 0 && remainingTimeInExpiry <= thresholdSeconds;
};

const stripReservedClaims = (payload: JwtPayload): object => {
  const { iat, exp, nbf, iss, aud, sub, jti, ...rest } = payload;
  return rest;
};

export const reIssueToken = (decodedToken: JwtPayload): string => {
  const payload = stripReservedClaims(decodedToken);
  return createToken(payload);
};
