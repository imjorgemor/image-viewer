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
`;

const StyledCanvas = styled.canvas`
  background-color: gray;
  border: 1px;
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

const CropRect = styled.div`
  border: 2px dashed black;
  position: absolute;
`;

const ImageViewer: React.FC = () => {
    const canvasRef = useRef<HTMLCanvasElement>(null);
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

    // Additional state for cropping
    const [isCropping, setIsCropping] = useState(false);
    const [cropStart, setCropStart] = useState({ x: 0, y: 0 });
    const [cropEnd, setCropEnd] = useState({ x: 0, y: 0 });
    const [showCropRect, setShowCropRect] = useState(false);

    console.log(canvasRef.current?.height)

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

    const startCrop = (event: React.MouseEvent) => {
        if (canvasRef.current) {
          const canvasRect = canvasRef.current.getBoundingClientRect();
        
          const x = (event.clientX - canvasRect.left + window.scrollX) / (canvasRect.width / canvasRef.current.width);
          const y = (event.clientY - canvasRect.top + window.scrollY) / (canvasRect.height / canvasRef.current.height);
      
          setCropStart({ x, y });
          setCropEnd({ x, y });
          setIsCropping(true);
          setShowCropRect(true);
        }
      };
      
      const updateCrop = (event: React.MouseEvent) => {
        if (isCropping && canvasRef.current) {
          const canvasRect = canvasRef.current.getBoundingClientRect();
          
          const x = (event.clientX - canvasRect.left + window.scrollX) / (canvasRect.width / canvasRef.current.width);
          const y = (event.clientY - canvasRect.top + window.scrollY) / (canvasRect.height / canvasRef.current.height);
      
          setCropEnd({ x, y });
        }
      };

    const endCrop = () => {
        setIsCropping(false);
    };

    const performCrop = () => {
        if (canvasRef.current && image) {
            const ctx = canvasRef.current.getContext('2d');
            if (ctx) {
                // Calculate the crop dimensions
                const cropWidth = cropEnd.x - cropStart.x;
                const cropHeight = cropEnd.y - cropStart.y;
                const croppedImage = ctx.getImageData(cropStart.x, cropStart.y, cropWidth, cropHeight);

                // Update canvas size to match the cropped area
                canvasRef.current.width = cropWidth;
                canvasRef.current.height = cropHeight;

                // Draw the cropped image
                ctx.putImageData(croppedImage, 0, 0);
                setShowCropRect(false); // Hide the crop rectangle
            }
        }
    };

    const getCropRectStyle = () => {
        const width = cropEnd.x - cropStart.x;
        const height = cropEnd.y - cropStart.y;
        return {
            left: `${cropStart.x}px`,
            top: `${cropStart.y}px`,
            width: `${width}px`,
            height: `${height}px`
        };
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

    useEffect(() => {
        if (image) {
            drawImage();
        }
    }, [scale, rotation, image, flipH, flipV, brightness, saturation, contrast, hue]);

    return (
        <Container>
            <div>
                <input type="file" accept="image/*" onChange={handleImageUpload} />
            </div>
            <CanvasContainer
                onMouseDown={startCrop}
                onMouseMove={updateCrop}
                onMouseUp={endCrop}
                onMouseLeave={endCrop}
            >
                
                    <StyledCanvas ref={canvasRef} />
                    {showCropRect && <CropRect style={getCropRectStyle()} />}

            </CanvasContainer>
            <div>
                <Button onClick={performCrop}>Crop</Button>
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
                </div>
            </div>
            <Button onClick={downloadImage}>Download Image</Button>
        </Container>
    );
};

export default ImageViewer;
