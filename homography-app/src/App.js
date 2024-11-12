// App.js
import React, { useState } from 'react';
import { Container, Typography, Box, CssBaseline, IconButton, useMediaQuery } from '@mui/material';
import { ThemeProvider, createTheme } from '@mui/material/styles';
import ImageUploader from './components/ImageUploader';
import InfoIcon from '@mui/icons-material/Info';
import HomographyInfoModal from './components/HomographyInfoModal';
import { Brightness4, Brightness7 } from '@mui/icons-material';

function App() {
  const [themeMode, setThemeMode] = useState('light');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const prefersDarkMode = useMediaQuery('(prefers-color-scheme: dark)');

  const theme = createTheme({
    palette: {
      mode: themeMode,
    },
  });

  const toggleTheme = () => {
    setThemeMode((prevMode) => (prevMode === 'light' ? 'dark' : 'light'));
  };

  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <Container maxWidth="md">
        <Box display="flex" justifyContent="center" alignItems="center" my={4}>
          <Typography variant="h4" align="center" gutterBottom>
            Homography Transformation App
          </Typography>
          <IconButton onClick={() => setIsModalOpen(true)} color="inherit" style={{ marginLeft: 10 }}>
            <InfoIcon />
          </IconButton>
          <IconButton onClick={toggleTheme} color="inherit" style={{ marginLeft: 10 }}>
            {themeMode === 'dark' ? <Brightness7 /> : <Brightness4 />}
          </IconButton>
        </Box>
        <Typography variant="body1" align="center" gutterBottom>
          Upload or select an image, select exactly 4 points to define a quadrilateral, and see the perspective transformation!
        </Typography>
        <ImageUploader />
        <HomographyInfoModal open={isModalOpen} onClose={() => setIsModalOpen(false)} />
      </Container>
    </ThemeProvider>
  );
}

export default App;
