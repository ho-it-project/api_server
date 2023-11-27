import { CryptoService } from '@common/crypto/crypto.service';
import { PrismaService } from '@common/prisma/prisma.service';
import { EMS_PATIENT_ERROR } from '@config/errors';
import { ConfigService } from '@nestjs/config';
import { Test, TestingModule } from '@nestjs/testing';
import { ems_Patient } from '@prisma/client';
import { EmsPatientService } from '@providers/ems/ems.patient.service';
import { EmsPatient } from '@src/providers/interface/ems/ems.patient.interface';
import { EmsPatientResponse } from '@src/types/ems.response.dto';
import typia from 'typia';
import { assertPrune } from 'typia/lib/misc';
import { v4 } from 'uuid';

describe('EmsPatientService', () => {
  let service: EmsPatientService;
  let prismaService: PrismaService;
  let cryptoService: CryptoService;
  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        EmsPatientService,
        {
          provide: PrismaService,
          useValue: {
            ems_Patient: {
              create: jest.fn(),
              findUnique: jest.fn(),
              findMany: jest.fn(),
              findFirst: jest.fn(),
            },
            ems_ABCDE_Assessment: {
              create: jest.fn(),
            },
            ems_DCAP_BTLS_Assessment: {
              create: jest.fn(),
            },
            ems_VS_Assessment: {
              create: jest.fn(),
            },
            ems_SAMPLE_Assessment: {
              create: jest.fn(),
            },
            ems_OPQRST_Assessment: {
              create: jest.fn(),
            },
          },
        },
        CryptoService,
        ConfigService,
      ],
    }).compile();

    service = module.get<EmsPatientService>(EmsPatientService);
    prismaService = module.get<PrismaService>(PrismaService);
    cryptoService = module.get<CryptoService>(CryptoService);
  });

  afterEach(() => {
    jest.resetAllMocks();
  });

  describe('createPatient', () => {
    let patientInfo: EmsPatient.CreatePatientDTO['patientInfo'];
    let user: EmsPatient.CreatePatientDTO['user'];
    beforeEach(() => {
      patientInfo = typia.random<EmsPatient.CreatePatientDTO['patientInfo']>();
      user = typia.random<EmsPatient.CreatePatientDTO['user']>();
    });

    it('should create a patient', async () => {
      const patient_id = v4();
      const mockPatient = typia.random<ems_Patient>();
      jest.spyOn(prismaService.ems_Patient, 'findFirst').mockResolvedValue(null);
      jest.spyOn(prismaService.ems_Patient, 'create').mockResolvedValue({ ...mockPatient, patient_id });

      const result = await service.createPatient(
        assertPrune<EmsPatient.CreatePatientDTO>({
          patientInfo,
          user,
        }),
      );

      expect(result).toEqual({ patient_id });
    });

    it('should return INCHARGED_PATIENT_ALREADY_EXIST', async () => {
      const mockPatient = typia.random<ems_Patient>();
      jest.spyOn(prismaService.ems_Patient, 'findFirst').mockResolvedValue(mockPatient);
      const result = await service.createPatient(
        assertPrune<EmsPatient.CreatePatientDTO>({
          patientInfo,
          user,
        }),
      );
      expect(result).toEqual(typia.random<EMS_PATIENT_ERROR.INCHARGED_PATIENT_ALREADY_EXIST>());
    });
  });

  describe('getPatientDetail', () => {
    let mockPatientDetail: EmsPatientResponse.GetPatientDetail & { patient_salt: { salt: string } };

    beforeEach(() => {
      mockPatientDetail = typia.random<typeof mockPatientDetail>();
      prismaService.ems_Patient.findUnique = jest.fn().mockResolvedValue(mockPatientDetail);
      cryptoService.decrypt = jest.fn().mockResolvedValue(mockPatientDetail.patient_identity_number);
    });
    afterEach(() => {
      jest.resetAllMocks();
    });
    it('should return a patient detail', async () => {
      const patient_id = v4();
      const result = await service.getPatientDetail(patient_id);

      expect(result).toEqual(assertPrune<EmsPatientResponse.GetPatientDetail>(mockPatientDetail));
    });

    it('should return EMS_PATIENT_ERROR.PATIENT_NOT_FOUND', async () => {
      const patient_id = v4();
      prismaService.ems_Patient.findUnique = jest.fn().mockResolvedValue(null);
      const result = await service.getPatientDetail(patient_id);
      expect(result).toEqual(typia.random<EMS_PATIENT_ERROR.PATIENT_NOT_FOUND>());
    });
  });

  describe('getPatientList', () => {
    let mockPatientList: EmsPatientResponse.GetPatientList;
    let query: EmsPatient.GetPatientListDTO['query'];
    let user: EmsPatient.GetPatientListDTO['user'];
    beforeEach(() => {
      mockPatientList = typia.random<EmsPatientResponse.GetPatientList>();
      query = typia.random<EmsPatient.GetPatientListDTO['query']>();
      user = typia.random<EmsPatient.GetPatientListDTO['user']>();
      prismaService.ems_Patient.findMany = jest.fn().mockResolvedValue(mockPatientList.patient_list);
      prismaService.ems_Patient.count = jest.fn().mockResolvedValue(mockPatientList.count);
    });

    it('should return a patient list', async () => {
      const result = await service.getPatientList({ query, user });
      expect(result).toEqual(mockPatientList);
    });

    it('should return a patient list with search', async () => {
      const search = 'test';
      const search_type = 'patient_name';
      const result = await service.getPatientList({
        query: {
          ...query,
          search,
          search_type,
        },
        user,
      });
      expect(result).toEqual(mockPatientList);
    });

    it('should return a patient list with patient_status', async () => {
      const patient_status = typia.random<EmsPatient.GetPatientListDTO['query']['patient_status']>();
      const result = await service.getPatientList({
        query: {
          ...query,
          patient_status,
        },
        user,
      });
      expect(result).toEqual(mockPatientList);
    });

    it('should return a patient list with patient_severity', async () => {
      const patient_severity = typia.random<EmsPatient.GetPatientListDTO['query']['patient_severity']>();
      const result = await service.getPatientList({
        query: {
          ...query,
          patient_severity,
        },
        user,
      });
      expect(result).toEqual(mockPatientList);
    });

    it('should return a patient list with patient_emergency_cause', async () => {
      const patient_emergency_cause = typia.random<EmsPatient.GetPatientListDTO['query']['patient_emergency_cause']>();
      const result = await service.getPatientList({
        query: {
          ...query,
          patient_emergency_cause,
        },
        user,
      });
      expect(result).toEqual(mockPatientList);
    });
  });

  describe('createABCDEAssessment', () => {
    let mockCreateABCDEAssessment: EmsPatient.CreateABCDEAssessment;
    beforeEach(() => {
      mockCreateABCDEAssessment = typia.random<EmsPatient.CreateABCDEAssessment>();

      prismaService.ems_ABCDE_Assessment.create = jest.fn().mockResolvedValue(mockCreateABCDEAssessment);
      prismaService.ems_Patient.findUnique = jest.fn().mockResolvedValue(typia.random<ems_Patient>());
    });
    afterEach(() => {
      jest.resetAllMocks();
    });
    it('should create an ABCDE assessment', async () => {
      prismaService.ems_Patient.findUnique = jest.fn().mockResolvedValue({
        ...typia.random<ems_Patient>(),
        patient_id: mockCreateABCDEAssessment.patient_id,
        ems_employee_id: mockCreateABCDEAssessment.ems_employee_id,
      });
      const result = await service.createABCDEAssessment(mockCreateABCDEAssessment);
      expect(result).toEqual(mockCreateABCDEAssessment);
    });
    it('should return EMS_PATIENT_ERROR.PATIENT_NOT_FOUND', async () => {
      prismaService.ems_Patient.findUnique = jest.fn().mockResolvedValue(null);

      const result = await service.createABCDEAssessment({
        ...mockCreateABCDEAssessment,
      });
      expect(result).toEqual(typia.random<EMS_PATIENT_ERROR.PATIENT_NOT_FOUND>());
    });
    it('should return EMS_PATIENT_ERROR.FORBIDDEN', async () => {
      prismaService.ems_Patient.findUnique = jest.fn().mockResolvedValue({
        ...typia.random<ems_Patient>(),
        patient_id: v4(),
        ems_employee_id: v4(),
      });
      const result = await service.createABCDEAssessment(mockCreateABCDEAssessment);
      expect(result).toEqual(typia.random<EMS_PATIENT_ERROR.FORBIDDEN>());
    });
  });

  describe('createDCAP_BTLSAssessment', () => {
    let mockCreateDCAP_BTLSAssessment: EmsPatient.CreateDCAP_BTLSAssessment;
    beforeEach(() => {
      mockCreateDCAP_BTLSAssessment = typia.random<EmsPatient.CreateDCAP_BTLSAssessment>();

      prismaService.ems_DCAP_BTLS_Assessment.create = jest.fn().mockResolvedValue(mockCreateDCAP_BTLSAssessment);
      prismaService.ems_Patient.findUnique = jest.fn().mockResolvedValue(typia.random<ems_Patient>());
    });
    afterEach(() => {
      jest.resetAllMocks();
    });
    it('should create an DCAP_BTLS assessment', async () => {
      prismaService.ems_Patient.findUnique = jest.fn().mockResolvedValue({
        ...typia.random<ems_Patient>(),
        patient_id: mockCreateDCAP_BTLSAssessment.patient_id,
        ems_employee_id: mockCreateDCAP_BTLSAssessment.ems_employee_id,
      });
      const result = await service.createDCAP_BTLSAssessment(mockCreateDCAP_BTLSAssessment);
      expect(result).toEqual(mockCreateDCAP_BTLSAssessment);
    });
    it('should return EMS_PATIENT_ERROR.PATIENT_NOT_FOUND', async () => {
      prismaService.ems_Patient.findUnique = jest.fn().mockResolvedValue(null);

      const result = await service.createDCAP_BTLSAssessment({
        ...mockCreateDCAP_BTLSAssessment,
      });
      expect(result).toEqual(typia.random<EMS_PATIENT_ERROR.PATIENT_NOT_FOUND>());
    });
    it('should return EMS_PATIENT_ERROR.FORBIDDEN', async () => {
      prismaService.ems_Patient.findUnique = jest.fn().mockResolvedValue({
        ...typia.random<ems_Patient>(),
        patient_id: v4(),
        ems_employee_id: v4(),
      });
      const result = await service.createDCAP_BTLSAssessment(mockCreateDCAP_BTLSAssessment);
      expect(result).toEqual(typia.random<EMS_PATIENT_ERROR.FORBIDDEN>());
    });
  });

  describe('createVSAssessment', () => {
    let mockCreateVSAssessment: EmsPatient.CreateVSAssessment;
    beforeEach(() => {
      mockCreateVSAssessment = typia.random<EmsPatient.CreateVSAssessment>();

      prismaService.ems_VS_Assessment.create = jest.fn().mockResolvedValue(mockCreateVSAssessment);
      prismaService.ems_Patient.findUnique = jest.fn().mockResolvedValue(typia.random<ems_Patient>());
    });
    afterEach(() => {
      jest.resetAllMocks();
    });
    it('should create an VS assessment', async () => {
      prismaService.ems_Patient.findUnique = jest.fn().mockResolvedValue({
        ...typia.random<ems_Patient>(),
        patient_id: mockCreateVSAssessment.patient_id,
        ems_employee_id: mockCreateVSAssessment.ems_employee_id,
      });
      const result = await service.createVSAssessment(mockCreateVSAssessment);
      expect(result).toEqual(mockCreateVSAssessment);
    });
    it('should return EMS_PATIENT_ERROR.PATIENT_NOT_FOUND', async () => {
      prismaService.ems_Patient.findUnique = jest.fn().mockResolvedValue(null);

      const result = await service.createVSAssessment({
        ...mockCreateVSAssessment,
      });
      expect(result).toEqual(typia.random<EMS_PATIENT_ERROR.PATIENT_NOT_FOUND>());
    });
    it('should return EMS_PATIENT_ERROR.FORBIDDEN', async () => {
      prismaService.ems_Patient.findUnique = jest.fn().mockResolvedValue({
        ...typia.random<ems_Patient>(),
        patient_id: v4(),
        ems_employee_id: v4(),
      });
      const result = await service.createVSAssessment(mockCreateVSAssessment);
      expect(result).toEqual(typia.random<EMS_PATIENT_ERROR.FORBIDDEN>());
    });
  });

  describe('createSAMPLEAssessment', () => {
    let mockCreateSAMPLEAssessment: EmsPatient.CreateSAMPLEAssessment;
    beforeEach(() => {
      mockCreateSAMPLEAssessment = typia.random<EmsPatient.CreateSAMPLEAssessment>();

      prismaService.ems_SAMPLE_Assessment.create = jest.fn().mockResolvedValue(mockCreateSAMPLEAssessment);
      prismaService.ems_Patient.findUnique = jest.fn().mockResolvedValue(typia.random<ems_Patient>());
    });
    afterEach(() => {
      jest.resetAllMocks();
    });
    it('should create an SAMPLE assessment', async () => {
      prismaService.ems_Patient.findUnique = jest.fn().mockResolvedValue({
        ...typia.random<ems_Patient>(),
        patient_id: mockCreateSAMPLEAssessment.patient_id,
        ems_employee_id: mockCreateSAMPLEAssessment.ems_employee_id,
      });
      const result = await service.createSAMPLEAssessment(mockCreateSAMPLEAssessment);
      expect(result).toEqual(mockCreateSAMPLEAssessment);
    });

    it('should return EMS_PATIENT_ERROR.PATIENT_NOT_FOUND', async () => {
      prismaService.ems_Patient.findUnique = jest.fn().mockResolvedValue(null);

      const result = await service.createSAMPLEAssessment({
        ...mockCreateSAMPLEAssessment,
      });
      expect(result).toEqual(typia.random<EMS_PATIENT_ERROR.PATIENT_NOT_FOUND>());
    });

    it('should return EMS_PATIENT_ERROR.FORBIDDEN', async () => {
      prismaService.ems_Patient.findUnique = jest.fn().mockResolvedValue({
        ...typia.random<ems_Patient>(),
        patient_id: v4(),
        ems_employee_id: v4(),
      });
      const result = await service.createSAMPLEAssessment(mockCreateSAMPLEAssessment);
      expect(result).toEqual(typia.random<EMS_PATIENT_ERROR.FORBIDDEN>());
    });
  });

  describe('createOPQRSTAssessment', () => {
    let mockCreateOPQRSTAssessment: EmsPatient.CreateOPQRSTAssessment;
    beforeEach(() => {
      mockCreateOPQRSTAssessment = typia.random<EmsPatient.CreateOPQRSTAssessment>();

      prismaService.ems_OPQRST_Assessment.create = jest.fn().mockResolvedValue(mockCreateOPQRSTAssessment);
      prismaService.ems_Patient.findUnique = jest.fn().mockResolvedValue(typia.random<ems_Patient>());
    });
    afterEach(() => {
      jest.resetAllMocks();
    });

    it('should create an OPQRST assessment', async () => {
      prismaService.ems_Patient.findUnique = jest.fn().mockResolvedValue({
        ...typia.random<ems_Patient>(),
        patient_id: mockCreateOPQRSTAssessment.patient_id,
        ems_employee_id: mockCreateOPQRSTAssessment.ems_employee_id,
      });
      const result = await service.createOPQRSTAssessment(mockCreateOPQRSTAssessment);
      expect(result).toEqual(mockCreateOPQRSTAssessment);
    });
    it('should return EMS_PATIENT_ERROR.PATIENT_NOT_FOUND', async () => {
      prismaService.ems_Patient.findUnique = jest.fn().mockResolvedValue(null);

      const result = await service.createOPQRSTAssessment({
        ...mockCreateOPQRSTAssessment,
      });
      expect(result).toEqual(typia.random<EMS_PATIENT_ERROR.PATIENT_NOT_FOUND>());
    });
    it('should return EMS_PATIENT_ERROR.FORBIDDEN', async () => {
      prismaService.ems_Patient.findUnique = jest.fn().mockResolvedValue({
        ...typia.random<ems_Patient>(),
        patient_id: v4(),
        ems_employee_id: v4(),
      });
      const result = await service.createOPQRSTAssessment(mockCreateOPQRSTAssessment);
      expect(result).toEqual(typia.random<EMS_PATIENT_ERROR.FORBIDDEN>());
    });
  });

  describe('checkPaitentIncharge', () => {
    let patient_id: string;
    let ems_employee_id: string;
    beforeEach(() => {
      const mock = typia.random<ems_Patient>();
      patient_id = mock.patient_id;
      ems_employee_id = mock.ems_employee_id;
      prismaService.ems_Patient.findUnique = jest.fn().mockResolvedValue(mock);
    });
    afterEach(() => {
      jest.resetAllMocks();
    });
    it('should return true', async () => {
      const result = await service.checkPaitentIncharge(patient_id, ems_employee_id);
      expect(result).toEqual(true);
    });
    it('should return EMS_PATIENT_ERROR.PATIENT_NOT_FOUND', async () => {
      prismaService.ems_Patient.findUnique = jest.fn().mockResolvedValue(null);
      const result = await service.checkPaitentIncharge(patient_id, ems_employee_id);
      expect(result).toEqual(typia.random<EMS_PATIENT_ERROR.PATIENT_NOT_FOUND>());
    });
    it('should return EMS_PATIENT_ERROR.FORBIDDEN', async () => {
      prismaService.ems_Patient.findUnique = jest.fn().mockResolvedValue({
        ...typia.random<ems_Patient>(),
        patient_id: v4(),
        ems_employee_id: v4(),
      });
      const result = await service.checkPaitentIncharge(patient_id, ems_employee_id);
      expect(result).toEqual(typia.random<EMS_PATIENT_ERROR.FORBIDDEN>());
    });
  });

  describe('updatePatientStatus', () => {
    let user: EmsPatient.UpdatePatientStatus['user'];
    const patient_id = typia.random<EmsPatient.UpdatePatientStatus['patient_id']>();
    const ems_patinet = typia.random<ems_Patient>();
    beforeEach(() => {
      prismaService.ems_Patient.update = jest.fn().mockResolvedValue(ems_patinet);
      prismaService.ems_Patient.findUnique = jest.fn().mockResolvedValue(ems_patinet);
    });

    afterEach(() => {
      jest.resetAllMocks();
    });

    it('should return EMS_PATIENT_ERROR.PATIENT_NOT_FOUNT', async () => {
      prismaService.ems_Patient.findUnique = jest.fn().mockResolvedValue(null);
      user = { ...typia.random<EmsPatient.UpdatePatientStatus['user']>(), employee_id: '권한있음' };
      const patient_status = 'ACCEPTED';
      const result = await service.updatePatientStatus({ user, patient_id, patient_status });
      expect(result).toEqual(typia.random<EMS_PATIENT_ERROR.PATIENT_NOT_FOUND>());
    });

    it('should return EMS_PATIENT_ERROR.FORBIDDEN', async () => {
      user = { ...typia.random<EmsPatient.UpdatePatientStatus['user']>(), employee_id: '권한없음' };
      const patient_status = 'ACCEPTED';
      const result = await service.updatePatientStatus({ user, patient_id, patient_status });
      expect(result).toEqual(typia.random<EMS_PATIENT_ERROR.FORBIDDEN>());
    });

    it('should return EMS_PATIENT_ERROR.PATIENT_NOT_ACCEPTED', async () => {
      user = { ...typia.random<EmsPatient.UpdatePatientStatus['user']>(), employee_id: '권한있음' };
      prismaService.ems_Patient.findUnique = jest
        .fn()
        .mockResolvedValue({ ...ems_patinet, patient_status: 'REQUESTED', ems_employee_id: user.employee_id });
      const patient_status = 'COMPLETED';
      const result = await service.updatePatientStatus({
        user,
        patient_id,
        patient_status,
      });
      expect(result).toEqual(typia.random<EMS_PATIENT_ERROR.PATIENT_NOT_ACCEPTED>());
    });

    it('should return EMS_PATIENT_ERROR.PATIENT_CANCEL_NOT_ALLOWED', async () => {
      user = { ...typia.random<EmsPatient.UpdatePatientStatus['user']>(), employee_id: '권한있음' };
      prismaService.ems_Patient.findUnique = jest
        .fn()
        .mockResolvedValue({ ...ems_patinet, patient_status: 'REQUESTED', ems_employee_id: user.employee_id });
      const patient_status = 'CANCELED';
      const result = await service.updatePatientStatus({
        user,
        patient_id,
        patient_status,
      });
      expect(result).toEqual(typia.random<EMS_PATIENT_ERROR.PATIENT_CANCEL_NOT_ALLOWED>());
    });

    it('should return EMS_PATIENT_ERROR.PATIENT_CANCEL_ALREADY', async () => {
      user = { ...typia.random<EmsPatient.UpdatePatientStatus['user']>(), employee_id: '권한있음' };
      prismaService.ems_Patient.findUnique = jest
        .fn()
        .mockResolvedValue({ ...ems_patinet, patient_status: 'CANCELED', ems_employee_id: user.employee_id });
      const patient_status = 'CANCELED';
      const result = await service.updatePatientStatus({
        user,
        patient_id,
        patient_status,
      });
      expect(result).toEqual(typia.random<EMS_PATIENT_ERROR.PATIENT_CANCEL_ALREADY>());
    });

    it('should return EMS_PATIENT_ERROR.PATIENT_COMPLETE_ALREADY', async () => {
      user = { ...typia.random<EmsPatient.UpdatePatientStatus['user']>(), employee_id: '권한있음' };
      prismaService.ems_Patient.findUnique = jest
        .fn()
        .mockResolvedValue({ ...ems_patinet, patient_status: 'COMPLETED', ems_employee_id: user.employee_id });
      const patient_status = 'CANCELED';
      const result = await service.updatePatientStatus({
        user,
        patient_id,
        patient_status,
      });
      expect(result).toEqual(typia.random<EMS_PATIENT_ERROR.PATIENT_COMPLETE_ALREADY>());
    });
  });
});
