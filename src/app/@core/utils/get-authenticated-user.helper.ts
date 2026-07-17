import { getStorageKey } from './get-storage-key.helper';
import { decodeToken } from './decode-token.helper';
import { AuthenticatedUser } from '../services/auth.service';

export const getAuthenticatedUser = (): AuthenticatedUser => {
  const token = localStorage.getItem(getStorageKey());
  return token ? (decodeToken(token) as any) : null;
};
