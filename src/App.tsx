import React from "react";
import "./styles/admin.css";
import AppRouter from "./router";
import { WhiteLabelProvider } from "./contexts/WhiteLabelContext";

const App: React.FC = () => {
  return (
    <WhiteLabelProvider>
      <AppRouter />
    </WhiteLabelProvider>
  );
};

export default App;