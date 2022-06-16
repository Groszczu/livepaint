import { CircularProgress } from '@mui/material';
import { useInterpret, useSelector } from '@xstate/react';
import type { PropsWithChildren, ReactNode } from 'react';
import { useMemo, createContext, useContext } from 'react';
import { useNavigate } from 'react-router-dom';
import type { InterpreterFrom } from 'xstate';

import ContextUsedOutsideProviderError from '../utils/errors/ContextUsedOutsideProviderError';
import authMachine from './authMachine';

export type AuthService = InterpreterFrom<typeof authMachine>;

const AuthServiceContext = createContext<AuthService | undefined>(undefined);

export interface AuthServiceProviderProps {
  loader?: ReactNode;
}

function AuthServiceProvider({
  children,
  loader = <CircularProgress />,
}: PropsWithChildren<AuthServiceProviderProps>) {
  const navigate = useNavigate();
  const machine = useMemo(
    () =>
      authMachine.withConfig({
        actions: { navigateToHome: () => navigate('/', { replace: true }) },
      }),
    [navigate]
  );
  const authService = useInterpret(machine);
  const isGettingClient = useSelector(authService, isGettingClientSelector);

  if (isGettingClient) {
    return <>{loader}</>;
  }

  return (
    <AuthServiceContext.Provider value={authService}>
      {children}
    </AuthServiceContext.Provider>
  );
}

function isGettingClientSelector(state: AuthService['state']) {
  return state.matches('gettingClient');
}

export function useAuthService() {
  const authService = useContext(AuthServiceContext);

  if (authService === undefined) {
    throw new ContextUsedOutsideProviderError(
      'AuthServiceProvider',
      'useAuthService'
    );
  }
  return authService;
}

export default AuthServiceProvider;
