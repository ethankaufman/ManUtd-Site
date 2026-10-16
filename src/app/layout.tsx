import type { Metadata } from "next";
import { Anton, Geist, Geist_Mono } from "next/font/google";
import Footer from "@/components/Footer";
import SiteNav from "@/components/SiteNav";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

// Anton for big condensed headlines; Geist for text; Geist Mono for small labels and numbers.
const anton = Anton({ weight: "400", variable: "--font-anton", subsets: ["latin"] });

export const metadata: Metadata = {
  title: { default: "Manchester United: every match, trophy and legend", template: "%s | Manchester United fan site" },
  description: "An unofficial Manchester United fan site: the current season, every match, honours, managers, Old Trafford and more.",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html
      lang="en"
      className={`${geistSans.variable} ${geistMono.variable} ${anton.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col">
        <SiteNav />
        <div className="flex-1">{children}</div>
        <Footer />
      </body>
    </html>
  );
}
