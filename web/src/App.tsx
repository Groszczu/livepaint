import { Component, lazy } from "solid-js";

import { Route, Routes } from "solid-app-router";
import { HopeProvider } from "@hope-ui/solid";

const HomePage = lazy(() => import("./pages/HomePage"));

const App: Component = () => {
  return (
    <HopeProvider>
      <Routes>
        <Route path="/" element={<HomePage />} />
        <Route path="/*all" element={<div>Not found</div>} />
      </Routes>
    </HopeProvider>
  );
};

export default App;
