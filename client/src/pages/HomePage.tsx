import Button from '@mui/material/Button';
import Container from '@mui/material/Container';
import Stack from '@mui/material/Stack';

import Logo from '../components/Logo';

function HomePage() {
  return (
    <Container maxWidth="sm">
      <Stack spacing={2} justifyContent="center" height="100vh">
        <Logo />
        <Button variant="outlined">Create room</Button>
        <Button>Join room</Button>
      </Stack>
    </Container>
  );
}

export default HomePage;
