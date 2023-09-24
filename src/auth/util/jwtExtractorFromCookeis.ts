import { Request } from 'express';
import { JwtFromRequestFunction } from 'passport-jwt';

export const accessTokenExtractorFromCookeis: JwtFromRequestFunction = (req: Request) => {
  let token = null;
  if (req && req.cookies) {
    token = req.cookies['access_token'];
  }
  return token;
};

export const refreshTokenExtractorFromCookeis: JwtFromRequestFunction = (req: Request) => {
  let token = null;
  if (req && req.cookies) {
    token = req.cookies['refresh_token'];
  }
  return token;
};
