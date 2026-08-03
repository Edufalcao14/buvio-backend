import { AppContext } from '../../libs/context';
import Joi from 'joi';
import { BadUserInputError } from '../../entities/errors/bad-user-input-error';
import { NotFoundError } from '../../entities/errors/not-found-error';
import { ErrorMessageCode } from '../../entities/errors/error-message-code';
import { TeamEntity } from '../../entities/team/team';
import { JoinTeamInputEntity } from '../../entities/team/join-team-input';
import { requireActiveUser } from '../shared/authorization';
import { assertValid } from '../shared/validation';

const schema = Joi.object<JoinTeamInputEntity>({
  code: Joi.string().alphanum().length(5).required(),
});

export const joinTeam = async (
  ctx: AppContext,
  input: JoinTeamInputEntity,
): Promise<TeamEntity> => {
  assertValid(schema, input);

  const joiner = await requireActiveUser(ctx);

  if (joiner.teamId) {
    throw new BadUserInputError(ErrorMessageCode.USER_ALREADY_IN_TEAM);
  }

  const team = await ctx.repositories.team.getByCode(input.code);

  if (!team) {
    throw new NotFoundError(ErrorMessageCode.TEAM_CODE_NOT_FOUND);
  }

  await ctx.repositories.user.update({
    ...joiner,
    teamId: team.id,
    updatedAt: new Date(),
  });

  return team;
};
