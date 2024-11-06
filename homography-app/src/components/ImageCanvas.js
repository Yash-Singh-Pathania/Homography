// src/components/ImageCanvas.js
import React, { useEffect, useRef, useState } from 'react';
import { Box, Button } from '@mui/material';
import { FabricJSCanvas, useFabricJSEditor } from 'fabricjs-react';
import axios from 'axios';

function ImageCanvas({ image }) {
    const { editor, onReady } = useFabricJSEditor();
    const [points, setPoints] = useState([]);
    const [transformedImage, setTransformedImage] = useState(null);
    const canvasRef = useRef(null);

    const MAX_CANVAS_WIDTH = 800;
    const MAX_CANVAS_HEIGHT = 600;

    let scaleFactor = 1; // Declare scaleFactor here to use it in point conversion

    useEffect(() => {
        if (editor && image) {
            const img = new window.Image();
            img.src = image;
            img.onload = () => {
                // Calculate scale factor to fit the image within the max canvas size
                scaleFactor = Math.min(
                    MAX_CANVAS_WIDTH / img.width,
                    MAX_CANVAS_HEIGHT / img.height,
                    1 // Ensure we do not scale up if the image is smaller than the max size
                );

                const canvasWidth = img.width * scaleFactor;
                const canvasHeight = img.height * scaleFactor;

                editor.canvas.clear();
                editor.canvas.setWidth(canvasWidth);
                editor.canvas.setHeight(canvasHeight);

                editor.canvas.setBackgroundImage(
                    new window.fabric.Image(img, {
                        scaleX: scaleFactor,
                        scaleY: scaleFactor,
                        originX: 'center',
                        originY: 'center',
                        left: canvasWidth / 2,
                        top: canvasHeight / 2,
                    }),
                    editor.canvas.renderAll.bind(editor.canvas)
                );

                // Temporary array for points to avoid re-render on every click
                const tempPoints = [];

                editor.canvas.on('mouse:down', function (options) {
                    if (options.pointer && tempPoints.length < 4) {
                        const { x, y } = options.pointer;
                        const circle = new window.fabric.Circle({
                            radius: 5,
                            fill: 'red',
                            left: x,
                            top: y,
                            selectable: false,
                            originX: 'center',
                            originY: 'center',
                        });
                        editor.canvas.add(circle);

                        // Scale points to original image dimensions
                        const originalX = x / scaleFactor;
                        const originalY = y / scaleFactor;
                        tempPoints.push([originalX, originalY]);

                        if (tempPoints.length === 4) {
                            setPoints(tempPoints); // Set points after selecting four points
                        }
                    }
                });
            };
        }
    }, [editor, image]);

    const handleReset = () => {
        if (editor) {
            editor.canvas.clear();
            setPoints([]);
            setTransformedImage(null);
        }
    };

    const handleTransform = async () => {
        if (points.length !== 4) {
            alert('Please select exactly 4 points.');
            return;
        }

        try {
            const response = await fetch(image);
            const blob = await response.blob();
            const file = new File([blob], 'image.jpg', { type: 'image/jpeg' });
            const formData = new FormData();
            formData.append('file', file);
            formData.append('points', JSON.stringify(points));

            const res = await axios.post('http://localhost:8000/transform', formData);
            if (res.data.image) {
                const byteArray = Uint8Array.from(Buffer.from(res.data.image, 'hex'));
                const blob = new Blob([byteArray], { type: 'image/jpeg' });
                const url = URL.createObjectURL(blob);
                setTransformedImage(url);
            } else {
                alert('Transformation failed.');
            }
        } catch (error) {
            console.error(error);
            alert('An error occurred during transformation.');
        }
    };

    return (
        <Box mt={2} textAlign="center">
            <FabricJSCanvas
                ref={canvasRef}
                className="canvas"
                onReady={onReady}
                style={{
                    border: '1px solid #ddd',
                    marginTop: '20px',
                    width: `${MAX_CANVAS_WIDTH}px`,
                    height: `${MAX_CANVAS_HEIGHT}px`,
                    display: 'flex',
                    justifyContent: 'center',
                    alignItems: 'center',
                }}
            />
            <Box mt={2}>
                <Button
                    variant="contained"
                    color="primary"
                    onClick={handleTransform}
                    disabled={points.length !== 4}
                >
                    Transform Image
                </Button>
                <Button
                    variant="outlined"
                    color="secondary"
                    onClick={handleReset}
                    style={{ marginLeft: '10px' }}
                >
                    Reset
                </Button>
            </Box>
            {transformedImage && (
                <Box mt={2}>
                    <img src={transformedImage} alt="Transformed" style={{ width: '100%', marginTop: '10px' }} />
                </Box>
            )}
        </Box>
    );
}

export default ImageCanvas;
