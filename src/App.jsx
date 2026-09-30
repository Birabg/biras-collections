import { BrowserRouter, Routes, Route } from "react-router-dom";
import Home from "./pages/Home";

function Placeholder({ title }) {
  return (
    <div className="flex min-h-screen items-center justify-center">
      <h1 className="text-3xl font-semibold">{title}</h1>
    </div>
  );
}

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Home />} />

        <Route
          path="/shop"
          element={<Placeholder title="Shop — Coming Next" />}
        />

        <Route
          path="/cart"
          element={<Placeholder title="Cart — Coming Next" />}
        />

        <Route
          path="/login"
          element={<Placeholder title="Login — Coming Next" />}
        />

        <Route
          path="/account"
          element={<Placeholder title="Account — Coming Next" />}
        />

        <Route
          path="*"
          element={<Placeholder title="Page Not Found" />}
        />
      </Routes>
    </BrowserRouter>
  );
}

export default App;