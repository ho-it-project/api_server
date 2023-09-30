export namespace Auth {
  export interface ComparePassword {
    password: string;
    hash: string;
  }

  export interface HashPassword {
    password: string;
  }

  export interface AccessTokenVerify {
    access_token: string;
  }

  export interface RefreshTokenVerify {
    refresh_token: string;
  }
}
