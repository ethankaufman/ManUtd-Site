import type { Metadata } from "next";
import { Anton, Bangers, Comic_Neue, Geist, Geist_Mono } from "next/font/google";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

// Comic-book lettering: Anton for big titles, Bangers for sound effects, Comic Neue for caption boxes.
const anton = Anton({ weight: "400", variable: "--font-anton", subsets: ["latin"] });
const bangers = Bangers({ weight: "400", variable: "--font-bangers", subsets: ["latin"] });
const comicNeue = Comic_Neue({ weight: ["400", "700"], variable: "--font-comic", subsets: ["latin"] });

export const metadata: Metadata = {
  title: "Manchester United: every match, trophy and legend",
  description: "An unofficial Manchester United fan site: the current season, every match, honours, managers, Old Trafford and more.",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html
      lang="en"
      className={`${geistSans.variable} ${geistMono.variable} ${anton.variable} ${bangers.variable} ${comicNeue.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col">{children}</body>
    </html>
  );
}
