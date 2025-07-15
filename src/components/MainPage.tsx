import React from "react";
import styled from "styled-components";
import { motion } from "framer-motion";
import ThinFilmBubble from "./ThinFilmBubble";

/* ---------- styled ---------- */
const Page = styled(motion.div)`
  padding: 1rem 1.5rem;
  min-height: 100vh;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: flex-start;
`;

const BubbleRow = styled(motion.div)`
  display: flex;
  gap: 1.5rem;
  margin-top: 4rem;
`;

/* ---------- framer-motion variants ---------- */
const pageVariants = {
  hidden: { opacity: 0 },
  visible: { opacity: 1, transition: { duration: 0.5 } },
};

const bubbleVariants = {
  hidden: { scale: 0, opacity: 0 },
  visible: (i: number) => ({
    scale: 1,
    opacity: 1,
    transition: { delay: 0.3 + i * 0.2, type: "spring", stiffness: 80 },
  }),
};

/* ---------- component ---------- */
export default function MainPage() {
  const letters = ["A", "B", "C"];

  return (
    <Page variants={pageVariants} initial="hidden" animate="visible">
      <h2>Top of the Bubble</h2>

      <BubbleRow>
        {letters.map((ch, i) => (
          <motion.div key={ch} variants={bubbleVariants} custom={i}>
            <ThinFilmBubble diameter={80}>{ch}</ThinFilmBubble>
          </motion.div>
        ))}
      </BubbleRow>
    </Page>
  );
}
