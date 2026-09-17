import { AppContext } from '../../../libs/context';
import { UserEntity } from '../../../entities/user/user';
import { MeEntity } from '../../../entities/auth/me';
import { UploadTicketEntity } from '../../../entities/storage/upload-ticket';
import { Usecases } from '../../../usecases';
import {
  MutationConfirmAvatarUploadArgs,
  MutationCreateAvatarUploadUrlArgs,
  MutationCreateUserArgs,
  MutationResolvers,
  MutationUpdateProfileArgs,
  ResolverTypeWrapper,
} from '../../__generated__/resolvers-types';
import { AuthPayload } from '../../__generated__/resolvers-types';

export const initUserMutationResolvers = (
  usecases: Usecases,
): Pick<
  MutationResolvers,
  | 'createUser'
  | 'updateProfile'
  | 'createAvatarUploadUrl'
  | 'confirmAvatarUpload'
  | 'deleteAccount'
> => {
  return {
    createUser: async (
      _,
      args: MutationCreateUserArgs,
      context: AppContext,
    ): Promise<
      Omit<AuthPayload, 'user'> & { user: ResolverTypeWrapper<UserEntity> }
    > => {
      return await usecases.user.create(context, {
        email: args.email,
        displayName: args.displayName,
        nickname: args.nickname,
        password: args.password,
      });
    },
    updateProfile: async (
      _,
      args: MutationUpdateProfileArgs,
      context: AppContext,
    ): Promise<MeEntity> => {
      // Forwarded exactly as received, undefined included: the usecase reads an
      // absent field as "leave it alone" and null or "" as "clear it", so
      // defaulting either one here would erase the distinction.
      return await usecases.user.updateProfile(context, {
        nickname: args.nickname,
        displayName: args.displayName,
      });
    },
    deleteAccount: async (_, __, context: AppContext): Promise<boolean> => {
      return await usecases.user.deleteAccount(context);
    },
    createAvatarUploadUrl: async (
      _,
      args: MutationCreateAvatarUploadUrlArgs,
      context: AppContext,
    ): Promise<UploadTicketEntity> => {
      return await usecases.user.createAvatarUploadUrl(
        context,
        args.contentType,
      );
    },
    confirmAvatarUpload: async (
      _,
      args: MutationConfirmAvatarUploadArgs,
      context: AppContext,
    ): Promise<MeEntity> => {
      return await usecases.user.confirmAvatarUpload(context, args.key);
    },
  };
};
