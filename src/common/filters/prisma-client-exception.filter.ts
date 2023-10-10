import { ArgumentsHost, Catch, HttpStatus } from '@nestjs/common';
import { BaseExceptionFilter } from '@nestjs/core';
import { Prisma } from '@prisma/client';
import { Response } from 'express';

@Catch()
export class PrismaClientExceptionFilter extends BaseExceptionFilter {
  catch(exception: Prisma.PrismaClientKnownRequestError, host: ArgumentsHost) {
    console.error(exception.message);

    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();
    // const message = exception.message.replace(/\n/g, '');
    const message = exception.message;

    switch (exception.code) {
      case 'P2002': {
        const status = HttpStatus.CONFLICT;
        response.status(status).json({
          statusCode: status,
          message,
        });
        break;
      }
      case 'P2014': {
        //many to many에서의 update의 경우, violate에러가 뜰 수 있다.
        //Open Issue: https://github.com/prisma/prisma/issues/17048
        const status = HttpStatus.INTERNAL_SERVER_ERROR;
        response.status(status).json({
          statusCode: status,
          message: 'Prisma 에러코드: P2014\n' + message,
        });
        break;
      }
      case 'P2025': {
        //지금은 delete를 요청했는데 delete 대상이 존재하지 않는 경우를 고려한 것이다.
        //추후 세부 조건에 따라 변경될 수 있을 것이다.
        const status = HttpStatus.NOT_FOUND;
        response.status(status).json({
          statusCode: status,
          message,
        });
        break;
      }
      default:
        // default 500
        // super.catch(exception, host);
        const status = HttpStatus.INTERNAL_SERVER_ERROR;
        response.status(status).json({
          statusCode: status,
          message,
        });
        break;
    }
  }
}
