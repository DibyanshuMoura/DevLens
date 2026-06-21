import React from "react";
import Header from "../components/Header";
import Middle from "../components/Middle";
import Footer from "../components/Footer";

const App = () => {
  return (
    <div className="w-full min-h-full bg-[#e6e6e6] flex flex-col">
      <Header />
      <Middle />
      <Footer />
    </div>
  );
};

export default App;
