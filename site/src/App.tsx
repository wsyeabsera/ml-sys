import { Routes, Route, Navigate } from "react-router-dom";
import { AnimatePresence } from "framer-motion";
import { useLocation } from "react-router-dom";
import Layout from "./components/layout/Layout";

// Learn chapters (new order)
import Chapter1 from "./pages/Chapter1";   // 01: What Are We Building? (was Ch1)
import Chapter2 from "./pages/Chapter2";   // 02: Tensors (was Ch2) — will be rewritten
import Chapter5 from "./pages/Chapter5";   // 03: Autograd (was Ch5)
import Chapter6 from "./pages/Chapter6";   // 04: Neural Networks (was Ch6)
import Chapter7 from "./pages/Chapter7";   // 05: Attention (was Ch7)
import Chapter8 from "./pages/Chapter8";   // 06: Model Files (was Ch8)
import Chapter9 from "./pages/Chapter9";   // 07: Transformers (was Ch9)
import Chapter10 from "./pages/Chapter10"; // 08: Running a Real LLM (was Ch10)

// Misc
import Chapter4 from "./pages/Chapter4";   // MCP Server (moved from main arc)

// Tools
import Playground from "./pages/Playground";
import Settings from "./pages/Settings";
import ToolReference from "./pages/ToolReference";

export default function App() {
  const location = useLocation();

  return (
    <Layout>
      <AnimatePresence mode="wait">
        <Routes location={location} key={location.pathname}>
          <Route path="/" element={<Navigate to="/learn/1" replace />} />

          {/* Learn arc */}
          <Route path="/learn/1" element={<Chapter1 />} />
          <Route path="/learn/2" element={<Chapter2 />} />
          <Route path="/learn/3" element={<Chapter5 />} />
          <Route path="/learn/4" element={<Chapter6 />} />
          <Route path="/learn/5" element={<Chapter7 />} />
          <Route path="/learn/6" element={<Chapter8 />} />
          <Route path="/learn/7" element={<Chapter9 />} />
          <Route path="/learn/8" element={<Chapter10 />} />

          {/* Misc */}
          <Route path="/misc/mcp-server" element={<Chapter4 />} />

          {/* Old routes → redirect to new */}
          <Route path="/ch/1" element={<Navigate to="/learn/1" replace />} />
          <Route path="/ch/2" element={<Navigate to="/learn/2" replace />} />
          <Route path="/ch/3" element={<Navigate to="/learn/1" replace />} />
          <Route path="/ch/4" element={<Navigate to="/misc/mcp-server" replace />} />
          <Route path="/ch/5" element={<Navigate to="/learn/3" replace />} />
          <Route path="/ch/6" element={<Navigate to="/learn/4" replace />} />
          <Route path="/ch/7" element={<Navigate to="/learn/5" replace />} />
          <Route path="/ch/8" element={<Navigate to="/learn/6" replace />} />
          <Route path="/ch/9" element={<Navigate to="/learn/7" replace />} />
          <Route path="/ch/10" element={<Navigate to="/learn/8" replace />} />

          {/* Tools */}
          <Route path="/playground" element={<Playground />} />
          <Route path="/reference" element={<ToolReference />} />
          <Route path="/settings" element={<Settings />} />
        </Routes>
      </AnimatePresence>
    </Layout>
  );
}
