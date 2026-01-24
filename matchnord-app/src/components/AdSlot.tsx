"use client";
import { useEffect } from "react";

interface AdSlotProps {
  adClient?: string;
  adSlot: string;
  adFormat?: string;
  fullWidthResponsive?: boolean;
  style?: React.CSSProperties;
}

export function AdSlot({
  adClient = "ca-pub-XXXXXXXX",
  adSlot,
  adFormat = "auto",
  fullWidthResponsive = true,
  style,
}: AdSlotProps) {
  useEffect(() => {
    try {
      (window.adsbygoogle = window.adsbygoogle || []).push({});
    } catch {}
  }, []);

  return (
    <ins
      className="adsbygoogle"
      style={{ display: "block", ...style }}
      data-ad-client={adClient}
      data-ad-slot={adSlot}
      data-ad-format={adFormat}
      data-full-width-responsive={fullWidthResponsive ? "true" : undefined}
    />
  );
}



