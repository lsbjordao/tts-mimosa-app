import "./globals.css";
import { Inter } from "next/font/google";
import Script from "next/script";

const inter = Inter({ subsets: ["latin"] });

export const metadata = {
  title: "TTS-Mimosa",
  icons: {
    icon: "/TTS-Mimosa-App/favicon.png",
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="pt-BR" className="dark">
      <head>
        {/* Google tag (gtag.js) */}
        <Script
          async
          src="https://www.googletagmanager.com/gtag/js?id=G-5P7S18CDTY"
        />
        <Script id="google-analytics">
          {`
            window.dataLayer = window.dataLayer || [];
            function gtag(){dataLayer.push(arguments);}
            gtag('js', new Date());
            gtag('config', 'G-5P7S18CDTY');
          `}
        </Script>
      </head>
      <body
        className={`${inter.className} flex h-screen overflow-hidden bg-black text-white`}
      >
        {children}
      </body>
    </html>
  );
}
