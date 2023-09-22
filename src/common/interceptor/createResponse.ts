import { Try } from '@src/types';

export function createResponse<T>(result: T): Try<T> {
  return {
    result,
    message: 'success',
    is_success: true,
  };
}
