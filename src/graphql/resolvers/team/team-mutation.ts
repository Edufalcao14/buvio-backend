import { AppContext } from '../../../libs/context';
import { Usecases } from '../../../usecases';
import {
  MutationConfirmTeamCrestUploadArgs,
  MutationCreateTeamArgs,
  MutationCreateTeamCrestUploadUrlArgs,
  MutationJoinTeamArgs,
  MutationResolvers,
} from '../../__generated__/resolvers-types';
import { TeamEntity } from '../../../entities/team/team';
import { UploadTicketEntity } from '../../../entities/storage/upload-ticket';

export const initTeamMutationResolvers = (
  usecases: Usecases,
): Pick<
  MutationResolvers,
  | 'createTeam'
  | 'joinTeam'
  | 'createTeamCrestUploadUrl'
  | 'confirmTeamCrestUpload'
> => {
  return {
    createTeam: async (
      _,
      args: MutationCreateTeamArgs,
      context: AppContext,
    ): Promise<TeamEntity> => {
      return await usecases.team.create(context, {
        name: args.name,
        sport: args.sport,
      });
    },
    joinTeam: async (
      _,
      args: MutationJoinTeamArgs,
      context: AppContext,
    ): Promise<TeamEntity> => {
      return await usecases.team.join(context, {
        code: args.code,
      });
    },
    // No team argument on either of these: the crest a caller may touch is the
    // one on their own team, so taking an id would only invite passing another
    // team's.
    createTeamCrestUploadUrl: async (
      _,
      args: MutationCreateTeamCrestUploadUrlArgs,
      context: AppContext,
    ): Promise<UploadTicketEntity> => {
      return await usecases.team.createCrestUploadUrl(
        context,
        args.contentType,
      );
    },
    confirmTeamCrestUpload: async (
      _,
      args: MutationConfirmTeamCrestUploadArgs,
      context: AppContext,
    ): Promise<TeamEntity> => {
      return await usecases.team.confirmCrestUpload(context, args.key);
    },
  };
};
