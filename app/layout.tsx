import type { Metadata } from "next";
import { Inter, JetBrains_Mono } from "next/font/google";
import "./globals.css";

const inter = Inter({
  variable: "--font-sans",
  subsets: ["latin"],
  display: "swap",
});

const jetbrainsMono = JetBrains_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
  display: "swap",
});

export const metadata: Metadata = {
  title: "The Hackathon Simulator | Build. Ship. Survive.",
  description:
    "Experience the thrill of a hackathon from problem reveal to final judging. Build your dream project under pressure in this gamified web simulation.",
  keywords: [
    "hackathon",
    "simulator",
    "coding",
    "game",
    "startup",
    "competition",
  ],
  authors: [{ name: "Hackathon Simulator Team" }],
  openGraph: {
    title: "The Hackathon Simulator",
    description: "Build. Ship. Survive. — A gamified hackathon experience.",
    type: "website",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={`${inter.variable} ${jetbrainsMono.variable} dark h-full antialiased`}
    >
      <body className="min-h-full flex flex-col animated-gradient-bg">
        {children}
      </body>
    </html>
  );
}
