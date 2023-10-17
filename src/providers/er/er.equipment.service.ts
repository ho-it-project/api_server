import { PrismaService } from '@common/prisma/prisma.service';
import { ER_EQUIPMENT_ERROR } from '@config/errors';
import { Injectable } from '@nestjs/common';
import typia from 'typia';
import { ErEquipment } from '../interface/er/er.equipment.interface';

@Injectable()
export class ErEquipmentService {
  constructor(private readonly prisamService: PrismaService) {}

  async getEquipmentStatus({ user }: ErEquipment.GetEquipmentStatusArg): Promise<ErEquipment.GetEquipmentStatusReturn> {
    const { hospital_id } = user;
    const equipmentStatus = await this.prisamService.er_MedicalEquipment.findMany({
      include: {
        hospital_medical_equipment: {
          where: { hospital_id },
        },
      },
    });
    const result = equipmentStatus.map((v) => ({
      equipment_id: v.medical_equipment_id,
      equipment_name: v.medical_equipment_name,
      equipment_count: v.hospital_medical_equipment.length
        ? v.hospital_medical_equipment[0].medical_equipment_count
        : 0,
    }));
    return result;
  }

  async validatePatchDocument(
    patchDocument: ErEquipment.UpdateEquipmentStatusArg['patchDocument'],
  ): Promise<ErEquipment.ValidatePatchDocumentReturn> {
    const ids = patchDocument.map((v) => v.equipment_id);
    const ids_in_db = (
      await this.prisamService.er_MedicalEquipment.findMany({
        where: { medical_equipment_id: { in: ids } },
      })
    ).map((v) => v.medical_equipment_id);
    const result = ids.filter((v) => !ids_in_db.includes(v));
    if (result.length == 0) return true;
    return result;
  }
  async updateEquipmentStatus({
    patchDocument,
    user,
  }: ErEquipment.UpdateEquipmentStatusArg): Promise<ErEquipment.UpdateEquipmentStatusReturn> {
    const validation = await this.validatePatchDocument(patchDocument);
    if (validation !== true) {
      const error = typia.random<ER_EQUIPMENT_ERROR.EQUIPMENT_NOT_EXIST>();
      error.message += validation;
      return error;
    }
    const { hospital_id } = user;
    const patchedData = await this.prisamService.$transaction(
      patchDocument.map((v) =>
        this.prisamService.er_HospitalMedicalEquipment.upsert({
          where: { hospital_id_medical_equipment_id: { hospital_id, medical_equipment_id: v.equipment_id } },
          create: { hospital_id, medical_equipment_id: v.equipment_id, medical_equipment_count: v.equipment_count },
          update: { medical_equipment_count: v.equipment_count },
          include: { medical_equipment: { select: { medical_equipment_name: true } } },
        }),
      ),
    );
    const result = patchedData.map((v) => ({
      equipment_id: v.medical_equipment_id,
      equipment_name: v.medical_equipment.medical_equipment_name,
      equipment_count: v.medical_equipment_count,
    }));
    return result;
  }
}
