import React, { useRef, useEffect, useState } from "react";
import { Noise } from "noisejs";
import styled from "styled-components";
import bubbleImage from "../images/bubble.png";

interface BubbleAnimationProps {
  onClick: () => void;
  onWobbleUpdate: (wobbleX: number, wobbleY: number) => void;
  children: React.ReactNode;
}

const CanvasContainer = styled.div`
  position: relative;
  width: 100%;
  height: 100%;
  cursor: pointer;
`;

const BubbleAnimation: React.FC<BubbleAnimationProps> = ({
  onClick,
  onWobbleUpdate,
  children,
}) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const noiseRef = useRef(new Noise(Math.random()));
  const [imageLoaded, setImageLoaded] = useState(false);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const resizeCanvas = () => {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
    };

    resizeCanvas();
    window.addEventListener("resize", resizeCanvas);

    let centerX = canvas.width / 2;
    let centerY = canvas.height / 2;
    let time = 0;
    const radius = 160;
    let prevX = centerX;
    let prevY = centerY;

    const img = new Image();
    img.src = bubbleImage;
    img.onload = () => setImageLoaded(true);

    let lastUpdate = 0;
    const updateInterval = 100; // Throttle to every 100ms

    const animate = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);

      const wobbleX = noiseRef.current.simplex2(time * 0.002, 0) * 8;
      const wobbleY = noiseRef.current.simplex2(0, time * 0.002) * 8;
      const x = centerX + wobbleX;
      const y = centerY + wobbleY;

      // Calculate movement direction and velocity
      const deltaX = x - prevX;
      const deltaY = y - prevY;
      const velocity = Math.sqrt(deltaX * deltaX + deltaY * deltaY);
      const directionX = deltaX / (velocity + 0.1); // Avoid division by zero
      const directionY = deltaY / (velocity + 0.1);

      if (Date.now() - lastUpdate > updateInterval) {
        onWobbleUpdate(wobbleX, wobbleY);
        lastUpdate = Date.now();
      }

      const distort = noiseRef.current.simplex2(time * 0.004, 0) * 10;

      ctx.save();
      ctx.translate(x, y);

      // Apply directional distortion based on movement
      const directionalStretch = Math.min(velocity * 0.5, 15); // Limit maximum stretch
      const scaleX = 1 + distort * 0.01 + directionalStretch * directionX * 0.1;
      const scaleY =
        1 - distort * 0.005 + directionalStretch * directionY * 0.1;
      ctx.scale(scaleX, scaleY);

      ctx.globalAlpha = 0.8;
      if (imageLoaded) {
        ctx.drawImage(img, -radius, -radius, radius * 2, radius * 2);
      } else {
        ctx.beginPath();
        ctx.arc(0, 0, radius, 0, Math.PI * 2);
        ctx.fillStyle = "rgba(227, 242, 253, 0.8)";
        ctx.fill();
      }

      ctx.globalAlpha = 0.3;
      ctx.fillStyle = "rgba(255, 255, 255, 0.8)";
      ctx.beginPath();
      ctx.ellipse(
        -radius * 0.3,
        -radius * 0.3,
        radius * 0.2,
        radius * 0.1,
        0,
        0,
        Math.PI * 2
      );
      ctx.fill();

      ctx.restore();

      ctx.shadowColor = "rgba(255, 255, 255, 0.4)";
      ctx.shadowBlur = 25 + Math.abs(distort) * 0.5;

      ctx.globalAlpha = 0.1;
      ctx.fillStyle = "rgba(255, 255, 255, 0.6)";
      ctx.beginPath();
      ctx.arc(x, y, radius + 10, 0, Math.PI * 2);
      ctx.fill();
      ctx.globalAlpha = 1;

      // Update previous position for next frame
      prevX = x;
      prevY = y;

      centerX = canvas.width / 2;
      centerY = canvas.height / 2;

      time++;
      requestAnimationFrame(animate);
    };

    animate();

    return () => {
      window.removeEventListener("resize", resizeCanvas);
    };
  }, [imageLoaded]);

  return (
    <CanvasContainer onClick={onClick}>
      <canvas
        ref={canvasRef}
        style={{
          position: "absolute",
          top: 0,
          left: 0,
          width: "100%",
          height: "100%",
          zIndex: 1,
        }}
      />
      {children}
    </CanvasContainer>
  );
};

export default BubbleAnimation;
