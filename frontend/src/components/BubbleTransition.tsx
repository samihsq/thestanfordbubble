import React, { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import styled from "styled-components";
import { motion } from "framer-motion";

const Container = styled.div`
  position: relative;
  overflow: hidden;
  height: 100vh;
  background: transparent;
  display: flex;
  align-items: center;
  justify-content: center;
`;

const SmallBubble = styled(motion.div)<{ left: number; size: number }>`
  position: absolute;
  bottom: -150px;
  left: ${(props) => props.left}%;
  width: ${(props) => props.size}px;
  height: ${(props) => props.size}px;
  border-radius: 50%;
  background: radial-gradient(
    circle at 30% 30%,
    rgba(255, 255, 255, 0.9) 0%,
    rgba(252, 228, 236, 0.8) 40%,
    rgba(227, 242, 253, 0.8) 100%
  );
`;

const MainBubble = styled(motion.div)`
  width: 320px;
  height: 320px;
  border-radius: 50%;
  background: radial-gradient(
    circle at 30% 30%,
    rgba(255, 255, 255, 0.8) 0%,
    rgba(252, 228, 236, 0.8) 40%,
    rgba(227, 242, 253, 0.8) 100%
  );
  display: flex;
  align-items: center;
  justify-content: center;
`;

const Title = styled.h1`
  text-align: center;
  font-size: 1.8rem;
  color: #333;
  padding: 0 1rem;
`;

const bubbles = Array.from({ length: 12 }, (_, i) => ({
  id: i,
  left: Math.random() * 100,
  size: 20 + Math.random() * 40,
}));

const BubbleTransition: React.FC = () => {
  const navigate = useNavigate();

  useEffect(() => {
    const timer = setTimeout(() => navigate("/home"), 3000);
    return () => clearTimeout(timer);
  }, [navigate]);

  return (
    <Container>
      <MainBubble
        initial={{ y: 0, scale: 1, opacity: 1 }}
        animate={{ y: -window.innerHeight * 0.8, scale: 0.8, opacity: 0 }}
        transition={{ duration: 3, ease: "easeOut" }}
      >
        <Title>welcome to the stanford bubble</Title>
      </MainBubble>
      {bubbles.map((b, index) => (
        <SmallBubble
          key={b.id}
          left={b.left}
          size={b.size}
          initial={{ y: 0, opacity: 0.8, scale: 1 }}
          animate={{ y: -window.innerHeight * 1.2, opacity: 0, scale: 0.8 }}
          transition={{
            duration: 4,
            delay: index * 0.1,
            ease: "linear",
            repeat: Infinity,
          }}
        />
      ))}
    </Container>
  );
};

export default BubbleTransition;
