import jwt, { SignOptions } from "jsonwebtoken";
import env from "../config/env.js";

export interface JwtUserPayload {
  sub: number;
  username: string;
  role_id: number;
  role_name: string;
}

export function signAuthToken(payload: JwtUserPayload): string {
  return jwt.sign(payload, env.JWT_SECRET, {
    expiresIn: env.JWT_EXPIRES_IN,
    issuer: "arkan-parts-backend",
    audience: "arkan-parts-frontend",
  } as SignOptions);
}

export function verifyAuthToken(token: string): JwtUserPayload {
  const decoded = jwt.verify(token, env.JWT_SECRET, {
    issuer: "arkan-parts-backend",
    audience: "arkan-parts-frontend",
  });

  const subjectRaw = (decoded as jwt.JwtPayload).sub;
  const subject =
    typeof subjectRaw === "number"
      ? subjectRaw
      : typeof subjectRaw === "string"
        ? Number(subjectRaw)
        : NaN;

  if (
    typeof decoded !== "object" ||
    decoded === null ||
    Number.isNaN(subject) ||
    typeof (decoded as Partial<JwtUserPayload>).username !== "string" ||
    typeof (decoded as Partial<JwtUserPayload>).role_id !== "number" ||
    typeof (decoded as Partial<JwtUserPayload>).role_name !== "string"
  ) {
    throw new Error("Invalid token payload");
  }

  return {
    sub: subject,
    username: decoded.username as string,
    role_id: decoded.role_id as number,
    role_name: decoded.role_name as string,
  };
}
