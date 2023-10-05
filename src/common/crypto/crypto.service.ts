import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { createCipheriv, createDecipheriv, randomBytes, scrypt } from 'crypto';
import { promisify } from 'util';

@Injectable()
export class CryptoService {
  constructor(private readonly configService: ConfigService) {}

  async encrypt(props: { data: string; salt: string }) {
    const { data, salt } = props;
    const password = this.configService.get<string>('SCRYPT_PASSWORD') as string;
    const iv = randomBytes(16);
    const key = (await promisify(scrypt)(password, salt, 32)) as Buffer;
    const cipher = createCipheriv('aes-256-cbc', key, iv);
    const encrypted = Buffer.concat([cipher.update(data), cipher.final()]);
    return encrypted.toString('hex') + ':' + iv.toString('hex');
  }

  async decrypt(props: { hash: string; salt: string }) {
    console.log(props);
    const { hash, salt } = props;
    const password = this.configService.get<string>('SCRYPT_PASSWORD') as string;
    const [encrypted, iv] = hash.split(':');
    const key = (await promisify(scrypt)(password, salt, 32)) as Buffer;
    const decipher = createDecipheriv('aes-256-cbc', key, iv.length ? Buffer.from(iv, 'hex') : iv);
    const decrypted = Buffer.concat([decipher.update(Buffer.from(encrypted, 'hex')), decipher.final()]);
    return decrypted.toString('utf-8');
  }
}
