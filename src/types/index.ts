export interface DefaultData {
  /**
   * @type string
   */
  created_at: string;

  /**
   * @type string
   */
  updated_at: string;
}

export interface TestBody2 {
  // test: TestBody;
}

export interface LoginDTO {
  emergency_center_id: string;
  id_card: string;
  password: string;
}
