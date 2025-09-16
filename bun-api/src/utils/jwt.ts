import * as jwt from "jsonwebtoken";

const JWT_SECRET = process.env.JWT_SECRET || "your_jwt_secret";

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
