import Loader from "@/components/act1/Loader";
import Hero from "@/components/act1/Hero";
import Quote from "@/components/act1/Quote";
import HorizontalGallery from "@/components/act1/HorizontalGallery";
import FieldGateway from "@/components/act2/FieldGateway";

export default function Home() {
  return (
    <>
      <Loader />
      <main id="main">
        <Hero />
        <HorizontalGallery />
        <Quote />
        <FieldGateway />
      </main>
    </>
  );
}
