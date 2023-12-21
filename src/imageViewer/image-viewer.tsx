import React, { useRef, useEffect, useState } from 'react';
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
  overflow: auto;
  width: 80vw; // 80% of the viewport width
  height: 60vh; // 60% of the viewport height
  max-width: 600px; // Maximum width
  max-height: 400px; // Maximum height
  border: 1px solid #ccc;
  background: gray;
  display: flex;
`;

const StyledCanvas = styled.canvas`
  background-color: #fff;
  margin:auto;
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

const ImageViewer: React.FC = () => {
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const [scale, setScale] = useState(1);
    const [rotation, setRotation] = useState(0);
    const [image, setImage] = useState<HTMLImageElement | null>(null);
    const [flipH, setFlipH] = useState(1);
    const [flipV, setFlipV] = useState(1);
    const [brightness, setBrightness] = useState(100);
    const [saturation, setSaturation] = useState(100);
    const [contrast, setContrast] = useState(100);
    const [hue, setHue] = useState(0);

    const updateCanvasAndImageScale = (img: HTMLImageElement) => {
        const canvasContainer = canvasRef.current?.parentNode as HTMLElement;
        const scaleToFitX = canvasContainer.clientWidth / img.width;
        const scaleToFitY = canvasContainer.clientHeight / img.height;
        const newScale = Math.min(scaleToFitX, scaleToFitY, 1);
        setScale(newScale);
        setCanvasSize(img, newScale, rotation);
    };

    useEffect(() => {
        const img = new Image();
        img.onload = () => {
            setImage(img);
            updateCanvasAndImageScale(img);
        };
        img.src = 'https://i.etsystatic.com/30702667/r/il/57e8eb/4509784706/il_1588xN.4509784706_4lxd.jpg'; // Replace with your image path
    }, []);

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

    useEffect(() => {
        if (image) {
            drawImage();
        }
    }, [scale, rotation, image, flipH, flipV, brightness, saturation, contrast, hue]);

    return (
        <Container>
            <CanvasContainer>
                <StyledCanvas ref={canvasRef} />
            </CanvasContainer>
            <div>
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
        </Container>
    );
};

export default ImageViewer;
