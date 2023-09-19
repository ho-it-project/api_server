import { PrismaService } from '@common/prisma/prisma.service';
import { Injectable, Logger } from '@nestjs/common';
import { er_Department, er_EmergencyCenter, er_Hospital, er_MedicalEquipment } from '@prisma/client';
import fs from 'fs';
import path from 'path';

@Injectable()
export class DbInit {
  constructor(private readonly prismaService: PrismaService) {}
  private readonly logger = new Logger(DbInit.name);
  async init() {
    if (process.env.NODE_ENV === 'production' || process.env.DATABASE_URL?.indexOf('ho-it') !== -1) return;

    this.logger.debug('init');
    await this.deleteAll();
    await this.hospitalSetup();
    await this.emergencyCenterSetup();
    await this.departmentSetup();
    await this.medicalEquipmentSetup();
    await this.servereIllnessSetup();
    await this.emergencyRoomSetup();
    await this.emergencyRoomBedSetup();
  }
  async deleteAll() {
    this.logger.debug('delete all');
    await this.prismaService.er_Patient.deleteMany({ where: {} });
    await this.prismaService.er_EmergencyRoomBedLog.deleteMany({ where: {} });
    await this.prismaService.er_EmergencyRoomBed.deleteMany({ where: {} });
    await this.prismaService.er_EmergencyRoom.deleteMany({ where: {} });
    await this.prismaService.er_EmergencyCenter.deleteMany({ where: {} });
    await this.prismaService.er_HospitalDepartment.deleteMany({ where: {} });
    await this.prismaService.er_HospitalMedicalEquipment.deleteMany({ where: {} });
    await this.prismaService.er_HospitalServereIllness.deleteMany({ where: {} });
    await this.prismaService.er_Hospital.deleteMany({ where: {} });
    await this.prismaService.er_Department.deleteMany({ where: {} });
    await this.prismaService.er_MedicalEquipment.deleteMany({ where: {} });
  }
  async hospitalSetup() {
    this.logger.debug('hospitalSetup');

    const file_path = path.join(__dirname, '../../../src/common/database/hospital.db.json');
    const json: er_Hospital[] = JSON.parse(fs.readFileSync(file_path, 'utf-8'));
    const data = json.map((a: er_Hospital) =>
      typeof a.hospital_phone === 'string' ? a : { ...a, hospital_phone: '' },
    );
    await this.prismaService.er_Hospital.createMany({
      data,
      skipDuplicates: true,
    });
  }
  async emergencyCenterSetup() {
    this.logger.debug('emergencyCenterSetup');
    const file_path = path.join(__dirname, '../../../src/common/database/emergency_center.db.json');
    const json: er_EmergencyCenter[] = JSON.parse(fs.readFileSync(file_path, 'utf-8'));
    const data = json.map((info: er_EmergencyCenter) => ({
      ...info,
      emergency_center_latitude: Number(info.emergency_center_latitude),
      emergency_center_longitude: Number(info.emergency_center_longitude),
    }));

    await this.prismaService.er_EmergencyCenter.createMany({
      data: data,
      skipDuplicates: true,
    });
  }
  async departmentSetup() {
    this.logger.debug('departmentSetup');
    const file_path = path.join(__dirname, '../../../src/common/database/department.db.json');
    const json: er_Department[] = JSON.parse(fs.readFileSync(file_path, 'utf-8'));
    await this.prismaService.er_Department.createMany({
      data: json,
      skipDuplicates: true,
    });
  }
  async medicalEquipmentSetup() {
    this.logger.debug('medicalEquipmentSetup');
    const file_path = path.join(__dirname, '../../../src/common/database/medical_equipment.db.json');
    const json = JSON.parse(fs.readFileSync(file_path, 'utf-8'));
    const data: er_MedicalEquipment[] = json.map((info: er_MedicalEquipment) => ({
      medical_equipment_id: info.medical_equipment_id,
      medical_equipment_name: info.medical_equipment_name,
    }));
    await this.prismaService.er_MedicalEquipment.createMany({
      data,
      skipDuplicates: true,
    });
  }
  async servereIllnessSetup() {
    this.logger.debug('servereIllnessSetup');
    const file_path = path.join(__dirname, '../../../src/common/database/severe_illness.db.json');
    const json = JSON.parse(fs.readFileSync(file_path, 'utf-8'));
    await this.prismaService.er_ServereIllness.createMany({
      data: json,
      skipDuplicates: true,
    });
  }
  async emergencyRoomSetup() {
    this.logger.debug('emergencyRoomSetup');
    const file_path = path.join(__dirname, '../../../src/common/database/emergency_room.db.json');
    const json = JSON.parse(fs.readFileSync(file_path, 'utf-8'));
    await this.prismaService.er_EmergencyRoom.createMany({
      data: json,
      skipDuplicates: true,
    });
  }
  async emergencyRoomBedSetup() {
    this.logger.debug('emergencyRoomBedSetup');
    const file_path = path.join(__dirname, '../../../src/common/database/emergency_room_bed.db.json');
    const json = JSON.parse(fs.readFileSync(file_path, 'utf-8'));
    await this.prismaService.er_EmergencyRoomBed.createMany({
      data: json,
      skipDuplicates: true,
    });
  }
}
