import { ER_EQUIPMENT_ERROR } from '@config/errors';
import { er_HospitalMedicalEquipment, er_MedicalEquipment } from '@prisma/client';
import { ErAuth } from '@src/auth/interface';
import { ErEquipmentRequest } from '@src/types';

export namespace ErEquipment {
  // GET
  export interface GetEquipmentStatusArg {
    user: ErAuth.AccessTokenSignPayload;
  }
  export type GetEquipmentStatusReturn = {
    equipment_id: er_MedicalEquipment['medical_equipment_id'];
    equipment_name: er_MedicalEquipment['medical_equipment_name'];
    equipment_count: er_HospitalMedicalEquipment['medical_equipment_count'];
  }[];

  // PATCH
  export interface UpdateEquipmentStatusArg {
    patchDocument: ErEquipmentRequest.UpdateEquipmentStatusDto;
    user: ErAuth.AccessTokenSignPayload;
  }
  export type UpdateEquipmentStatusReturn = ER_EQUIPMENT_ERROR.EQUIPMENT_NOT_EXIST | GetEquipmentStatusReturn;

  //Validation
  export type ValidatePatchDocumentArg = UpdateEquipmentStatusArg;
  export type ValidatePatchDocumentReturn = true | number[];
}
