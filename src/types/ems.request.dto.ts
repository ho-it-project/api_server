export namespace EmsAuthRequest {
  export interface LoginDTO {
    /**
     * 구급업체 이름 - 추후 변경 가능성 있음
     * @type string
     * @title 구급업체 이름
     */
    ambulance_company_name: string;

    /**
     * 구급업체 직원 고유 아이디
     * @type string
     * @title 구급업체 직원 고유 아이디
     */
    id_card: string;

    /**
     * @title 비밀번호
     * @type string
     */
    password: string;
  }
}
