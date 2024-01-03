import React, { useRef,  useState } from 'react';
import styled from 'styled-components';

const Container = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  background-color: #f0f0f0;
  padding: 20px;
`;

const CanvasContainer = styled.div`
  overflow: hidden;
  position: relative;
  width: 80vw;
  height: 60vh;
  max-width: 600px;
  max-height: 400px;
  border: 1px solid #ccc;
`;

const StyledCanvas = styled.canvas`
  background-color: #fff;
`;

const CropRect = styled.div`
  border: 2px dashed black;
  position: absolute;
`;

const Button = styled.button`
  margin-top: 10px;
`;

const ImageViewer: React.FC = () => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [image, setImage] = useState<HTMLImageElement | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [cropStart, setCropStart] = useState({ x: 0, y: 0 });
  const [cropEnd, setCropEnd] = useState({ x: 0, y: 0 });
  const [showCropRect, setShowCropRect] = useState(false);

  const handleImageUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files ? event.target.files[0] : null;
    if (file && file.type.startsWith('image/')) {
      const reader = new FileReader();
      reader.onload = (e) => {
        const img = new Image();
        img.onload = () => {
          setImage(img);
          if (canvasRef.current) {
            canvasRef.current.width = img.width;
            canvasRef.current.height = img.height;
            const ctx = canvasRef.current.getContext('2d');
            ctx?.drawImage(img, 0, 0);
          }
        };
        img.src = e?.target?.result as string;
      };
      reader.readAsDataURL(file);
    }
  };

  const startCrop = (event: React.MouseEvent) => {
    if (canvasRef.current){
        const rect = canvasRef.current.getBoundingClientRect();
        setCropStart({
            x: event.clientX - rect.left,
            y: event.clientY - rect.top
        });
        setCropEnd({ x: 0, y: 0 }); // Reset crop end
        setIsDragging(true);
        setShowCropRect(true);
    }
  };

  const updateCrop = (event: React.MouseEvent) => {
    if (isDragging && canvasRef.current) {
      const rect = canvasRef.current.getBoundingClientRect();
      setCropEnd({
        x: event.clientX - rect.left,
        y: event.clientY - rect.top
      });
    }
  };

  const endCrop = () => {
    setIsDragging(false);
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

  return (
    <Container>
      <div>
        <input type="file" accept="image/*" onChange={handleImageUpload} />
        <Button onClick={performCrop}>Crop</Button>
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
    </Container>
  );
};

export default ImageViewer;
