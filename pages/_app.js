import "../styles/globals.css";
import "../components/PaceCalculator/PaceCalculator.css";
import "../components/RegistrationTimeline/RegistrationTimeline.css";
import { Analytics } from "@vercel/analytics/next";

export default function MyApp({ Component, pageProps }) {
  return (
    <div className="app-container">
      <Component {...pageProps} />
      <Analytics />
    </div>
  );
}