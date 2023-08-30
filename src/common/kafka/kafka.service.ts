// import { Injectable, OnModuleDestroy, OnModuleInit } from '@nestjs/common';
// import { Consumer, EachMessagePayload, Kafka, Producer } from 'kafkajs';
// import { SUBSCRIBER_FIXED_FN_REF_MAP, SUBSCRIBER_FN_REF_MAP, SUBSCRIBER_OBJ_REF_MAP } from './kafka.decorator';
// import { KafkaConfig, KafkaPayload } from './kafka.message';

// @Injectable()
// export class KafkaService implements OnModuleInit, OnModuleDestroy {
//   private kafka: Kafka;
//   private producer: Producer;
//   private consumer: Consumer;
//   private fixedConsumer: Consumer;
//   private readonly consumerSuffix = '-' + Math.floor(Math.random() * 100000);

//   constructor(private kafkaConfig: KafkaConfig) {
//     this.kafka = new Kafka({
//       clientId: this.kafkaConfig.clientId,
//       brokers: this.kafkaConfig.brokers,
//     });
//     this.producer = this.kafka.producer();
//     this.consumer = this.kafka.consumer({
//       groupId: this.kafkaConfig.groupId + this.consumerSuffix,
//     });
//     this.fixedConsumer = this.kafka.consumer({
//       groupId: this.kafkaConfig.groupId,
//     });
//   }

//   async onModuleInit(): Promise<void> {
//     await this.connect();

//     for (const [topic, functionRef] of SUBSCRIBER_FN_REF_MAP.entries()) {
//       if (functionRef) {
//         // attach the function with kafka topic name
//         this.bindAllTopicToConsumer(topic);
//       }
//     }

//     for (const [topic, functionRef] of SUBSCRIBER_FIXED_FN_REF_MAP.entries()) {
//       if (functionRef) {
//         // attach the function with kafka topic name
//         this.bindAllTopicToFixedConsumer(topic);
//       }
//     }

//     await this.fixedConsumer.run({
//       eachMessage: async ({ topic, message }: EachMessagePayload) => {
//         const functionRef = SUBSCRIBER_FIXED_FN_REF_MAP.get(topic);
//         if (functionRef) {
//           const object = SUBSCRIBER_OBJ_REF_MAP.get(topic);
//           if (message.value !== null) {
//             // bind the subscribed functions to topic
//             await functionRef.apply(object, [message.value.toString()]);
//           }
//         }
//       },
//     });

//     await this.consumer.run({
//       eachMessage: async ({ topic, message }: EachMessagePayload) => {
//         const functionRef = SUBSCRIBER_FN_REF_MAP.get(topic);
//         if (functionRef) {
//           const object = SUBSCRIBER_OBJ_REF_MAP.get(topic);
//           if (message.value !== null) {
//             // bind the subscribed functions to topic
//             await functionRef.apply(object, [message.value.toString()]);
//           }
//         }
//       },
//     });
//   }

//   async onModuleDestroy(): Promise<void> {
//     await this.disconnect();
//   }

//   async connect(): Promise<void> {
//     await this.producer.connect();
//     await this.consumer.connect();
//     await this.fixedConsumer.connect();
//   }

//   async disconnect(): Promise<void> {
//     await this.producer.disconnect();
//     await this.consumer.disconnect();
//     await this.fixedConsumer.disconnect();
//   }

//   async bindAllTopicToConsumer(_topic: string): Promise<void> {
//     await this.consumer.subscribe({ topic: _topic, fromBeginning: false });
//   }

//   async bindAllTopicToFixedConsumer(_topic: string): Promise<void> {
//     await this.fixedConsumer.subscribe({ topic: _topic, fromBeginning: false });
//   }

//   async sendMessage(kafkaTopic: string, kafkaMessage: KafkaPayload): Promise<any> {
//     await this.producer.connect();
//     const metadata = await this.producer
//       .send({
//         topic: kafkaTopic,
//         messages: [{ value: JSON.stringify(kafkaMessage) }],
//       })
//       .catch((e) => console.error(e.message, e));
//     await this.producer.disconnect();
//     return metadata;
//   }
// }

////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
import { Injectable, Logger, OnModuleDestroy, OnModuleInit } from '@nestjs/common';
import { Consumer, EachMessagePayload, Kafka, LogEntry, Partitioners, Producer, logLevel } from 'kafkajs';
import { SUBSCRIBER_FIXED_FN_REF_MAP, SUBSCRIBER_FN_REF_MAP, SUBSCRIBER_OBJ_REF_MAP } from './kafka.decorator';
import { KafkaConfig, KafkaPayload } from './kafka.message';

