import React from "react";
import Button from "./components/Button";

function App() {
  return (
    <div style={{ 
      display: "flex", 
      justifyContent: "center", 
      alignItems: "center", 
      minHeight: "100vh",
      margin: 0,
      padding: 0
    }}>
      <Button />
    </div>
  );
}

export default App;
