export namespace ReqEmsToErResponse {
  export interface createEmsToErRequest {
    /**
     * 요청된 병원 리스트
     * @title 요청된 병원 리스트
     */
    target_emergency_center_list: {
      emergency_center_id: string;
      emergency_center_name: string;
      emergency_center_latitude: number;
      emergency_center_longitude: number;
      distance: number;
    }[];
  }
}
