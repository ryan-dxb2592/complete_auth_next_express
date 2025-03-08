import { Request, Response, NextFunction } from "express";

export const catchAsync = (
  fn: (req: Request, res: Response, next: NextFunction) => Promise<Response>
) => {
  return (req: Request, res: Response, next: NextFunction) => {
    fn(req, res, next).catch(next);
  };
};

/**
 * Usage Example:
 *
 * const handler = catchAsync(async (req: Request, res: Response) => {
 *   const data = await someAsyncOperation();
 *   res.json(data);
 * });
 *
 * router.get('/path', handler);
 */
