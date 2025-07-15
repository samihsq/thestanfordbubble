import React from "react";
import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import { createGlobalStyle } from "styled-components";
import "./App.css";
import LandingPage from "./components/LandingPage";
import BubbleTransition from "./components/BubbleTransition";
import MainPage from "./components/MainPage";

// Add preconnect and font loading
const fontUrl =
  "https://fonts.googleapis.com/css2?family=Varela+Round&display=swap";
const fontLink = document.createElement("link");
fontLink.href = fontUrl;
fontLink.rel = "stylesheet";
document.head.appendChild(fontLink);

const GlobalStyle = createGlobalStyle`
  body {
    margin: 0;
    font-family: "Varela Round", sans-serif;
    font-weight: 400;
    font-style: normal;
    background: linear-gradient(180deg, #e3f2fd 0%, #fce4ec 100%);
    color: #333;
  }
`;

function App() {
  return (
    <>
      <GlobalStyle />
      <Router>
        <Routes>
          <Route path="/" element={<LandingPage />} />
          <Route path="/transition" element={<BubbleTransition />} />
          <Route path="/home" element={<MainPage />} />
          {/* <Route path="/mainpage" element={<MainPage />} /> */}
        </Routes>
      </Router>
    </>
  );
}

export default App;
