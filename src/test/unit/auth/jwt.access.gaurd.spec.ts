import { ForbiddenException } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { Test, TestingModule } from '@nestjs/testing';
import { JwtAccessAuthGuard } from '@src/auth/guard/jwt.access.guard';
import { AUTH_ERROR } from '@src/types/errors';

describe('JwtAccessAuthGuard', () => {
  let guard: JwtAccessAuthGuard;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        JwtAccessAuthGuard,
        {
          provide: Reflector,
          useValue: {},
        },
      ],
    }).compile();

    guard = module.get<JwtAccessAuthGuard>(JwtAccessAuthGuard);
  });

  it('should be defined', () => {
    expect(guard).toBeDefined();
  });

  describe('handleRequest', () => {
    it('should return user if user is defined', () => {
      const user = { id: 1, username: 'test' };
      expect(guard.handleRequest(null, user)).toEqual(user);
    });

    it('should throw ForbiddenException if user is not defined', () => {
      expect(() => guard.handleRequest(null, null)).toThrow(ForbiddenException);
      expect(() => guard.handleRequest(null, null)).toThrow(new ForbiddenException(AUTH_ERROR.FORBIDDEN));
    });

    it('should throw error if error is defined', () => {
      const error = new Error('Test error');
      expect(() => guard.handleRequest(error, null)).toThrow(error);
    });
  });
});
