import React from "react";
import { useNavigate } from "react-router-dom";
import styled, { keyframes } from "styled-components";

const pulse = keyframes`
  0% {
    transform: scale(1);
    box-shadow: 0 0 25px rgba(255, 255, 255, 0.4);
  }
  50% {
    transform: scale(1.05);
    box-shadow: 0 0 35px rgba(255, 255, 255, 0.6);
  }
  100% {
    transform: scale(1);
    box-shadow: 0 0 25px rgba(255, 255, 255, 0.4);
  }
`;

const Container = styled.div`
  height: 100vh;
  display: flex;
  align-items: center;
  justify-content: center;
  background: transparent;
`;

const Bubble = styled.div`
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
  cursor: pointer;
  animation: ${pulse} 6s ease-in-out infinite;
`;

const Title = styled.h1`
  text-align: center;
  font-size: 1.8rem;
  color: #333;
  padding: 0 1rem;
`;

const LandingPage: React.FC = () => {
  const navigate = useNavigate();

  const handleClick = () => {
    navigate("/transition");
  };

  return (
    <Container>
      <Bubble onClick={handleClick}>
        <Title>welcome to the stanford bubble</Title>
      </Bubble>
    </Container>
  );
};

export default LandingPage;
