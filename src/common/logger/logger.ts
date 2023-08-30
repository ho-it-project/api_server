import { WinstonModule } from 'nest-winston';
import { winstonOption } from './logger.option';

export const winstonLogger = WinstonModule.createLogger(winstonOption);
