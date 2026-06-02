import { NextFunction, Request, Response } from 'express';
import { AnyZodObject, z } from 'zod';

/**
 * Validate and coerce `req.body` against a Zod schema. The parsed (typed)
 * result replaces `req.body`, so controllers receive clean, trusted input.
 */
export function validateBody<T extends AnyZodObject>(schema: T) {
  return (req: Request, _res: Response, next: NextFunction): void => {
    const result = schema.safeParse(req.body);
    if (!result.success) {
      next(result.error);
      return;
    }
    req.body = result.data as z.infer<T>;
    next();
  };
}
