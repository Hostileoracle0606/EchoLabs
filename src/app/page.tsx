import { Hero, HowItWorks, Features, AuraShowcase, CTA } from '@/components/landing';

export default function LandingPage() {
    return (
        <>
            <Hero />
            <HowItWorks />
            <Features />
            <section id="aura">
                <AuraShowcase />
            </section>
            <CTA />
        </>
    );
}
