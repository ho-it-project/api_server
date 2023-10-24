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
   * - 부모를 업데이트할 때, 해당 부모의 자식들 모두 patch document list에 존재해야합니다.
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
   *      : 간략하게 `{id:status}`로 표현하여, `{내과id:active}`가 존재하면
   *        내과의 하위 진료과 모두 값이 존재해야함. `{내과1id:active}, {내과2id:active}...`
   *        바꾸려는 상태는 부모, 자식 모두 동일해야한다.(따로 검증하지는 않는다.)
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
  @TypedException<ER_DEPARTMENT_ERROR.INVALID_PATCH_DATA>(
    ER_DEPARTMENT_ERROR.invalidPatchData.http_status_code,
    ER_DEPARTMENT_ERROR.invalidPatchData.message +
      '\n업데이트를 요청한 진료과 id가 존재하지 않을 수 있습니다. \n부모에 대한 요청일 경우 부모의 자식이 patch document에 존재하지 않을 수 있습니다.',
  )
  async updateAvailableDepartment(
    @TypedBody()
    patchDocument: ErDepartmentRequest.UpdateAvailableDepartmentDto,
    @CurrentUser() user: ErAuth.AccessTokenSignPayload,
  ): Promise<Try<ErDepartmentResponse.UpdateAvailableDepartment>> {
    const result = await this.erDepartmentService.updateAvailableDepartments({ user, patchDocument });
    if (isError(result)) return throwError(result);
    return createResponse(result);
  }
}
