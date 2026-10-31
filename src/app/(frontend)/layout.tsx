import type { Metadata } from "next";
import Navbar from "@/components/navbar/Navbar";
import Footer from "@/components/footer/Footer";
import FloatingMessageButton from "@/components/floatingMessage/FloatingMessageButton";
import BottomNavigation from "@/components/bottomNavigation/BottomNavigation";
import FeedbackButton from "@/components/feedbackButton/FeedbackButton";
import HomeBackConfirmation from "@/components/modals/confermation/HomeBackConfirmation";
import { CityProvider } from "@/lib/city";
import { readCityCookie } from "@/lib/server/city";
import "./Home.css";

export const metadata: Metadata = {
  title: "TazaHat",
  description: "TazaHat Online Marketplace",
};

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const city = await readCityCookie();
  return (
    <html lang="en">
      <body className="min-h-screen flex flex-col">
        <CityProvider value={city}>
        <Navbar />
        <main className="flex-1 frontend-layout-main">{children}</main>
        <Footer />
        <FloatingMessageButton />
        <BottomNavigation />
        <FeedbackButton />
        <HomeBackConfirmation />
        </CityProvider>
      </body>
    </html>
  );
}
