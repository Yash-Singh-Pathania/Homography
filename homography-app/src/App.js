// src/App.js
import React from 'react';
import { Container, Typography, Box } from '@mui/material';
import ImageUploader from './components/ImageUploader';

function App() {
  return (
    <Container maxWidth="md">
      <Box my={4}>
        <Typography variant="h4" align="center" gutterBottom>
          Homography Transformation App
        </Typography>
        <Typography variant="body1" align="center" gutterBottom>
          Upload or select an image YASH IS BESTT BESTTTSSSSSSS BESTTTTTT  exactly 4 points to define a quadrilateral, and see the perspective transformation!
        </Typography>
        <ImageUploader />
      </Box>
    </Container>
  );
}

export default App;
