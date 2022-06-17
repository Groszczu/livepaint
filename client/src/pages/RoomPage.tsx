import { Typography } from '@mui/material';
import Container from '@mui/material/Container';
import { useParams } from 'react-router-dom';

function RoomPage() {
  const { roomId } = useParams();
  return (
    <Container maxWidth="sm">
      <Typography variant="h1">{roomId}</Typography>
    </Container>
  );
}

export default RoomPage;
