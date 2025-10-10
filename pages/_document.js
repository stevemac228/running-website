import { Html, Head, Main, NextScript } from "next/document";

export default function Document() {
  return (
    <Html lang="en">
      <Head>
        {/* Preload common badge icons that are still external images */}
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
