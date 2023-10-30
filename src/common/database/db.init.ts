import { PrismaService } from '@common/prisma/prisma.service';
import { Injectable, Logger } from '@nestjs/common';
import {
  ems_Ambulance,
  ems_AmbulanceCompany,
  ems_EmployeeRole,
  er_Department,
  er_DoctorSpecialization,
  er_EmergencyCenter,
  er_EmployeeRole,
  er_Hospital,
  er_MedicalEquipment,
  er_NurseSpecialization,
} from '@prisma/client';
import bcrypt from 'bcrypt';
import fs from 'fs';
import path from 'path';
@Injectable()
export class DbInit {
  constructor(private readonly prismaService: PrismaService) {}
  private readonly logger = new Logger(DbInit.name);
  async init() {
    if (process.env.NODE_ENV === 'production' || process.env.DATABASE_URL?.indexOf('ho-it') !== -1) return;

    this.logger.debug('init');
    this.logger.debug('delete all');
    await this.deleteAll();
    this.logger.debug('er setup');
    await this.hospitalSetup();
    await this.emergencyCenterSetup();
    await this.departmentSetup();
    await this.doctorSpecializationSetup();
    await this.nurseSpecializationSetup();
    await this.medicalEquipmentSetup();
    await this.servereIllnessSetup();
    await this.emergencyRoomSetup();
    await this.emergencyRoomBedSetup();
    await this.employeeSetup();

    this.logger.debug('ems setup');
    await this.ambulanceCompanySetup();
    await this.ambulanceSetup();
    await this.ambulanceCompanyEmployeeSetup();
  }
  async deleteAll() {
    this.logger.debug('delete all');
    await this.prismaService.$transaction([
      this.prismaService.er_Patient.deleteMany({ where: {} }),
      this.prismaService.er_EmergencyRoomBedLog.deleteMany({ where: {} }),
      this.prismaService.er_EmergencyRoomBed.deleteMany({ where: {} }),
      this.prismaService.er_EmergencyRoom.deleteMany({ where: {} }),
      this.prismaService.er_EmergencyCenter.deleteMany({ where: {} }),
      this.prismaService.er_HospitalDepartment.deleteMany({ where: {} }),
      this.prismaService.er_HospitalMedicalEquipment.deleteMany({ where: {} }),
      this.prismaService.er_HospitalServereIllness.deleteMany({ where: {} }),
      this.prismaService.er_EmployeeDoctorSpecialization.deleteMany({ where: {} }),
      this.prismaService.er_EmployeeNurseSpecialization.deleteMany({ where: {} }),
      this.prismaService.er_Employee.deleteMany({ where: {} }),
      this.prismaService.er_Hospital.deleteMany({ where: {} }),
      this.prismaService.er_MedicalEquipment.deleteMany({ where: {} }),
      this.prismaService.er_Department.deleteMany({ where: {} }),
      this.prismaService.er_DoctorSpecialization.deleteMany({ where: {} }),
      this.prismaService.er_NurseSpecialization.deleteMany({ where: {} }),
      this.prismaService.ems_DCAP_BTLS_Assessment.deleteMany({ where: {} }),
      this.prismaService.ems_ABCDE_Assessment.deleteMany({ where: {} }),
      this.prismaService.ems_SAMPLE_Assessment.deleteMany({ where: {} }),
      this.prismaService.ems_VS_Assessment.deleteMany({ where: {} }),
      this.prismaService.ems_OPQRST_Assessment.deleteMany({ where: {} }),
      this.prismaService.ems_Guardian.deleteMany({ where: {} }),
      this.prismaService.ems_PatientSalt.deleteMany({ where: {} }),
      this.prismaService.ems_Patient.deleteMany({ where: {} }),
      this.prismaService.ems_Ambulance.deleteMany({ where: {} }),
      this.prismaService.ems_Employee.deleteMany({ where: {} }),
      this.prismaService.ems_AmbulanceCompany.deleteMany({ where: {} }),
      this.prismaService.req_EmsToErRequest.deleteMany({ where: {} }),
      this.prismaService.req_Patient.deleteMany({ where: {} }),
    ]);
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
  async employeeSetup() {
    this.logger.debug('employeeSetup');
    const file_path = path.join(__dirname, '../../../src/common/database/emergency_center.db.json');
    const json: er_EmergencyCenter[] = JSON.parse(fs.readFileSync(file_path, 'utf-8'));

    const employees = await Promise.all(
      json.map(async (emergency_center) => {
        const { hospital_id } = emergency_center;
        const employee_name = 'admin';
        const hashedPassword = await bcrypt.hash('1234', Number(process.env.HASH_SALT));
        return {
          hospital_id,
          employee_name,
          id_card: 'admin',
          password: hashedPassword,
          role: 'ADMIN' as er_EmployeeRole,
        };
      }),
    );

    await this.prismaService.er_Employee.createMany({
      data: employees,
      skipDuplicates: true,
    });
  }

  async ambulanceCompanySetup() {
    this.logger.debug('ambulanceCompanySetup');
    const file_path = path.join(__dirname, '../../../src/common/database/ambulance_company.db.json');
    const json: ems_AmbulanceCompany[] = JSON.parse(fs.readFileSync(file_path, 'utf-8'));
    await this.prismaService.ems_AmbulanceCompany.createMany({
      data: json,
      skipDuplicates: true,
    });
  }

  async ambulanceSetup() {
    this.logger.debug('ambulanceSetup');
    const file_path = path.join(__dirname, '../../../src/common/database/ambulance.db.json');
    const json: ems_Ambulance[] = JSON.parse(fs.readFileSync(file_path, 'utf-8'));
    await this.prismaService.ems_Ambulance.createMany({
      data: json,
      skipDuplicates: true,
    });
  }

  async ambulanceCompanyEmployeeSetup() {
    this.logger.debug('ambulanceCompanyEmployeeSetup');
    const file_path = path.join(__dirname, '../../../src/common/database/ambulance_company.db.json');
    const json: ems_AmbulanceCompany[] = JSON.parse(fs.readFileSync(file_path, 'utf-8'));
    const employees = await Promise.all(
      json.map(async (ambulance_company) => {
        const { ambulance_company_id } = ambulance_company;
        const employee_name = 'admin';
        const hashedPassword = await bcrypt.hash('1234', Number(process.env.HASH_SALT));
        return {
          ambulance_company_id,
          employee_name,
          id_card: 'admin',
          password: hashedPassword,
          role: 'ADMIN' as ems_EmployeeRole,
        };
      }),
    );

    await this.prismaService.ems_Employee.createMany({
      data: employees,
      skipDuplicates: true,
    });
  }

  async doctorSpecializationSetup() {
    this.logger.debug('doctorSpecializationSetup');
    const file_path = path.join(__dirname, '../../../src/common/database/doctor_specializations.db.json');
    const json: er_DoctorSpecialization[] = JSON.parse(fs.readFileSync(file_path, 'utf-8'));
    await this.prismaService.er_DoctorSpecialization.createMany({
      data: json,
      skipDuplicates: true,
    });
  }
  async nurseSpecializationSetup() {
    this.logger.debug('nurseSpecializationSetup');
    const file_path = path.join(__dirname, '../../../src/common/database/nurse_specializations.db.json');
    const json: er_NurseSpecialization[] = JSON.parse(fs.readFileSync(file_path, 'utf-8'));
    await this.prismaService.er_NurseSpecialization.createMany({
      data: json,
      skipDuplicates: true,
    });
  }
}
