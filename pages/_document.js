import { Html, Head, Main, NextScript } from "next/document";

export default function Document() {
  return (
    <Html lang="en">
      <Head>
        {/* Preload navigation icons to prevent flashing */}
        <link rel="preload" href="/icons/home.svg" as="image" />
        <link rel="preload" href="/icons/calendar.svg" as="image" />
        <link rel="preload" href="/icons/list.svg" as="image" />
        <link rel="preload" href="/icons/newPufin-Kittl(1).svg" as="image" />
        {/* Preload common badge icons */}
        <link rel="preload" href="/icons/medal.svg" as="image" />
        <link rel="preload" href="/icons/tshirt.svg" as="image" />
        <link rel="preload" href="/icons/reception.svg" as="image" />
      </Head>
      <body>
        <Main />
        <NextScript />
      </body>
    </Html>
  );
}
