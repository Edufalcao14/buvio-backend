import { AppContext } from '../../libs/context';
import { MeEntity, toMeEntity } from '../../entities/auth/me';
import { requireActiveUser } from '../shared/authorization';

export const getMe = async (ctx: AppContext): Promise<MeEntity> => {
  const user = await requireActiveUser(ctx);

  return toMeEntity(user);
};
