import { Request, Response, NextFunction } from "express";
import { ZodError } from "zod";
import { Prisma } from "@prisma/client";

export function errorHandler(
  err: unknown,
  req: Request,
  res: Response,
  next: NextFunction,
) {
  // Zod validation errors
  if (err instanceof ZodError) {
    return res.status(400).json({
      error: "Validation failed",
      issues: err.issues,
    });
  }

  // Prisma known errors (record not found)
  if (err instanceof Prisma.PrismaClientKnownRequestError) {
    return res.status(400).json({
      error: "Database error",
      code: err.code,
      message: err.message,
    });
  }

  console.error("Unhandled Error:", err);

  res.status(500).json({
    error: "Internal Server Error",
  });
}
