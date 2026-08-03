import { Config } from '../libs/config';
import { initIAMGateway } from './iam';
import { initStorageGateway } from './storage';

export const initGateways = (config: Config) => {
  return {
    iam: initIAMGateway(config),
    storage: initStorageGateway(config),
  };
};

export type Gateways = ReturnType<typeof initGateways>;
