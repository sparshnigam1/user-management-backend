import { jwtConfig } from "@/config/index.js";
import bcrypt from "bcrypt";
import dotenv from "dotenv";
import jwt from "jsonwebtoken";
dotenv.config();
const SALT_ROUNDS = 12;
const REFRESH_THRESHOLD_SECONDS = 60 * 60;
export const hashPassword = async (password) => {
    return bcrypt.hash(password, SALT_ROUNDS);
};
export const verifyPassword = async (password, hash) => {
    return bcrypt.compare(password, hash);
};
export const createToken = (payload) => {
    return jwt.sign(payload, jwtConfig.jwtSecret, {
        issuer: jwtConfig.jwtIssuer,
        audience: jwtConfig.jwtAudience,
        expiresIn: jwtConfig.jwtExpiresIn,
        algorithm: "HS256",
    });
};
export const veriftToken = (token) => {
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
export const isTokenNearExpiry = ({ decodedToken, thresholdSeconds = REFRESH_THRESHOLD_SECONDS, }) => {
    if (!decodedToken.exp)
        return false;
    const currentTimeInSec = Math.floor(Date.now() / 1000);
    const remainingTimeInExpiry = decodedToken.exp - currentTimeInSec;
    return remainingTimeInExpiry > 0 && remainingTimeInExpiry <= thresholdSeconds;
};
const stripReservedClaims = (payload) => {
    const { iat, exp, nbf, iss, aud, sub, jti, ...rest } = payload;
    return rest;
};
export const reIssueToken = (decodedToken) => {
    const payload = stripReservedClaims(decodedToken);
    return createToken(payload);
};
export const generateOtp = (length = 6) => {
    const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";
    let otp = "";
    for (let i = 0; i < length; i++) {
        otp += chars[Math.floor(Math.random() * chars.length)];
    }
    return otp;
};
//# sourceMappingURL=authHelper.js.map