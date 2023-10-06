export namespace ReqEmsToErResponse {
  export interface createEmsToErRequest {
    target_emergency_center_list: {
      emergency_center_id: string;
      emergency_center_name: string;
      emergency_center_latitude: number;
      emergency_center_longitude: number;
      distance: number;
    }[];
  }
}
