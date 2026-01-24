import Script from "next/script";

interface AdsenseScriptProps {
  adClient?: string;
}

export function AdsenseScript({
  adClient = "ca-pub-XXXXXXXX",
}: AdsenseScriptProps) {
  return (
    <Script
      id="adsense-script"
      strategy="afterInteractive"
      async
      src={`https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=${adClient}`}
      crossOrigin="anonymous"
    />
  );
}



