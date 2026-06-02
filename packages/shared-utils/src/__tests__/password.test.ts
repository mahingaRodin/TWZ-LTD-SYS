import { hashPassword, verifyPassword } from '../password';

describe('password hashing', () => {
  it('hashes a password to something other than the plaintext', async () => {
    const hash = await hashPassword('Sup3rSecret!');
    expect(hash).not.toBe('Sup3rSecret!');
    expect(hash.length).toBeGreaterThan(20);
  });

  it('verifies a correct password', async () => {
    const hash = await hashPassword('Sup3rSecret!');
    await expect(verifyPassword('Sup3rSecret!', hash)).resolves.toBe(true);
  });

  it('rejects an incorrect password', async () => {
    const hash = await hashPassword('Sup3rSecret!');
    await expect(verifyPassword('wrong', hash)).resolves.toBe(false);
  });
});
