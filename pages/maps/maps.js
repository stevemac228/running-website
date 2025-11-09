import Header from "../../components/Header/Header";
import Footer from "../../components/Footer/Footer";
import dynamic from "next/dynamic";

const MapsPage = dynamic(() => import("../../components/MapsPage/MapsPage"), { ssr: false });
 
export default function MapsRoute() {
  return (
    <div>
      <Header />
      <main className="page-main-padding">
        <MapsPage />
      </main>
      <Footer />
    </div>
  );
}
