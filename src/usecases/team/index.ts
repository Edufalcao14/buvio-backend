import { createTeam } from './create-team';
import { getTeamByCode } from './get-by-code';
import { validateCode } from './validate-code';
import { getTeamById } from './get-team-by-id';
import { getTeamOfUser } from './get-team-of-user';
import { getTeamMembers } from './get-team-members';
import { joinTeam } from './join-team';
import { getRanking } from './get-ranking';
import { createCrestUploadUrl } from './create-crest-upload-url';
import { confirmCrestUpload } from './confirm-crest-upload';

export const initTeamUsecases = () => {
  return {
    getByCode: getTeamByCode,
    validateCode: validateCode,
    create: createTeam,
    getById: getTeamById,
    getOfUser: getTeamOfUser,
    getMembers: getTeamMembers,
    join: joinTeam,
    getRanking: getRanking,
    createCrestUploadUrl: createCrestUploadUrl,
    confirmCrestUpload: confirmCrestUpload,
  };
};

export type TeamUsecases = ReturnType<typeof initTeamUsecases>;
