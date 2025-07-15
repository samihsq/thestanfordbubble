import React, { useState, useCallback, useRef } from "react";
import { useNavigate } from "react-router-dom";
import styled from "styled-components";
import BubbleAnimation, { ProductionBubble } from "./BubbleAnimation";

const Container = styled.div`
  height: 100vh;
  display: flex;
  align-items: center;
  justify-content: center;
  background: transparent;
  position: relative;
`;

const Title = styled.h1`
  text-align: center;
  font-size: clamp(1rem, 3vw, 1.8rem);
  color: #333;
  padding: 0 1rem;
  position: absolute;
  top: 50%;
  left: 50%;
  z-index: 0;
  pointer-events: none;
  filter: blur(0.5px);
  text-shadow: 0 0 5px rgba(255, 255, 255, 0.3);
  width: 240px;
  height: 280px;
  display: flex;
  align-items: center;
  justify-content: center;
  word-wrap: break-word;
  overflow-wrap: break-word;
  hyphens: auto;
  line-height: 1.2;
  margin: 0;

  &::before {
    content: "";
    position: absolute;
    top: -10%;
    left: -10%;
    width: 120%;
    height: 120%;
    background: radial-gradient(
      circle,
      rgba(255, 255, 255, 0.2) 0%,
      rgba(255, 255, 255, 0) 70%
    );
    opacity: 0.5;
    z-index: 1;
    pointer-events: none;
  }
`;

const LandingPage: React.FC = () => {
  const navigate = useNavigate();
  const [wobble, setWobble] = useState({ x: 0, y: 0 });
  const bubbleRef = useRef<ProductionBubble | null>(null);

  const handleWobbleUpdate = useCallback((wobbleX: number, wobbleY: number) => {
    setWobble({ x: wobbleX, y: wobbleY });
  }, []);

  const handleLiftComplete = useCallback(() => {
    navigate("/home");
  }, [navigate]);

  const handleClick = (event: React.MouseEvent<HTMLDivElement>) => {
    if (bubbleRef.current) {
      bubbleRef.current.startLift(handleLiftComplete);
    }
    // No setTimeout here anymore, navigation is handled by onLiftComplete
  };

  return (
    <Container>
      <BubbleAnimation
        onClick={handleClick}
        onWobbleUpdate={handleWobbleUpdate}
        bubbleRef={bubbleRef}
        onLiftComplete={handleLiftComplete} // Pass the new prop
      >
        <Title
          style={{
            transform: `translate(calc(-50% + ${
              wobble.x * 0.05
            }px), calc(-50% + ${wobble.y * 0.05}px))`,
          }}
        >
          welcome to the stanford bubble
        </Title>
      </BubbleAnimation>
    </Container>
  );
};

export default LandingPage;
