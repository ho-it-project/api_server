import { INestiaConfig } from '@nestia/sdk';

export const NESTIA_CONFIG: INestiaConfig = {
  simulate: true,
  input: ['src/controllers', 'src/auth'],
  output: 'src/api',

  swagger: {
    output: 'packages/api/swagger.json',
    servers: [
      {
        url: 'http://localhost:37001',
        description: 'Local Server',
      },
    ],
    security: {
      refresh_token: {
        type: 'apiKey',
        name: 'refresh_token',
        in: 'cookie',
      },
      access_token: {
        type: 'apiKey',
        name: 'access_token',
        in: 'cookie',
      },
    },
  },
};
export default NESTIA_CONFIG;
