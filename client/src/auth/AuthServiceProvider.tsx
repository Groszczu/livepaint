import { useInterpret, useSelector } from '@xstate/react';
import type { PropsWithChildren, ReactNode } from 'react';
import { useState, createContext, useContext } from 'react';
import { useNavigate } from 'react-router-dom';
import type { InterpreterFrom } from 'xstate';

import FullPageLoader from '../components/FullPageLoader';
import ContextUsedOutsideProviderError from '../utils/errors/ContextUsedOutsideProviderError';
import type { AuthMachine } from './authMachine';
import createAuthMachine from './authMachine';

export type AuthService = InterpreterFrom<AuthMachine>;

const AuthServiceContext = createContext<AuthService | undefined>(undefined);

export interface AuthServiceProviderProps {
  loader?: ReactNode;
}

function AuthServiceProvider({
  children,
  loader = <FullPageLoader />,
}: PropsWithChildren<AuthServiceProviderProps>) {
  const navigate = useNavigate();
  const [machine] = useState(() => createAuthMachine(navigate));
  const authService = useInterpret(machine, { devTools: import.meta.env.DEV });
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
