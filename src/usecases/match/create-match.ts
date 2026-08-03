import { AppContext } from '../../libs/context';
import Joi from 'joi';
import { CreateMatchInput } from '../../entities/match/create-match-input';
import { MatchEntity } from '../../entities/match/match';
import { MatchType } from '../../entities/match/match-type';
import { requireTeamMember } from '../shared/authorization';
import { assertValid } from '../shared/validation';

const schema = Joi.object<CreateMatchInput>({
  name: Joi.string().trim().min(1).max(255).required(),
  date: Joi.date()
    .min(new Date().setHours(0, 0, 0, 0))
    .required(),
  type: Joi.string()
    .valid(MatchType.AMICAL, MatchType.TOURNOI, MatchType.CHAMPIONNAT)
    .required(),
});

export const createMatch = async (
  ctx: AppContext,
  input: CreateMatchInput,
): Promise<MatchEntity> => {
  assertValid(schema, input);

  const { user: creator, teamId } = await requireTeamMember(ctx);

  return ctx.repositories.transaction.transaction().execute(async (trx) => {
    const newMatch = await ctx.repositories.match.create(
      input.name,
      input.date,
      input.type,
      creator.id,
      teamId,
      trx,
    );

    const players = await ctx.repositories.user.getUsersByTeamId(teamId);

    // Awaited inside the transaction: fire-and-forget inserts would commit the
    // match and then add players on a separate connection, or not at all.
    await Promise.all(
      players.map((player) =>
        ctx.repositories.match.addPlayer(player.id, newMatch.id, trx),
      ),
    );

    return newMatch;
  });
};
