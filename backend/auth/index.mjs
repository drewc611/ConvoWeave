import { createDevelopmentTokenVerifier } from './developmentToken.mjs';
import { createOidcAuthVerifier } from './oidc.mjs';

export function createAuthVerifier(config, options = {}) {
  switch (config.authMode) {
    case 'development-token':
      return createDevelopmentTokenVerifier(config);
    case 'oidc':
      return createOidcAuthVerifier(config, options);
    default:
      throw new Error(`No auth verifier configured for ${config.authMode}`);
  }
}
