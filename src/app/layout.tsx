import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "رفيق — مساعد الذكاء الاصطناعي الصحي | Rafeeq AI Health Assistant",
  description:
    "رفيق: نظام الذكاء الاصطناعي الصحي المدمج مع منظومة حكيم الأردنية. Rafeeq is an AI-powered clinical assistant integrated with Jordan's Hakeem national health platform.",
  keywords: ["Rafeeq", "رفيق", "Hakeem", "حكيم", "Jordan Health", "AI Healthcare"],
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="ar" dir="rtl" className="h-full" suppressHydrationWarning>
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link
          href="https://fonts.googleapis.com/css2?family=IBM+Plex+Sans+Arabic:wght@300;400;500;600;700&family=Inter:wght@300;400;500;600;700;800&display=swap"
          rel="stylesheet"
        />
      </head>
      <body className="h-full overflow-hidden antialiased" style={{ background: "var(--bg)", color: "var(--fg)" }} suppressHydrationWarning>
        {children}
      </body>
    </html>
  );
}
