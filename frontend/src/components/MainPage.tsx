import React from "react";
import styled from "styled-components";
import { FiMenu, FiSearch } from "react-icons/fi";
import { motion } from "framer-motion";
import ThinFilmBubble from "./ThinFilmBubble";

const Container = styled(motion.div)`
  padding: 1rem 1.5rem;
`;

const Header = styled(motion.div)`
  display: flex;
  align-items: center;
  justify-content: space-between;
`;

const IconButton = styled(motion.button)`
  background: rgba(255, 255, 255, 0.6);
  border: none;
  border-radius: 50%;
  width: 40px;
  height: 40px;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  box-shadow: 0 2px 6px rgba(0, 0, 0, 0.1);
`;

const Title = styled(motion.h2)`
  text-align: center;
  margin: 1rem 0;
`;

const IconList = styled(motion.div)`
  display: flex;
  gap: 1rem;
  justify-content: center;
  margin-bottom: 2rem;
`;

const List = styled(motion.ul)`
  list-style: none;
  padding: 0;
  margin: 0 auto;
  max-width: 400px;
`;

const Item = styled(motion.li)`
  background: rgba(255, 255, 255, 0.6);
  margin-bottom: 0.5rem;
  padding: 0.8rem 1rem;
  border-radius: 12px;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.05);
`;

const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: { duration: 0.5, when: "beforeChildren", staggerChildren: 0.1 },
  },
};

const itemVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.5 } },
};

const MainPage: React.FC = () => {
  return (
    <Container variants={containerVariants} initial="hidden" animate="visible">
      <Header variants={itemVariants}>
        <IconButton whileHover={{ scale: 1.1 }} whileTap={{ scale: 0.95 }}>
          <FiMenu size={20} />
        </IconButton>
        <IconButton whileHover={{ scale: 1.1 }} whileTap={{ scale: 0.95 }}>
          <FiSearch size={20} />
        </IconButton>
      </Header>

      <Title variants={itemVariants}>Top of the Bubble</Title>

      <IconList variants={itemVariants}>
        {["A", "B", "C"].map((label) => (
          <ThinFilmBubble key={label} diameter={80}>
            {label}
          </ThinFilmBubble>
        ))}
      </IconList>

      <List variants={itemVariants}>
        {[1, 2, 3, 4, 5].map((num) => (
          <Item key={num} variants={itemVariants} whileHover={{ scale: 1.02 }}>
            Placeholder item {num}
          </Item>
        ))}
      </List>
    </Container>
  );
};

export default MainPage;
