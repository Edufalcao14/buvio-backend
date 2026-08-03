import { UserEntity } from '../../entities/user';
import { AppContext } from '../../libs/context';
import { requireTeamMember } from '../shared/authorization';

export const getTeamMembers = async (
  ctx: AppContext,
): Promise<UserEntity[]> => {
  const { teamId } = await requireTeamMember(ctx);

  return ctx.repositories.user.getUsersByTeamId(teamId);
};
