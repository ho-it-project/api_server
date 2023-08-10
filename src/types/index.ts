export interface TestBody {
  /**
   * @type int
   */
  test_id: number;

  /**
   * @type string
   */
  test_name?: string;
}

export interface TestBody2 {
  test: TestBody;
}
