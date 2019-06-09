import React from "react";

// Style
import styled from "styled-components";

// Components
import Visualizer from "./Visualizer";

const Page = styled.div`
  height: 100vh;
  width: 100vw;
  display: flex;
  justify-content: center;
  align-items: center;
`;

const App = () => {
  return (
    <Page>
      <Visualizer />
    </Page>
  );
};

export default App;
