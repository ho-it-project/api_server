import { AdminGuard } from '@common/guard/admin.guard';
import { AUTH_ERROR, createError } from '@config/errors';
import { ExecutionContext } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import typia from 'typia';

describe('AdminGuard', () => {
  let guard: AdminGuard;
  let context: ExecutionContext;
  const mockRequest = jest.fn();
  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [AdminGuard],
    }).compile();

    guard = module.get<AdminGuard>(AdminGuard);
    context = {
      switchToHttp: jest.fn().mockReturnValue({
        getRequest: mockRequest,
      }),
    } as any;
  });
  it('should be defined', () => {
    expect(guard).toBeDefined();
  });

  it('should return true if user role is ADMIN', async () => {
    mockRequest.mockReturnValue({ user: { role: 'ADMIN' } });
    expect(await guard.canActivate(context as ExecutionContext)).toBe(true);
  });

  it('should throw an error if user role is not ADMIN', async () => {
    mockRequest.mockReturnValue({ user: { role: 'USER' } });
    try {
      await guard.canActivate(context as ExecutionContext);
    } catch (error) {
      expect(error).toStrictEqual(createError(typia.random<AUTH_ERROR.FORBIDDEN>()));
    }
  });
});
