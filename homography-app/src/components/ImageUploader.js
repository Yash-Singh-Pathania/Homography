// src/components/ImageUploader.js
import React, { useState } from 'react';
import { Button, Box, Typography } from '@mui/material';
import ImageCanvas from './ImageCanvas';

function ImageUploader() {
    const [selectedImage, setSelectedImage] = useState(null);

    const handleImageChange = (event) => {
        if (event.target.files && event.target.files[0]) {
            const file = event.target.files[0];
            const imageUrl = URL.createObjectURL(file);
            setSelectedImage(imageUrl);
        }
    };

    return (
        <Box textAlign="center">
            <input
                accept="image/*"
                style={{ display: 'none' }}
                id="image-upload-input"
                type="file"
                onChange={handleImageChange}
            />
            <label htmlFor="image-upload-input">
                <Button variant="contained" color="primary" component="span">
                    Upload Image
                </Button>
            </label>

            {selectedImage ? (
                <ImageCanvas image={selectedImage} />
            ) : (
                <Typography variant="body1" color="textSecondary" mt={2}>
                    Please upload an image to start.
                </Typography>
            )}
        </Box>
    );
}

export default ImageUploader;
