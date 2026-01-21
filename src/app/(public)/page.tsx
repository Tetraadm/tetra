import { Header } from "@/components/layout/header"
import { HeroSection } from "@/components/sections/hero-section"
import { FeaturesSection } from "@/components/sections/features-section"
import { ProductsSection } from "@/components/sections/products-section"
import { ContactSection } from "@/components/sections/contact-section"
import { Footer } from "@/components/sections/footer"

export default function LandingPage() {
  return (
    <main className="min-h-screen bg-background">
      <Header />
      <HeroSection />
      <FeaturesSection />
      <ProductsSection />
      <ContactSection />
      <Footer />
    </main>
  )
}