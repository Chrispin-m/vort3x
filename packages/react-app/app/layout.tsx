import { ReactNode } from "react";
import ClientLayout from "./ClientLayout";

export const metadata = {
  title: "Vort3x Spin DApp",
  description: "Spin to win on Celo Alfajores",
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="en">
      <body>
        <ClientLayout>{children}</ClientLayout>
      </body>
    </html>
  );
}
