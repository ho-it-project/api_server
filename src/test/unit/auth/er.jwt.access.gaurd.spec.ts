import { AUTH_ERROR, createError } from '@config/errors';
import { Reflector } from '@nestjs/core';
import { Test, TestingModule } from '@nestjs/testing';
import { ErJwtAccessAuthGuard } from '@src/auth/guard/er.jwt.access.guard';
import typia from 'typia';

describe('ErJwtAccessAuthGuard', () => {
  let guard: ErJwtAccessAuthGuard;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ErJwtAccessAuthGuard,
        {
          provide: Reflector,
          useValue: {},
        },
      ],
    }).compile();

    guard = module.get<ErJwtAccessAuthGuard>(ErJwtAccessAuthGuard);
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
      expect(() => guard.handleRequest(null, null)).toThrow(createError(typia.random<AUTH_ERROR.FORBIDDEN>()));
    });
  });
});
