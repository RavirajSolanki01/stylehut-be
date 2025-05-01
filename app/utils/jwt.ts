import jwt, { JwtPayload } from "jsonwebtoken";

const JWT_SECRET = process.env.JWT_SECRET || "your-secret-key";

export const verifyToken = (token: string): Promise<JwtPayload | string> => {
  return new Promise((resolve, reject) => {
    jwt.verify(token, JWT_SECRET, (err: unknown, decoded: JwtPayload | string | undefined) => {
      if (err) {
        // Type guard for err to ensure it's an instance of Error
        if (err instanceof Error) {
          reject(err);
        } else {
          reject(new Error("Unknown error occurred during token verification"));
        }
      } else {
        resolve(decoded as JwtPayload | string); // cast decoded to JwtPayload or string
      }
    });
  });
};
