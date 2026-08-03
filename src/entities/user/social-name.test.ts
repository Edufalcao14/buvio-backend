import { socialNameOf } from './social-name';

describe('socialNameOf', () => {
  it('calls a player by the nickname they chose', () => {
    expect(
      socialNameOf({ displayName: 'Jean-Baptiste Moreau', nickname: 'JB' }),
    ).toBe('JB');
  });

  it('falls back to the first word of the display name', () => {
    expect(
      socialNameOf({ displayName: 'Jean-Baptiste Moreau', nickname: null }),
    ).toBe('Jean-Baptiste');
  });

  it('keeps a single-word display name whole', () => {
    expect(socialNameOf({ displayName: 'Ronaldinho', nickname: null })).toBe(
      'Ronaldinho',
    );
  });

  // A nickname of spaces is not a name the squad can call anyone, so it is
  // treated exactly like an unset one rather than rendering as a blank label.
  it('ignores a nickname that is only whitespace', () => {
    expect(socialNameOf({ displayName: 'Sofia Ricci', nickname: '   ' })).toBe(
      'Sofia',
    );
  });

  it('trims a padded nickname rather than showing the padding', () => {
    expect(
      socialNameOf({ displayName: 'Sofia Ricci', nickname: '  Sof  ' }),
    ).toBe('Sof');
  });

  it('survives a display name padded with whitespace', () => {
    expect(
      socialNameOf({ displayName: '  Marco  Rossi  ', nickname: null }),
    ).toBe('Marco');
  });
});
