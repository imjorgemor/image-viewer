import React, { useRef, useEffect, useState } from 'react';
import styled from 'styled-components';

const Container = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  background-color: #f0f0f0;
`;

const CanvasContainer = styled.div`
  overflow: auto;
  width: 80vw; // 80% of the viewport width
  height: 60vh; // 60% of the viewport height
  max-width: 600px; // Maximum width
  max-height: 400px; // Maximum height
  border: 1px solid #ccc;
  background: gray;
  position: relative; // Needed for CropRect positioning
  display: flex;
`;

const StyledCanvas = styled.canvas`
  background-color: gray;
  border: 1px;
  margin: auto;
`;

const Button = styled.button`
  /* Your button styles here */
`;

const Slider = styled.input.attrs({ type: 'range', min: 0, max: 200, step: 1 })`
  width: 300px;
  margin: 10px;
`;

const HueSlider = styled.input.attrs({ type: 'range', min: -180, max: 180, step: 1 })`
  width: 300px;
  margin: 10px;
`;

const Thumbnail = styled.img`
    border: 1px solid #ccc;
    width: 100px; // Set thumbnail size
    height: 100px;
    object-fit: cover; // This ensures the image covers the thumbnail area
`;


const ImageViewer: React.FC = () => {
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const [thumbnailSrc, setThumbnailSrc] = useState('');

    const [imageFormat, setImageFormat] = useState('image/png'); // Default format
    const [scale, setScale] = useState(1);
    const [rotation, setRotation] = useState(0);
    const [image, setImage] = useState<HTMLImageElement | null>(null);
    const [flipH, setFlipH] = useState(1);
    const [flipV, setFlipV] = useState(1);
    const [brightness, setBrightness] = useState(100);
    const [saturation, setSaturation] = useState(100);
    const [contrast, setContrast] = useState(100);
    const [hue, setHue] = useState(0);

    const [isSelecting, setIsSelecting] = useState<boolean>(false);
    const [selectionRect, setSelectionRect] = useState<{ startX: number; startY: number; width: number; height: number }>({ startX: 0, startY: 0, width: 0, height: 0 });

    const startCrop = (e: React.MouseEvent<HTMLCanvasElement>) => {
        setIsSelecting(true);
        const rect = canvasRef.current!.getBoundingClientRect();
        const startX = e.clientX - rect.left;
        const startY = e.clientY - rect.top;
        setSelectionRect({ startX, startY, width: 0, height: 0 });
    };

    const continueCrop = (e: React.MouseEvent<HTMLCanvasElement>) => {
        if (!isSelecting) return;
        const rect = canvasRef.current!.getBoundingClientRect();
        const currentX = e.clientX - rect.left;
        const currentY = e.clientY - rect.top;
        const width = currentX - selectionRect.startX;
        const height = currentY - selectionRect.startY;
        setSelectionRect({ ...selectionRect, width, height });
        drawSelectionRect();
    };

    const endCrop = () => {
        if (!isSelecting) return;
        setIsSelecting(false);
        // rest of the endCrop implementation
    };

    const drawSelectionRect = () => {
        const canvas = canvasRef.current;
        if (!canvas) return;

        const ctx = canvas.getContext('2d');
        if (!ctx) return;

        // Redraw the image first to clear any previous selection rectangle
        drawImage();

        // Draw the selection rectangle
        ctx.strokeStyle = 'rgba(0, 120, 215, 0.7)'; // Blue color for the rectangle
        ctx.lineWidth = 1;
        ctx.strokeRect(selectionRect.startX, selectionRect.startY, selectionRect.width, selectionRect.height);
    };

    const cropImage = () => {
        const canvas = canvasRef.current;
        if (!canvas || !image) return;
    
        const ctx = canvas.getContext('2d');
        if (!ctx) return;
    
        // Calculate the actual crop dimensions based on the scale
        const scaleX = image.width / canvas.width;
        const scaleY = image.height / canvas.height;
        const cropX = selectionRect.startX * scaleX;
        const cropY = selectionRect.startY * scaleY;
        const cropWidth = selectionRect.width * scaleX;
        const cropHeight = selectionRect.height * scaleY;
    
        // Create a new image with the cropped area
        const croppedImg = document.createElement('canvas');
        croppedImg.width = cropWidth;
        croppedImg.height = cropHeight;
        const croppedCtx = croppedImg.getContext('2d');
        if (!croppedCtx) return;
    
        croppedCtx.drawImage(image, cropX, cropY, cropWidth, cropHeight, 0, 0, cropWidth, cropHeight);
    
        // Update the main canvas with the cropped image
        canvas.width = cropWidth;
        canvas.height = cropHeight;
        ctx.drawImage(croppedImg, 0, 0, cropWidth, cropHeight);
    
        // Update the image state to the cropped image
        const newImage = new Image();
        newImage.src = canvas.toDataURL();
        setImage(newImage);
    
        // Reset cropping states
        setIsSelecting(false);
        setSelectionRect({ startX: 0, startY: 0, width: 0, height: 0 });
    };







    const handleImageUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
        const file = event.target.files ? event.target.files[0] : null;
        if (file && file.type.startsWith('image/')) {
            setImageFormat(file.type);
            const reader = new FileReader();
            reader.onload = (e) => {
                const img = new Image();
                img.onload = () => {
                    setImage(img);
                    updateCanvasAndImageScale(img);
                };
                img.src = e.target?.result as string;
            };
            reader.readAsDataURL(file);
        }
    };

    const updateCanvasAndImageScale = (img: HTMLImageElement) => {
        const canvasContainer = canvasRef.current?.parentNode as HTMLElement;
        const scaleToFitX = canvasContainer.clientWidth / img.width;
        const scaleToFitY = canvasContainer.clientHeight / img.height;
        const newScale = Math.min(scaleToFitX, scaleToFitY, 1);
        setScale(newScale);
        setCanvasSize(img, newScale, rotation);
    };

    const setCanvasSize = (img: HTMLImageElement, scale: number, rotation: number) => {
        const canvas = canvasRef.current;
        if (canvas) {
            const isRotated = rotation === 90 || rotation === 270;
            canvas.width = isRotated ? img.height * scale : img.width * scale;
            canvas.height = isRotated ? img.width * scale : img.height * scale;
            drawImage();
        }
    };

    const drawImage = () => {
        const canvas = canvasRef.current;
        if (canvas && image) {
            const ctx = canvas.getContext('2d');
            if (ctx) {
                ctx.clearRect(0, 0, canvas.width, canvas.height);
                ctx.save();
                ctx.filter = `brightness(${brightness}%) saturate(${saturation}%) contrast(${contrast}%) hue-rotate(${hue}deg)`;
                ctx.translate(canvas.width / 2, canvas.height / 2);
                ctx.scale(flipH * scale, flipV * scale);
                ctx.rotate(rotation * Math.PI / 180);
                ctx.drawImage(image, -image.width / 2, -image.height / 2);
                ctx.restore();

            }
        }
    };


    const zoomIn = () => {
        const newScale = scale * 1.1;
        setScale(newScale);
        if (image) {
            setCanvasSize(image, newScale, rotation);
        }
    };

    const zoomOut = () => {
        const newScale = scale / 1.1;
        setScale(newScale);
        if (image) {
            setCanvasSize(image, newScale, rotation);
        }
    };

    const rotate = () => {
        const newRotation = (rotation + 90) % 360;
        setRotation(newRotation);
        if (image) {
            setCanvasSize(image, scale, newRotation);
        }
    };

    const flipHorizontal = () => {
        setFlipH(flipH * -1);
    };

    const flipVertical = () => {
        setFlipV(flipV * -1);
    };

    const downloadImage = () => {
        const canvas = canvasRef.current;
        if (canvas) {
            // Use the stored image format for the data URL
            const imageURL = canvas.toDataURL(imageFormat);

            const downloadLink = document.createElement("a");
            downloadLink.download = "edited-image"; // You can add a default name

            // Append the file extension based on the format
            downloadLink.download += imageFormat === 'image/jpeg' ? '.jpg' : '.png';

            downloadLink.href = imageURL;
            document.body.appendChild(downloadLink);
            downloadLink.click();
            document.body.removeChild(downloadLink);
        }
    };

    const updateThumbnail = () => {
        const canvas = canvasRef.current;
        if (canvas) {
            // Get the data URL of the canvas and set it as the thumbnail source
            setThumbnailSrc(canvas.toDataURL());
        }
    };

    useEffect(() => {
        if (image) {
            drawImage();
            updateThumbnail();
        }
    }, [scale, rotation, image, flipH, flipV, brightness, saturation, contrast, hue]);

    return (
        <Container>
            <div>
                <input type="file" accept="image/*" onChange={handleImageUpload} />
            </div>
            <CanvasContainer

            >

                <StyledCanvas ref={canvasRef} onMouseDown={startCrop} onMouseMove={continueCrop} onMouseUp={endCrop} />


            </CanvasContainer>
            <div>
                <Button onClick={cropImage}>Crop Image</Button>

                <Button onClick={zoomIn}>Zoom In</Button>
                <Button onClick={zoomOut}>Zoom Out</Button>
                <Button onClick={rotate}>Rotate</Button>
                <Button onClick={flipHorizontal}>Flip Horizontal</Button>
                <Button onClick={flipVertical}>Flip Vertical</Button>
                <div>
                    <label>
                        Brightness:
                        <Slider value={brightness} onChange={(e) => setBrightness(parseInt(e.target.value, 10))} />
                    </label>
                    <label>
                        Saturation:
                        <Slider value={saturation} onChange={(e) => setSaturation(parseInt(e.target.value, 10))} />
                    </label>
                    <label>
                        Contrast:
                        <Slider value={contrast} onChange={(e) => setContrast(parseInt(e.target.value, 10))} />
                    </label>
                    <label>
                        Hue:
                        <HueSlider value={hue} onChange={(e) => setHue(parseInt(e.target.value, 10))} />
                    </label>
                    <Thumbnail src={thumbnailSrc} />

                </div>
            </div>
            <Button onClick={downloadImage}>Download Image</Button>
        </Container>
    );
};

export default ImageViewer;
