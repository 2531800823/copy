import StoreManager from './store/storeManager';


export enum EnumServiceKey {
  StoreManager = 'StoreManager',
}

export const containerServices = {
  [EnumServiceKey.StoreManager]: StoreManager,
};

export type ServiceMapping = typeof containerServices;

export type ServiceInstanceMapping = {
  [key in keyof ServiceMapping]: InstanceType<ServiceMapping[key]>;
};
