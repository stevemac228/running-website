import Header from "../components/Header/Header";
import dynamic from "next/dynamic";
import Head from "next/head";

const MapsPage = dynamic(() => import("../components/MapsPage/MapsPage"), { ssr: false });

export default function MapsRoute() {
  return (
    <div className="maps-page-wrapper">
      <Head>
        <title>Race Map | Run NL</title>
        <meta name="description" content="Explore all running races across Newfoundland and Labrador on an interactive map." />
      </Head>
      <Header />
      <main className="maps-page-main">
        <MapsPage />
      </main>
    </div>
  );
}
