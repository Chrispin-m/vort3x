"use client";

import { FC, ReactNode } from "react";
import Footer from "./Footer";
import Header from "./Header";

interface Props {
  children: ReactNode;
}

const Layout: FC<Props> = ({ children }) => {
  return (
    <div className="bg-gypsum overflow-hidden flex flex-col min-h-screen">
      <Header />
      <main className="flex-1 mt-16 mb-8"> {/* Added margin for header/footer spacing */}
        <div className="py-8 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          {children}
        </div>
      </main>
      <Footer />
    </div>
  );
};

export default Layout;