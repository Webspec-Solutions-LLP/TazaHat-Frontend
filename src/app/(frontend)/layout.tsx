import type { Metadata } from "next";
import Navbar from "@/components/navbar/Navbar";
import Footer from "@/components/footer/Footer";
import FloatingMessageButton from "@/components/floatingMessage/FloatingMessageButton";
import "leaflet/dist/leaflet.css";
import "./Home.css";

export const metadata: Metadata = {
  title: "TazaHat",
  description: "TazaHat Online Marketplace",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className="min-h-screen flex flex-col">
        <Navbar />
        <main className="flex-1">{children}</main>
        <Footer />
        <FloatingMessageButton />
      </body>
    </html>
  );
}
