import { Routes, Route, Navigate } from "react-router-dom";
import { AnimatePresence } from "framer-motion";
import { useLocation } from "react-router-dom";
import Layout from "./components/layout/Layout";
import Chapter1 from "./pages/Chapter1";
import Chapter2 from "./pages/Chapter2";
import Chapter3 from "./pages/Chapter3";
import Chapter4 from "./pages/Chapter4";
import Chapter5 from "./pages/Chapter5";
import Chapter6 from "./pages/Chapter6";
import Chapter7 from "./pages/Chapter7";
import Chapter8 from "./pages/Chapter8";
import Chapter9 from "./pages/Chapter9";
import Chapter10 from "./pages/Chapter10";

export default function App() {
  const location = useLocation();

  return (
    <Layout>
      <AnimatePresence mode="wait">
        <Routes location={location} key={location.pathname}>
          <Route path="/" element={<Navigate to="/ch/1" replace />} />
          <Route path="/ch/1" element={<Chapter1 />} />
          <Route path="/ch/2" element={<Chapter2 />} />
          <Route path="/ch/3" element={<Chapter3 />} />
          <Route path="/ch/4" element={<Chapter4 />} />
          <Route path="/ch/5" element={<Chapter5 />} />
          <Route path="/ch/6" element={<Chapter6 />} />
          <Route path="/ch/7" element={<Chapter7 />} />
          <Route path="/ch/8" element={<Chapter8 />} />
          <Route path="/ch/9" element={<Chapter9 />} />
          <Route path="/ch/10" element={<Chapter10 />} />
        </Routes>
      </AnimatePresence>
    </Layout>
  );
}
