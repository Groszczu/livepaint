import { useSelector } from '@xstate/react';

import type { AuthService } from './AuthServiceProvider';
import { useAuthService } from './AuthServiceProvider';

function isLoggedInSelector(state: AuthService['state']) {
  return state.matches('loggedIn');
}

// eslint-disable-next-line import/prefer-default-export
export function useIsLoggedIn() {
  const authService = useAuthService();
  return useSelector(authService, isLoggedInSelector);
}
