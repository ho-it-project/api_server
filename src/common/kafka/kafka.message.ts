import { v4 } from 'uuid';

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

export const createKafkaPayload = <T>(
  body: T,
  arg: {
    messageId?: string;
    messageType: string;
    topicName: string;
    createdTime?: string;
  },
): KafkaPayload<T> => {
  const { messageId = v4(), messageType, topicName, createdTime = new Date().toISOString() } = arg;
  return {
    body,
    messageId,
    messageType,
    topicName,
    createdTime,
  };
};
