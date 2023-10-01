import { Reflector } from '@nestjs/core';
import { Test, TestingModule } from '@nestjs/testing';
import { EmsJwtRefreshuthGuard } from '@src/auth/guard/ems.jwt.refresh.guard';

describe('EmsJwtRefreshuthGuard', () => {
  let guard: EmsJwtRefreshuthGuard;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        EmsJwtRefreshuthGuard,
        {
          provide: Reflector,
          useValue: {},
        },
      ],
    }).compile();

    guard = module.get<EmsJwtRefreshuthGuard>(EmsJwtRefreshuthGuard);
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
