import { Html, Head, Main, NextScript } from "next/document";

export default function Document() {
  return (
    <Html lang="en">
      <Head>
        {/* Tip: set <title> per-page with next/head, not here */}
        <title>Run NL</title>
        {/* Use Puffin SVG as the tab icon */}
        <link rel="icon" href="/icons/newPufin-Kittl(1).svg" type="image/svg+xml" sizes="any" />
        <link rel="mask-icon" href="/icons/newPufin-Kittl(1).svg" color="#0f5c5b" />
        {/* Fallback for older browsers */}
        <link rel="alternate icon" href="/favicon.ico" />
        <link rel="shortcut icon" href="/favicon.ico" />
      </Head>
      <body>
        <Main />
        <NextScript />
      </body>
    </Html>
  );
}
