import { notFound } from "next/navigation";
import { getRequestConfig } from "next-intl/server";

// Can be imported from a shared config
const locales = ["fi", "en", "sv", "no", "da"];

// Import all messages statically
import fiMessages from "./fi.json";
import enMessages from "./en.json";
import svMessages from "./sv.json";
import noMessages from "./no.json";
import daMessages from "./da.json";

const messages = {
  fi: fiMessages,
  en: enMessages,
  sv: svMessages,
  no: noMessages,
  da: daMessages,
};

export default getRequestConfig(async ({ locale }) => {
  // Validate that the incoming `locale` parameter is valid
  if (!locales.includes(locale as any)) {
    notFound();
  }

  return {
    messages: messages[locale as keyof typeof messages],
  };
});
