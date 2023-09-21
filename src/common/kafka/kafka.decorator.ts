export const SUBSCRIBER_FN_REF_MAP: Map<string, (...args: any[]) => any> = new Map();
export const SUBSCRIBER_FIXED_FN_REF_MAP: Map<string, (...args: any[]) => any> = new Map();
export const SUBSCRIBER_OBJ_REF_MAP: Map<string, any> = new Map();

export const SubscribeTo = (topic: string): ((...arg: any[]) => PropertyDescriptor) => {
  return (target: any, propertyKey: string, descriptor: PropertyDescriptor) => {
    const originalMethod = target[propertyKey] as (...args: any[]) => any;
    SUBSCRIBER_FN_REF_MAP.set(topic, originalMethod);
    SUBSCRIBER_OBJ_REF_MAP.set(topic, target);
    return descriptor;
  };
};

export const SubscribeToFixedGroup = (topic: string): ((...arg: any[]) => PropertyDescriptor) => {
  return (target: any, propertyKey: string, descriptor: PropertyDescriptor) => {
    const originalMethod = target[propertyKey] as (...args: any[]) => any;
    SUBSCRIBER_FIXED_FN_REF_MAP.set(topic, originalMethod);
    SUBSCRIBER_OBJ_REF_MAP.set(topic, target);
    return descriptor;
  };
};
