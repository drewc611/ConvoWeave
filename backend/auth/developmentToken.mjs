import { timingSafeEqual } from 'node:crypto';

function safeTokenEqual(actual, expected) {
  if (!actual || !expected) return false;
  const left = Buffer.from(actual);
  const right = Buffer.from(expected);
  if (left.length !== right.length) return false;
  return timingSafeEqual(left, right);
}

export function createDevelopmentTokenVerifier(config) {
  if (!config.devToken) throw new Error('Development-token verifier requires CONVOWEAVE_DEV_TOKEN.');

  return {
    name: 'development-token',
    async ready() { return true; },
    async verify(token) {
      if (!safeTokenEqual(token, config.devToken)) return null;
      return {
        subject: 'development-user',
        issuer: 'convoweave-development',
        authMode: 'development-token',
      };
    },
  };
}
