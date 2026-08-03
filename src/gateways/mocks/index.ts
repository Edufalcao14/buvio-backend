import { Gateways } from '..';
import { initIAMGatewayMock } from './iam';
import { initStorageGatewayMock } from './storage';

export const initGatewaysMock = (): Gateways => {
  return {
    iam: initIAMGatewayMock(),
    storage: initStorageGatewayMock(),
  };
};
