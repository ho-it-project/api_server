import { utilities, WinstonModuleOptions } from 'nest-winston';
import * as winston from 'winston';
import winstonDaily from 'winston-daily-rotate-file';

const env = process.env.NODE_ENV;

const logDir = `logs`;

export const winstonDailyOption = (level: string): winstonDaily.DailyRotateFileTransportOptions => {
  return {
    level,
    datePattern: 'YYYY-MM-DD',
    dirname: logDir + `/${level}`,
    filename: `%DATE%.${level}.log`,
    maxFiles: 30, //30일치 로그파일 저장
    zippedArchive: true, // 로그가 쌓이면 압축하여 관리
  };
};

export const winstonOption: WinstonModuleOptions = {
  transports: [
    new winston.transports.Console({
      level: env === 'production' ? 'http' : 'silly',
      format:
        env === 'production'
          ? winston.format.simple()
          : winston.format.combine(
              winston.format.timestamp(),
              utilities.format.nestLike('hoit', {
                prettyPrint: true,
                colors: true,
              }),
            ),
    }),

    new winstonDaily(winstonDailyOption('info')),
    new winstonDaily(winstonDailyOption('warn')),
    new winstonDaily(winstonDailyOption('error')),
  ],
};
