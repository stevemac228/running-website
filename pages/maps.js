import Header from "../components/Header";
import Footer from "../components/Footer";
import dynamic from "next/dynamic";

const MapsPage = dynamic(() => import("../components/MapsPage"), { ssr: false });

export default function MapsRoute() {
  return (
    <div>
      <Header />
      <main style={{ padding: 24 }}>
        <MapsPage />
      </main>
      <Footer />
    </div>
  );
}
