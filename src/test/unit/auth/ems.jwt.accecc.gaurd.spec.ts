import { AUTH_ERROR, createError } from '@config/errors';
import { Reflector } from '@nestjs/core';
import { Test, TestingModule } from '@nestjs/testing';
import { EmsJwtAccessAuthGuard } from '@src/auth/guard/ems.jwt.access.guard';
import typia from 'typia';

describe('EmsJwtAccessAuthGuard', () => {
  let guard: EmsJwtAccessAuthGuard;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        EmsJwtAccessAuthGuard,
        {
          provide: Reflector,
          useValue: {},
        },
      ],
    }).compile();

    guard = module.get<EmsJwtAccessAuthGuard>(EmsJwtAccessAuthGuard);
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
