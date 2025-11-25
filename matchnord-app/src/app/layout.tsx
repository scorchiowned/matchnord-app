import { Inter } from "next/font/google";
import "./globals.css";
import { createThemeCss, matchnordAppTemplate } from "@matchnord/theme";

const inter = Inter({ subsets: ["latin"] });
const themeCss = createThemeCss(matchnordAppTemplate);

export const metadata = {
  title: "MatchNord - Tournament Management",
  description: "The ultimate platform for following tournaments across the Nordic region",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <head>
        <style
          data-theme="matchnord-app"
          dangerouslySetInnerHTML={{ __html: themeCss }}
        />
      </head>
      <body className={inter.className}>
        {children}
      </body>
    </html>
  );
}
