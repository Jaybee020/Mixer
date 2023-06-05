import "./App.css";
import { BrowserRouter as Router, Link, Route, Routes } from "react-router-dom";
import Deposit from "./components/Deposit";
import Withdraw from "./components/Withdraw";
import Relayers from "./components/Relayers";
import { useState } from "react";

function App() {
  const [useRelayer, setUseRelayer] = useState(false);

  function toggleUseRelayer() {
    setUseRelayer(!useRelayer);
  }

  return (
    <Router>
      <header>
        <Link to="/">
          <nav className="navBar">ZK Mixer</nav>
        </Link>
      </header>
      <Routes>
        <Route
          path="/"
          element={
            <>
              <Deposit></Deposit>
            </>
          }
        ></Route>
        <Route
          path="/withdraw"
          element={
            <>
              <Withdraw
                toggleFn={toggleUseRelayer}
                useRelayer={useRelayer}
              ></Withdraw>
            </>
          }
        ></Route>

        <Route
          path="/relayers"
          element={
            <>
              <Relayers></Relayers>
            </>
          }
        ></Route>
      </Routes>
    </Router>
  );
}

export default App;
