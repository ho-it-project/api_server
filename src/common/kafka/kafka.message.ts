export interface KafkaPayload<T> {
  /**
   * @type T
   */
  body: T;

  /**
   * @type string
   */
  messageId: string;

  /**
   * @type string
   */
  messageType: string;

  /**
   * @type string
   */
  topicName: string;
  /**
   * @type Date
   * @default new Date().toISOString()
   * @format date-time
   */
  createdTime?: string;
  // constructor(messageId: string, body: any, messageType: string, topicName: string) {
  //   this.messageId = messageId;
  //   this.body = body;
  //   this.messageType = messageType;
  //   this.topicName = topicName;
  //   this.createdTime = new Date().toISOString();
  // }
}

export interface KafkaConsumerPayload<T> {
  key: string | null;
  value: KafkaPayload<T>;
}
export class KafkaConfig {
  public clientId: string;
  public brokers: string[];
  public groupId: string;

  constructor(clientId: string, brokers: string[], groupId: string) {
    this.clientId = clientId;
    this.brokers = brokers;
    this.groupId = groupId;
  }
}

type option = {
  key?: string | null;
  headers?: Record<string, string>;
};

export const createKafkaMessage = <T>(payload: T, option?: option) => {
  return {
    value: payload,
    ...option,
  };
};
