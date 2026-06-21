import React from "react";

import githubLogo from "../assets/github.svg";
import xLogo from "../assets/x.svg";
import devlensLogo from "../assets/favicon/DevLens.png";

const Header = () => {
  return (
    <nav className="w-full py-4 flex items-center justify-between flex-col border-b px-15 gap-4 md:flex-row lg:flex-row sm:flex-row">
      <div className="flex items-center gap-2">
        <img
          src={devlensLogo}
          alt="DevLens Logo"
          className="h-12 mr-2 rounded-full border"
        />
        <h1 className="font-bold text-3xl">DevLens</h1>
      </div>
      <div className="flex items-center gap-5">
        <a href="https://github.com/DibyanshuMoura" target="_blank">
          <img src={githubLogo} 
          alt="Github Logo" 
          className="h-10"
          />
        </a>
        <a href="https://x.com/DibyanshuMoura" target="_blank">
          <img src={xLogo} 
          alt="Twitter Logo" 
          className="h-10" 
          />
        </a>
      </div>
    </nav>
  );
};

export default Header;