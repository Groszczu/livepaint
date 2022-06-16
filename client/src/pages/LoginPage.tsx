import { TextField } from '@mui/material';
import Button from '@mui/material/Button';
import Container from '@mui/material/Container';
import Stack from '@mui/material/Stack';
import type { FormEventHandler } from 'react';

import { useAuthService } from '../auth/AuthServiceProvider';
import Logo from '../components/Logo';

function LoginPage() {
  const authService = useAuthService();
  const handleSubmit: FormEventHandler<HTMLFormElement> = (e) => {
    e.preventDefault();
    const usernameInputElement = e.currentTarget
      .elements[0] as HTMLInputElement;
    authService.send('REGISTER', { username: usernameInputElement.value });
  };
  return (
    <Container maxWidth="sm">
      <form onSubmit={handleSubmit}>
        <Stack spacing={2} justifyContent="center" height="100vh">
          <Logo />
          <TextField label="Username" />
          <Button type="submit">Submit</Button>
        </Stack>
      </form>
    </Container>
  );
}

export default LoginPage;
