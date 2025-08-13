import { AutoUpdaterService } from './AutoUpdaterService';
import { ProtocolService } from './ProtocolService';
import StoreManager from './store/storeManager'
import TrayService from './TrayService'
import { EnumServiceKey } from './type';
import { WindowStateManager } from './WindowStateManager';

export const containerServices = {
  [EnumServiceKey.StoreManager]: StoreManager,
  [EnumServiceKey.WindowStateManager]: WindowStateManager,
  [EnumServiceKey.ProtocolService]: ProtocolService,
  [EnumServiceKey.AutoUpdaterService]: AutoUpdaterService,
  [EnumServiceKey.TrayService]: TrayService,
};

export type ServiceMapping = typeof containerServices

export type ServiceInstanceMapping = {
  [key in keyof ServiceMapping]: InstanceType<ServiceMapping[key]>;
}
