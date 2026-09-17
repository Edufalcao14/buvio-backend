import { AppContext } from '../../libs/context';
import { requireActiveUser } from '../shared/authorization';

/**
 * Erases the caller's own account.
 *
 * There is no user id argument, deliberately: a player deletes themselves and
 * nobody else. Apple has required an in-app deletion path since 2022 for any
 * app that offers sign-up (App Store Guideline 5.1.1(v)), and GDPR Article 17
 * asks for the same thing.
 *
 * The account is **soft-deleted and anonymised**, not dropped, because the
 * votes cast about other players are part of their history: hard-deleting the
 * row would tear holes in every team's standings and every closed session's
 * ballot list. What must disappear is the person - name, nickname, email,
 * photograph and their place in the squad - and that is what this removes.
 *
 * The identity account goes for good: deleting it in the provider invalidates
 * every access and refresh token that was ever issued, so the deletion takes
 * effect on every device immediately rather than when the last token expires.
 */
export const deleteAccount = async (ctx: AppContext): Promise<boolean> => {
  const user = await requireActiveUser(ctx);
  const deletedAt = new Date();

  await ctx.repositories.user.update({
    ...user,
    // The address is released so the person can sign up again later, and so
    // that it stops identifying them in a row that still exists.
    email: `deleted-${user.id}@deleted.buvio`,
    displayName: 'Joueur supprimé',
    nickname: null,
    // Leaves the object in the bucket unreferenced, for the lifecycle rule to
    // collect; nothing in the app can resolve a URL for it any more.
    avatarKey: null,
    // Out of the squad: the roster, the standings and any open vote stop
    // showing them from this moment.
    teamId: null,
    deletedAt,
    updatedAt: deletedAt,
  });

  // Last, and outside the row update: if this throws, the account is already
  // anonymised and unusable, which is the safe direction to fail in. Doing it
  // first would leave a live row nobody could authenticate as.
  await ctx.gateways.iam.deleteUser(user.externalId);

  return true;
};
