import { Request, Response, NextFunction } from 'express';
import { BadRequestError } from '../utils/errors';

export type ValidatorFunction = (body: any) => string | null;

export function validateBody(validatorSchema: ValidatorFunction) {
  return (req: Request, res: Response, next: NextFunction) => {
    try {
      const errorMsg = validatorSchema(req.body);
      if (errorMsg) {
        throw new BadRequestError(errorMsg);
      }
      next();
    } catch (err) {
      next(err);
    }
  };
}
