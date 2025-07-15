import React, { useRef, useCallback, useState } from "react";
import { useNavigate } from "react-router-dom";
import styled from "styled-components";
import BubbleAnimation, { ProductionBubble } from "./BubbleAnimation";

/* ---------- layout ---------- */
const Wrapper = styled.div`
  height: 100vh;
  display: flex;
  align-items: center;
  justify-content: center;
  background: transparent;
  position: relative;
`;

const CenterText = styled.h1`
  position: absolute;
  margin: 0;
  inset: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: clamp(1rem, 3vw, 1.8rem);
  color: #333;
  pointer-events: none; /* allow clicks to pass through */
  width: 240px;
  height: 280px;
  text-align: center;
  line-height: 1.2;
  filter: blur(0.5px);
  text-shadow: 0 0 5px rgba(255, 255, 255, 0.3);
`;

export default function LandingPage() {
  const navigate = useNavigate();
  const bubbleRef = useRef<ProductionBubble | null>(null);
  const [wobble, setWobble] = useState({ x: 0, y: 0 });

  /* ---------- callbacks ---------- */
  const onWobble = useCallback(
    (x: number, y: number) => setWobble({ x, y }),
    []
  );

  const goMain = useCallback(() => navigate("/mainpage"), [navigate]);

  const handleClick = () => {
    /* trigger 3-second lift, then route change */
    bubbleRef.current?.startLift(goMain);
  };

  /* ---------- render ---------- */
  return (
    <Wrapper>
      <BubbleAnimation
        onClick={handleClick}
        onWobbleUpdate={onWobble}
        bubbleRef={bubbleRef}
        onLiftComplete={goMain}
      >
        <CenterText
          style={{
            transform: `translate(calc(-50% + ${
              wobble.x * 0.05
            }px), calc(-50% + ${wobble.y * 0.05}px))`,
          }}
        >
          Welcome to theStanford&nbsp;Bubble
        </CenterText>
      </BubbleAnimation>
    </Wrapper>
  );
}
