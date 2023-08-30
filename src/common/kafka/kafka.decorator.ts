export const SUBSCRIBER_FN_REF_MAP: Map<string, Function> = new Map();
export const SUBSCRIBER_FIXED_FN_REF_MAP: Map<string, Function> = new Map();
export const SUBSCRIBER_OBJ_REF_MAP: Map<string, any> = new Map();

export function SubscribeTo(topic: string) {
  return (target: any, propertyKey: string, descriptor: PropertyDescriptor) => {
    const originalMethod = target[propertyKey] as Function;
    SUBSCRIBER_FN_REF_MAP.set(topic, originalMethod);
    SUBSCRIBER_OBJ_REF_MAP.set(topic, target);
    return descriptor;
  };
}

export function SubscribeToFixedGroup(topic: string) {
  return (target: any, propertyKey: string, descriptor: PropertyDescriptor) => {
    const originalMethod = target[propertyKey] as Function;
    SUBSCRIBER_FIXED_FN_REF_MAP.set(topic, originalMethod);
    SUBSCRIBER_OBJ_REF_MAP.set(topic, target);
    return descriptor;
  };
}
