import { CurrentUser } from '@common/decorators/CurrentUser';
import { AdminGuard } from '@common/guard/admin.guard';
import { createResponse } from '@common/interceptor/createResponse';
import { ER_DEPARTMENT_ERROR, isError, throwError } from '@config/errors';
import { TypedBody, TypedException, TypedRoute } from '@nestia/core';
import { Controller, UseGuards } from '@nestjs/common';
import { ErJwtAccessAuthGuard } from '@src/auth/guard/er.jwt.access.guard';
import { ErAuth } from '@src/auth/interface';
import { ErDepartmentService } from '@src/providers/er/er.department.service';
import { ErDepartmentRequest, ErDepartmentResponse } from '@src/types';
import { Try } from './../../types/index';

@Controller('/er/hospitals/current/departments')
export class ErDepartmentController {
  constructor(private readonly erDepartmentService: ErDepartmentService) {}

  /**
   * 진료과 조회  
   * 진료과를 모두 조회합니다. 진료가능여부는 status로 구분합니다.(ACTIVE: 진료가능)
   * - 상태로써, 부모의 active는 모두 선택된 상태를 의미하고, inactive는 active의 여집합을 나타냅니다.(모두 inactive, 하나라도 inactive)
   * - 업데이트 명령으로써, 부모의 active는 모두 active로 만들라는 것을 의미하고, inactive는 모두 inactive로 만달라는 것을 의미합니다.
   *
   * @author anthony
   * @tag er_department
   * @summary 2023-10-09 - 병원별 진료과 호출 API
   *
   * @param user

   * @security access_token
   * @returns 진료가능과
   */
  @TypedRoute.Get('/')
  @UseGuards(ErJwtAccessAuthGuard)
  async getDepartmentStatusList(
    @CurrentUser() user: ErAuth.AccessTokenSignPayload,
  ): Promise<Try<ErDepartmentResponse.GetDepartmentStatusListDto>> {
    const DepartmentStatusList = await this.erDepartmentService.getDepartmentStatusList({ user });
    return createResponse(DepartmentStatusList);
  }

  /**
   * 병원 진료과의 상태를 업데이트합니다.
   * - 상태로써, 부모의 active는 모두 선택된 상태를 의미하고, inactive는 active의 여집합을 나타냅니다.(모두 inactive, 하나라도 inactive)
   * - 업데이트 명령으로써, 부모의 active는 모두 active로 만들라는 것을 의미하고, inactive는 모두 inactive로 만달라는 것을 의미합니다.
   * - 부모와 자식에 대한 업데이트 명령이 모두 있는 경우, 자식이 우선순위를 가집니다.
   * - 업데이트 항목에 대하여, 업데이트 이후 상태를 리턴합니다.
   * | 업데이트가 필요한 것에 대해서만 보내주세요.
   * 
   * - 예제
   *    - eg. 일반예제  
   *       ```javascript
   *       [  
   *       ...
   *           {  
                   "department_id": 4,  
                 "department_name": "소화기내과",  
                 "status": "INACTIVE"  
                   //"sub_departments" // XX  
               },  
           ...  
   *       ]
           ```  
   *       위 경우, 소회기내과의 기존 상태는 무시하고, 전달된 상태(INCATIVE)로 변경한다.
   * 
   *    - eg. 부모, 자식 모두 업데이트 명령이 존재하는 경우  
   *      : 간략하게 `{id:status}`로 표현하여, `{1:active}, {2:inactive}`로 전달된 경우.
   *      - 명령의 의미: 내과 전체를 active로 바꾸어라, 호홉기내과를 inactive로 바꾸어라.
   *      - 명령 수행
   *        1. 호홉기 내과를 제외한 모든 내과를 active로 업데이트하고, 
   *        2. 호홉기 내과는 inactive로 업데이트한다.
   *      - 응답: 명령수행 결과상태: `{1:inactive, 2:inactive, 3:active, 4: active ... 12:active}`
   *      - 응답에 대한 설명: 내과에 대하여 active명령을 수행하였으나, 명령 수행 결과 호홉기 내과가 inactive하다.  
   *        모든 자식 진료과가 active인 경우에만 부모가 active로 설정되기에, 부모(내과)는 inactive로 설정된다.
   * 
   * @author anthony
   * @tag er_department
   * @summary 2023-10-02 - 진료가능과 설정(추가)
   *
   * @param body
   * @param user
   * @security access_token
   * @returns 업데이트 이후 진료과 상태.(부모, 자식 계층표현x. flat하게 리턴합니다.)
   */
  @TypedRoute.Patch('/')
  @UseGuards(ErJwtAccessAuthGuard, AdminGuard)
  @TypedException<ER_DEPARTMENT_ERROR.DEPARTMENT_NOT_EXIST>(
    ER_DEPARTMENT_ERROR.departmentNotExist.http_status_code,
    ER_DEPARTMENT_ERROR.departmentNotExist.message,
  )
  async updateAvailableDepartment(
    @TypedBody()
    body: ErDepartmentRequest.UpdateAvailableDepartmentDto,
    @CurrentUser() user: ErAuth.AccessTokenSignPayload,
  ): Promise<Try<ErDepartmentResponse.UpdateAvailableDepartment>> {
    const result = await this.erDepartmentService.updateAvailableDepartments({ user, data: body });
    if (isError(result)) return throwError(result);
    return createResponse(result);
  }
}

