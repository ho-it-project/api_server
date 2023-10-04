import { createResponse } from '@common/interceptor/createResponse';
import { TypedBody, TypedRoute } from '@nestia/core';
import { Controller, UseGuards } from '@nestjs/common';
import { EmsJwtAccessAuthGuard } from '@src/auth/guard/ems.jwt.access.guard';
import { createCipheriv, createDecipheriv, randomBytes, scrypt } from 'crypto';
import { promisify } from 'util';
import { EmsPatientService } from './../../providers/ems/ems.patient.service';
import { EmsPatientRequest } from './../../types/ems.request.dto';
@Controller('/ems/patient')
export class EmsPatientController {
  constructor(private readonly emsPatientService: EmsPatientService) {}

  @TypedRoute.Get('/')
  async test() {
    const password = 'password';
    const iv = randomBytes(16);
    const key = (await promisify(scrypt)(password, 'salt', 32)) as Buffer;

    const cipher = createCipheriv('aes-256-cbc', key, iv);

    const textToEncrypt = '010101023123';
    const encrypted = Buffer.concat([cipher.update(textToEncrypt), cipher.final()]);
    console.log(encrypted.toString('hex') + ':' + iv.toString('hex'));

    const decipher = createDecipheriv('aes-256-cbc', key, iv);
    const decrypted = Buffer.concat([decipher.update(encrypted), decipher.final()]);
    console.log(decrypted.toString('utf-8'));
  }

  @TypedRoute.Post('/')
  @UseGuards(EmsJwtAccessAuthGuard)
  async createPatient(
    @TypedBody() createPatientDTO: EmsPatientRequest.CreatePatientDTO,
    // @CurrentUser() user: EmsAuth.AccessTokenSignPayload,
  ) {
    const result = await this.emsPatientService.createPatient(createPatientDTO);

    return createResponse(result);
  }
}
