import { confirmAvatarUpload } from './confirm-avatar-upload';
import { createAvatarUploadUrl } from './create-avatar-upload-url';
import { createUser } from './create-user';
import { getUserById } from './get-user-by-id';
import { isEmailTaken } from './is-email-taken';
import { updateProfile } from './update-profile';

export const initUserUsecases = () => {
  return {
    create: createUser,
    isEmailTaken: isEmailTaken,
    getById: getUserById,
    updateProfile: updateProfile,
    createAvatarUploadUrl: createAvatarUploadUrl,
    confirmAvatarUpload: confirmAvatarUpload,
  };
};

export type UserUsecases = ReturnType<typeof initUserUsecases>;
