import AnnouncementBar from '../components/layout/AnnouncementBar';
import Header from '../components/layout/Header';
import Footer from '../components/layout/Footer';
import Hero from '../components/home/Hero';
import CategorySection from '../components/home/CategorySection';
import FeaturedProducts from '../components/home/FeaturedProducts';
import StoryBanner from '../components/home/StoryBanner';
import Newsletter from '../components/home/Newsletter';

function Home() {
  return (
    <div className="min-h-screen bg-white text-gray-900 flex flex-col">
      <AnnouncementBar />
      <Header />
      <main className="flex-1">
        <Hero />
        <CategorySection />
        <FeaturedProducts />
        <StoryBanner />
        <Newsletter />
      </main>
      <Footer />
    </div>
  );
}

export default Home;