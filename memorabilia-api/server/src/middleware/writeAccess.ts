import { NextFunction, Request, Response } from "express";

const writeMethods = new Set(["POST", "PATCH", "PUT", "DELETE"]);

function isWriteProtected() {
  if (process.env.PORTFOLIO_READ_ONLY === "true") return true;
  if (process.env.ALLOW_PUBLIC_WRITES === "true") return false;

  return process.env.NODE_ENV === "production";
}

export function requireWriteAccess(
  req: Request,
  res: Response,
  next: NextFunction,
) {
  if (!writeMethods.has(req.method) || !isWriteProtected()) {
    next();
    return;
  }

  const ownerToken = process.env.OWNER_WRITE_TOKEN;
  const requestToken = req.header("x-owner-write-token");

  if (ownerToken && requestToken === ownerToken) {
    next();
    return;
  }

  res.status(403).json({
    error:
      "Portfolio demo is read-only. Explore the dashboard, but edits are disabled on the public deployment.",
  });
}
