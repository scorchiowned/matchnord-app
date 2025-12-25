import { Inter } from "next/font/google";
import "./globals.css";
import { createThemeCss, matchnordAppTemplate } from "@matchnord/theme";

const inter = Inter({ subsets: ["latin"] });
const themeCss = createThemeCss(matchnordAppTemplate);

export const metadata = {
  title: "MatchNord - Tournament Management",
  description:
    "The ultimate platform for following tournaments across the Nordic region",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <head>
        {/* Google Tag Manager */}
        <script
          dangerouslySetInnerHTML={{
            __html: `(function(w,d,s,l,i){w[l]=w[l]||[];w[l].push({'gtm.start':
new Date().getTime(),event:'gtm.js'});var f=d.getElementsByTagName(s)[0],
j=d.createElement(s),dl=l!='dataLayer'?'&l='+l:'';j.async=true;j.src=
'https://www.googletagmanager.com/gtm.js?id='+i+dl;f.parentNode.insertBefore(j,f);
})(window,document,'script','dataLayer','GTM-5VCWZCZV');`,
          }}
        />
        {/* End Google Tag Manager */}
        {/** Start Google AdSense */}
        <script
          async
          src="https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=ca-pub-2057727251613557"
          crossOrigin="anonymous"
        />
        {/** End Google AdSense */}
        <style
          data-theme="matchnord-app"
          dangerouslySetInnerHTML={{ __html: themeCss }}
        />
      </head>
      <body className={inter.className}>
        {/* Google Tag Manager (noscript) */}
        <noscript>
          <iframe
            src="https://www.googletagmanager.com/ns.html?id=GTM-5VCWZCZV"
            height="0"
            width="0"
            style={{ display: "none", visibility: "hidden" }}
          />
        </noscript>
        {/* End Google Tag Manager (noscript) */}
        {children}
      </body>
    </html>
  );
}
