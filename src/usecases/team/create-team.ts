import { randomBytes } from 'crypto';
import { AppContext } from '../../libs/context';
import Joi from 'joi';
import { BadUserInputError } from '../../entities/errors/bad-user-input-error';
import { CreateTeamInput } from '../../entities/team/create-team-input';
import { TeamEntity } from '../../entities/team/team';
import { ConflictError } from '../../entities/errors/conflict-error';
import { UnknownError } from '../../entities/errors/unknown-error';
import { ErrorMessageCode } from '../../entities/errors/error-message-code';
import { requireActiveUser } from '../shared/authorization';
import { assertValid } from '../shared/validation';

const MAX_CODE_ATTEMPTS = 5;

const schema = Joi.object<CreateTeamInput>({
  name: Joi.string().trim().min(1).max(255).required(),
  sport: Joi.string().max(255).allow(null, '').optional(),
});

export const createTeam = async (
  ctx: AppContext,
  input: CreateTeamInput,
): Promise<TeamEntity> => {
  assertValid(schema, input);

  const creator = await requireActiveUser(ctx);

  if (creator.teamId) {
    throw new BadUserInputError(ErrorMessageCode.USER_ALREADY_IN_TEAM);
  }

  // The unique index on teams.code decides collisions, so a losing insert is
  // retried with a new code instead of being pre-checked with a SELECT.
  for (let attempt = 1; attempt <= MAX_CODE_ATTEMPTS; attempt++) {
    try {
      return await ctx.repositories.transaction
        .transaction()
        .execute(async (trx) => {
          const newTeam = await ctx.repositories.team.create(
            input.name,
            generateTeamCode(),
            creator.id,
            input.sport ? input.sport : null,
            trx,
          );

          await ctx.repositories.user.update(
            {
              ...creator,
              teamId: newTeam.id,
              updatedAt: new Date(),
            },
            trx,
          );

          return newTeam;
        });
    } catch (error) {
      if (error instanceof ConflictError && attempt < MAX_CODE_ATTEMPTS) {
        continue;
      }
      throw error;
    }
  }

  throw new UnknownError('team.generateUniqueCode');
};

/**
 * 5 characters from a 32-symbol alphabet, ambiguous glyphs removed.
 *
 * That is a small space for an invite code that never expires, so the lookup
 * endpoints (`validateTeamCode`, `teamByCode`, `joinTeam`) rely on the request
 * rate limiter to stay unguessable.
 */
function generateTeamCode(): string {
  const characters = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  const codeLength = 5;
  const bytes = randomBytes(codeLength);

  return Array.from(Array(codeLength))
    .map((_, i) => characters[bytes[i] % characters.length])
    .join('');
}
