import "../styles/globals.css";
import { Analytics } from "@vercel/analytics/next";

export default function MyApp({ Component, pageProps }) {
  return (
    <div className="app-container">
      <Component {...pageProps} />
      <Analytics />
    </div>
  );
}