const CONSUMER_FROM_BEGINNING = false;

@Injectable()
export class KafkaService implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(KafkaService.name);
  private kafka: Kafka;
  private producer: Producer;
  private consumer: Consumer;
  private fixedConsumer: Consumer;
  private readonly consumerSuffix = '-' + Math.floor(Math.random() * 100000);

  constructor(private kafkaConfig: KafkaConfig) {
    this.kafka = new Kafka({
      clientId: this.kafkaConfig.clientId,
      brokers: this.kafkaConfig.brokers,
      logCreator: this.kafkaLogger.bind(this),
    });
    this.producer = this.kafka.producer({ createPartitioner: Partitioners.DefaultPartitioner });
    this.consumer = this.kafka.consumer({
      groupId: this.kafkaConfig.groupId + this.consumerSuffix,
    });
    this.fixedConsumer = this.kafka.consumer({
      groupId: this.kafkaConfig.groupId,
    });
  }

  async onModuleInit(): Promise<void> {
    try {
      await this.connect();

      this.subscribeToTopics(SUBSCRIBER_FN_REF_MAP, this.consumer, this.bindAllTopicToConsumer);
      this.subscribeToTopics(SUBSCRIBER_FIXED_FN_REF_MAP, this.fixedConsumer, this.bindAllTopicToFixedConsumer);

      this.runConsumer(this.fixedConsumer, SUBSCRIBER_FIXED_FN_REF_MAP);
      this.runConsumer(this.consumer, SUBSCRIBER_FN_REF_MAP);
    } catch (error) {
      this.logger.error('Failed to initialize Kafka', error);
      throw error;
    }
  }

  async onModuleDestroy(): Promise<void> {
    await this.disconnect();
  }

  async connect(): Promise<void> {
    try {
      await this.producer.connect();
      await this.consumer.connect();
      await this.fixedConsumer.connect();
    } catch (error) {
      this.logger.error('Failed to connect to Kafka', error);
      throw error;
    }
  }

  async disconnect(): Promise<void> {
    await this.producer.disconnect();
    await this.consumer.disconnect();
    await this.fixedConsumer.disconnect();
  }

  private async subscribeToTopics(
    map: Map<string, Function>,
    consumer: Consumer,
    bindFunction: Function,
  ): Promise<void> {
    for (const [topic, functionRef] of map.entries()) {
      if (functionRef) {
        await bindFunction.call(this, consumer, topic);
      }
    }
  }

  private async bindAllTopicToConsumer(consumer: Consumer, topic: string): Promise<void> {
    await consumer.subscribe({ topic, fromBeginning: CONSUMER_FROM_BEGINNING });
  }

  private async bindAllTopicToFixedConsumer(consumer: Consumer, topic: string): Promise<void> {
    await consumer.subscribe({ topic, fromBeginning: CONSUMER_FROM_BEGINNING });
  }

  private async runConsumer(consumer: Consumer, map: Map<string, Function>): Promise<void> {
    await consumer.run({
      eachMessage: async ({ topic, message }: EachMessagePayload) => {
        const functionRef = map.get(topic);
        if (functionRef) {
          const object = SUBSCRIBER_OBJ_REF_MAP.get(topic);
          if (message.value !== null) {
            await functionRef.apply(object, [message.value.toString()]);
          }
        }
      },
    });
  }

  async sendMessage<T>(kafkaTopic: string, kafkaMessage: KafkaPayload<T>): Promise<any> {
    try {
      const message: KafkaPayload<T> = {
        ...kafkaMessage,
        createdTime: new Date().toISOString(),
      };
      const metadata = await this.producer.send({
        topic: kafkaTopic,
        messages: [{ value: JSON.stringify(message) }],
      });
      return metadata;
    } catch (error) {
      this.logger.error('Failed to send message', error);
      throw error;
    }
  }

  private kafkaLogger(inputLevel: logLevel): any {
    return ({ namespace, level, label, log }: LogEntry) => {
      const { message, ...extra } = log;
      const logMessage = `${inputLevel} ${label} ${message}`;
      const context = `Kafka ${namespace} ${label}`;
      switch (level) {
        case logLevel.ERROR:
        case logLevel.NOTHING:
          this.logger.error(logMessage, extra ? JSON.stringify(extra) : '', context);
          break;
        case logLevel.WARN:
          this.logger.warn(logMessage, extra ? JSON.stringify(extra) : '', context);
          break;
        case logLevel.INFO:
          this.logger.log(logMessage, context);
          break;
        case logLevel.DEBUG:
          this.logger.debug(logMessage, context);
          break;
      }
    };
  }
}
