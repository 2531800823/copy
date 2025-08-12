import StoreManager from './store/storeManager';
import {EnumServiceKey} from './type';
import {WindowStateManager} from './WindowStateManager';

export const containerServices = {
  [EnumServiceKey.StoreManager]: StoreManager,
  [EnumServiceKey.WindowStateManager]: WindowStateManager,
}

export type ServiceMapping = typeof containerServices;

export type ServiceInstanceMapping = {
  [key in keyof ServiceMapping]: InstanceType<ServiceMapping[key]>;
};
