import Footer from "@/components/sections/Footer";
import Navbar from "@/components/sections/Navbar";
import { Sparkles, Hash, Globe } from "lucide-react";

export default function EnterprisePage() {
    return (
        <main className="w-full min-h-screen bg-black">
            <Navbar />

            {/* Hero Section */}
            <section className="w-full h-screen relative">
                <video
                    src="https://assets.weavy.ai/enterprise_page/enterprise_video_desktop.mp4"
                    className="w-full h-full object-cover"
                    autoPlay
                    loop
                    muted
                    playsInline
                />

                {/* Content Overlay */}
                <div className="absolute inset-0 z-10 flex flex-col items-center justify-center text-center px-4 md:px-[5%]">
                    <h1 className="text-white text-[48px] md:text-[80px] leading-[1.1] tracking-[-0.02em] font-medium max-w-[1200px] mb-8">
                        Turn your creative team into an AI-first powerhouse
                    </h1>

                    <p className="text-white/90 text-lg md:text-xl max-w-[800px] leading-relaxed mb-10">
                        Weavy enables enterprise design teams to adopt AI at scale – combining all your models, editing tools, and workflows in one platform that’s built for production.
                    </p>

                    <button className="bg-[#f7ff9e] text-black px-8 py-3 rounded-xl text-lg font-medium hover:bg-[#eeff8d] transition-colors cursor-pointer">
                        Contact Sales
                    </button>
                </div>
            </section>

            {/* Features Section */}
            <section className="w-full bg-[#fdfbf7] py-20 px-4 md:px-[5%] relative z-10">
                <div className="container mx-auto max-w-[1440px]">
                    <h2 className="text-[#1a1a1a] text-[32px] md:text-[40px] font-medium mb-16 tracking-tight">
                        Enterprise power. Creative control.
                    </h2>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-8 md:gap-12">
                        {/* Column 1 */}
                        <div className="flex flex-col items-start">
                            <div className="w-12 h-12 bg-[#ebe9e4] rounded-lg flex items-center justify-center mb-6">
                                <Sparkles className="w-6 h-6 text-[#4a4a4a]" strokeWidth={1.5} />
                            </div>
                            <h3 className="text-[#1a1a1a] text-xl font-medium mb-4">
                                All your AI tools, one visual canvas
                            </h3>
                            <ul className="space-y-3">
                                {[
                                    "Use any model — image, video, 3D — in one place",
                                    "One subscription covers all models and future releases",
                                    "Shared credit pool across team members and months"
                                ].map((item, i) => (
                                    <li key={i} className="text-[#4a4a4a] text-sm leading-relaxed flex items-start gap-2">
                                        <span className="mt-1.5 w-1 h-1 rounded-full bg-[#4a4a4a] flex-shrink-0" />
                                        {item}
                                    </li>
                                ))}
                            </ul>
                        </div>

                        {/* Column 2 */}
                        <div className="flex flex-col items-start">
                            <div className="w-12 h-12 bg-[#ebe9e4] rounded-lg flex items-center justify-center mb-6">
                                <Hash className="w-6 h-6 text-[#4a4a4a]" strokeWidth={1.5} />
                            </div>
                            <h3 className="text-[#1a1a1a] text-xl font-medium mb-4">
                                Production-grade creative control
                            </h3>
                            <ul className="space-y-3">
                                {[
                                    "Edit with layers, masks, and advanced color-grading tools",
                                    "Stay on-brand with scalable, reusable design systems",
                                    "Turn complex workflows into simple apps anyone can use"
                                ].map((item, i) => (
                                    <li key={i} className="text-[#4a4a4a] text-sm leading-relaxed flex items-start gap-2">
                                        <span className="mt-1.5 w-1 h-1 rounded-full bg-[#4a4a4a] flex-shrink-0" />
                                        {item}
                                    </li>
                                ))}
                            </ul>
                        </div>

                        {/* Column 3 */}
                        <div className="flex flex-col items-start">
                            <div className="w-12 h-12 bg-[#ebe9e4] rounded-lg flex items-center justify-center mb-6">
                                <Globe className="w-6 h-6 text-[#4a4a4a]" strokeWidth={1.5} />
                            </div>
                            <h3 className="text-[#1a1a1a] text-xl font-medium mb-4">
                                Built for enterprise adoption
                            </h3>
                            <ul className="space-y-3">
                                {[
                                    "Enterprise-grade commercial rights, privacy, security, and indemnity",
                                    "Trace every asset back to its legal source",
                                    "Priority Slack support, training, and workshops for teams"
                                ].map((item, i) => (
                                    <li key={i} className="text-[#4a4a4a] text-sm leading-relaxed flex items-start gap-2">
                                        <span className="mt-1.5 w-1 h-1 rounded-full bg-[#4a4a4a] flex-shrink-0" />
                                        {item}
                                    </li>
                                ))}
                            </ul>
                        </div>
                    </div>
                </div>
            </section>
            {/* Trusted Teams Section */}
            <section className="w-full bg-[#fdfbf7] pb-20 px-4 md:px-[5%] relative z-10">
                <div className="container mx-auto max-w-[1440px]">
                    <div className="flex flex-col lg:flex-row gap-12 lg:gap-24">
                        {/* Title Column */}
                        <div className="lg:w-1/4 pt-8">
                            <h2 className="text-[#1a1a1a] text-[32px] md:text-[40px] font-medium tracking-tight leading-tight">
                                Trusted by leading teams
                            </h2>
                        </div>

                        {/* Testimonials Column */}
                        <div className="lg:w-3/4 grid grid-cols-1 md:grid-cols-2 gap-6">
                            {/* WIX Card */}
                            <div className="bg-[#e0e2cc] rounded-[24px] p-8 md:p-12 flex flex-col justify-between min-h-[400px]">
                                <div>
                                    <div className="mb-12">
                                        <span className="text-3xl font-bold text-[#1a1a1a]">WIX</span>
                                    </div>
                                    <p className="text-[#1a1a1a] text-lg leading-relaxed mb-8">
                                        "With our team's rapid growth and the increasing fragmentation of AI tools, ensuring brand consistency and collaboration enhancement required new solutions. Weavy delivered a system to standardize creativity by combining pro editing control with reusable, AI-powered workflows."
                                    </p>
                                </div>
                                <div>
                                    <div className="font-semibold text-[#1a1a1a]">Niv Farchi</div>
                                    <div className="text-[#4a4a4a] text-sm">Head of Design Guild</div>
                                </div>
                            </div>

                            {/* eToro Card */}
                            <div className="bg-[#e0e2cc] rounded-[24px] p-8 md:p-12 flex flex-col justify-between min-h-[400px]">
                                <div>
                                    <div className="mb-12">
                                        {/* eToro stylized text simulation */}
                                        <span className="text-3xl font-bold text-[#1a1a1a] tracking-tight">’eтoro’</span>
                                    </div>
                                    <p className="text-[#1a1a1a] text-lg leading-relaxed mb-8">
                                        "We were early adopters of AI in production, but managing multiple tools was slowing us down. Weavy brings every model into one powerful canvas, combining traceability and creative precision, helping us move faster without compromise."
                                    </p>
                                </div>
                                <div>
                                    <div className="font-semibold text-[#1a1a1a]">Shay Chikotay</div>
                                    <div className="text-[#4a4a4a] text-sm">Head of Creative & Content</div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </section>
            <Footer />

        </main>
    );
}