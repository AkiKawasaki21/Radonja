import Loader from "@/components/act1/Loader";
import Hero from "@/components/act1/Hero";
import Signature from "@/components/act1/Signature";
import Quote from "@/components/act1/Quote";
import HorizontalGallery from "@/components/act1/HorizontalGallery";

export default function Home() {
  return (
    <>
      <Loader />
      <main id="main">
        <Hero />
        <Signature />
        <Quote />
        <HorizontalGallery />
      </main>
    </>
  );
}
