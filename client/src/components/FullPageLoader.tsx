import { Box, CircularProgress } from '@mui/material';

function FullPageLoader() {
  return (
    <Box
      width="100vw"
      height="100vh"
      display="flex"
      justifyContent="center"
      alignItems="center"
    >
      <CircularProgress size="100px" />
    </Box>
  );
}

export default FullPageLoader;
