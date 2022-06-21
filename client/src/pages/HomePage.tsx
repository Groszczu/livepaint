import { Divider, TextField } from '@mui/material';
import Button from '@mui/material/Button';
import Container from '@mui/material/Container';
import Stack from '@mui/material/Stack';
import { useActor, useSelector } from '@xstate/react';
import { useState } from 'react';

import type { AuthService } from '../auth/AuthServiceProvider';
import { useAuthService } from '../auth/AuthServiceProvider';
import Logo from '../components/Logo';

function roomSelector(state: AuthService['state']) {
  if (!state.context.roomRef) {
    throw new Error('Unexpected null room actor ref');
  }
  return state.context.roomRef;
}

function HomePage() {
  const authService = useAuthService();
  const roomRef = useSelector(authService, roomSelector);
  const [state, send] = useActor(roomRef);
  const [roomId, setRoomId] = useState('');

  return (
    <Container maxWidth="sm">
      <Stack spacing={5} justifyContent="center" height="100vh">
        <Logo />
        <Stack direction="row">
          <TextField
            value={roomId}
            onChange={(e) => setRoomId(e.target.value)}
            label="Room ID"
            error={Boolean(state.context.error)}
            helperText={state.context.error}
            fullWidth
          />
          <Button
            onClick={() => send({ type: 'JOIN_ROOM', roomId })}
            disabled={roomId === ''}
            variant="outlined"
            size="large"
            sx={{ width: '33%', height: 56 }}
          >
            Join room
          </Button>
        </Stack>
        <span>
          <Divider>OR</Divider>
        </span>
        <Button
          variant="outlined"
          onClick={() => send('CREATE_ROOM')}
          size="large"
          sx={{ height: 56 }}
        >
          Create room
        </Button>
      </Stack>
    </Container>
  );
}

export default HomePage;
