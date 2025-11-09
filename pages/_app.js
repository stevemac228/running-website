import "../styles/globals.css";
import "../styles/navbar.css";
import { Roboto } from "next/font/google";

const roboto = Roboto({
  subsets: ["latin"],
  weight: ["400", "500", "700"],
});

export default function MyApp({ Component, pageProps }) {
  return (
    <div className={roboto.className}>
      <Component {...pageProps} />
    </div>
  );
}