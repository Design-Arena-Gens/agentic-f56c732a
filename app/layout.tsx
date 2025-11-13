import "./globals.css";
import type { Metadata } from "next";
import { Poppins } from "next/font/google";

const poppins = Poppins({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"]
});

export const metadata: Metadata = {
  title: "ReelFetch | Instagram Reels Downloader",
  description:
    "Instagram Reel डाउनलोडर: किसी भी इंस्टाग्राम रील का लिंक डालें और तुरंत HD वीडियो डाउनलोड करें।"
};

export default function RootLayout({
  children
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="hi" className={poppins.className}>
      <body>{children}</body>
    </html>
  );
}
