import Hero from '../components/home/Hero';
import CategorySection from '../components/home/CategorySection';
import FeaturedProducts from '../components/home/FeaturedProducts';
import StoryBanner from '../components/home/StoryBanner';
import BenefitsStrip from '../components/home/BenefitsStrip';
import Newsletter from '../components/home/Newsletter';

export default function Home() {
  return (
    <>
      <Hero />
      <CategorySection />
      <FeaturedProducts />
      <StoryBanner />
      <BenefitsStrip />
      <Newsletter />
    </>
  );
}
