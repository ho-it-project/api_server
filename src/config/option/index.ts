import { JwtOption } from './interface';

export const jwtOption: JwtOption = {
  access_secret: process.env.JWT_ACCESS_SECRET as string,
  refresh_secret: process.env.JWT_REFRESH_SECRET as string,
  access_expires_in: process.env.JWT_ACCESS_EXPIRES_IN as string,
  refresh_expires_in: process.env.JWT_REFRESH_EXPIRES_IN as string,
};

