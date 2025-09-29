import * as jwt from "jsonwebtoken";
import { ENV } from "../env";

// Use secure ENV configuration - no fallback for production safety
const JWT_SECRET = ENV.JWT_SECRET;

export function generateToken(payload: object): string {
  return jwt.sign(payload, JWT_SECRET, { expiresIn: "1d" });
}

export function verifyToken(token: string): Record<string, any> {
  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    if (typeof decoded === "string") throw new Error("Invalid token format");
    return decoded as Record<string, any>;
  } catch (err: any) {
    throw new Error(`Invalid token: ${err.message}`);
  }
}
