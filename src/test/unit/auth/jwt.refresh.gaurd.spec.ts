import { Reflector } from '@nestjs/core';
import { Test, TestingModule } from '@nestjs/testing';
import { JwtRefreshuthGuard } from '@src/auth/guard/jwt.refresh.guard';

describe('JwtRefreshuthGuard', () => {
  let guard: JwtRefreshuthGuard;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        JwtRefreshuthGuard,
        {
          provide: Reflector,
          useValue: {},
        },
      ],
    }).compile();

    guard = module.get<JwtRefreshuthGuard>(JwtRefreshuthGuard);
  });

  it('should be defined', () => {
    expect(guard).toBeDefined();
  });

  describe('handleRequest', () => {
    it('should return user if user is defined', () => {
      const user = { id: 1, username: 'test' };
      expect(guard.handleRequest(null, user)).toEqual(user);
    });

    it('should throw error if error is defined', () => {
      const error = new Error('Test error');
      expect(() => guard.handleRequest(error, null)).toThrow(error);
    });
  });
});
