import { AppContext } from '../../libs/context';
import {
  PlayerStandingEntity,
  buildRanking,
} from '../../entities/team/player-standing';
import { requireTeamMember } from '../shared/authorization';

/**
 * The team's standings table, built from every closed voting session.
 */
export const getRanking = async (
  ctx: AppContext,
): Promise<PlayerStandingEntity[]> => {
  const { teamId } = await requireTeamMember(ctx);

  const [members, tallies] = await Promise.all([
    ctx.repositories.user.getUsersByTeamId(teamId),
    ctx.repositories.vote.tallyClosedByTeamId(teamId, new Date()),
  ]);

  return buildRanking(
    members.map((member) => member.id),
    tallies,
  );
};
