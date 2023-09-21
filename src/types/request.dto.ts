export namespace AuthRequest {
  export interface LoginDTO {
    /**
     * @type string
     * @description 응급센터 아이디
     */
    emergency_center_id: string;

    /**
     * @type string
     * @description 직원 고유아이디
     */
    id_card: string;

    /**
     * @type string
     * @description 직원 비밀번호
     */
    password: string;
  }
}
