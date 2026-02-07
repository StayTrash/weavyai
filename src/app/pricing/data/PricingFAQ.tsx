'use client';

import React, { useState } from 'react';
import Link from 'next/link';

interface FAQItem {
    question: string;
    answer: React.ReactNode;
}

const FAQS: FAQItem[] = [
    {
        question: "How do Weavy credits work?",
        answer: "Weavy credits are your currency for AI generation. Each plan includes a monthly credit allocation that you spend when creating content with different AI models. Different models require different amounts of credits per generation - for example, running Flux costs fewer credits than using Veo 3."
    },
    {
        question: "What happens if I use all my monthly credits?",
        answer: "For paid plans (Starter, Professional, and Team), you can purchase additional credits at $10 per 1,000 credits (Starter) or $10 per 1,200 credits (Professional and Team). These topped-up credits roll over for 12 months, giving you flexibility beyond your monthly allocation. The Free plan doesn't offer credit top-ups."
    },
    {
        question: "Do unused credits roll over to the next month?",
        answer: "If you’re on a Professional or Team plan, your base monthly credits roll over to the next month - as long as your subscription stays active. You can accumulate up to 3x your monthly credit amount. After that, any unused credits above the limit will expire. Starter and Free plans don’t include rollover. Any additional credits purchased through top-ups continue to roll over for 12 months from the purchase date."
    },
    {
        question: "Can I use Weavy creations for client work and commercial projects?",
        answer: "Absolutely! We offer one of the most advanced commercial rights policies in the industry. Weavy as a platform provides full commercial rights and we never train on your work. Most models available through our platform are cleared for commercial use and don't train on customer data. As an open platform, we also give you access to cutting-edge models that may have different terms. We negotiate the best legal and commercial terms available with all providers for your benefit."
    },
    {
        question: "How does Weavy handle my data and creations?",
        answer: "Your creative work stays yours. We don't use your images or prompts to train our platform. We implement strict data standards and security measures to protect your content. We only collect essential data to provide our services and anonymous metadata about workflows to improve recommendations."
    },
    {
        question: "What is Weavy's refund and cancellation policy?",
        answer: "You may elect not to renew a subscription by giving notice of cancellation to Figma before the end of the current subscription term. You can give notice of cancellation through your Figma Weave account settings. Please note that any cancellation will take effect at the end of the the current subscription term. Fees paid are non-refundable and quantities purchased cannot be decreased during the relevant subscription term."
    },
    {
        question: "Does Weavy provide workshops and training?",
        answer: "Yes! We provide free office hours, a comprehensive VOD library of educational content, and a template library filled with incredible workflows to jumpstart your creative process. Enterprise clients get team training sessions. Contact us directly if you have a specific training or educational need."
    },
    {
        question: "Can I control how my team uses credits?",
        answer: "Yes! With the Team plan, you get access to our Credits Management system.Set a monthly default or custom allocation per user, track usage in real time, and stay in control."
    },
    {
        question: "Still have questions?",
        answer: (
            <span>
                We&apos;re here to help! Reach out to us at{" "}
                <Link href="mailto:support@weavy.ai" className="text-blue-600 hover:underline">
                    support@weavy.ai
                </Link>{" "}
                and our team will get back to you promptly.
            </span>
        )
    }
];

export default function PricingFAQ() {
    const [openIndex, setOpenIndex] = useState<number | null>(null);

    const toggleFAQ = (index: number) => {
        setOpenIndex(openIndex === index ? null : index);
    };

    return (
        <div className="w-full max-w-3xl mx-auto px-4 py-20">
            <h2 className="text-4xl font-normal text-center mb-12 text-black tracking-tight">
                Frequently asked questions
            </h2>
            <div className="space-y-4">
                {FAQS.map((faq, index) => (
                    <div
                        key={index}
                        className="border-b border-black/10 last:border-0"
                    >
                        <button
                            className="w-full py-6 flex items-center justify-between text-left focus:outline-none group"
                            onClick={() => toggleFAQ(index)}
                        >
                            <span className="text-lg font-medium text-gray-900 group-hover:text-black transition-colors">
                                {faq.question}
                            </span>
                            <span className={`transform transition-transform duration-200 ${openIndex === index ? 'rotate-180' : ''}`}>
                                <svg className="w-6 h-6 text-gray-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M19 9l-7 7-7-7" />
                                </svg>
                            </span>
                        </button>
                        <div
                            className={`overflow-hidden transition-[max-height,opacity] duration-300 ease-in-out ${openIndex === index ? 'max-h-96 opacity-100 pb-6' : 'max-h-0 opacity-0'
                                }`}
                        >
                            <p className="text-gray-600 leading-relaxed pr-8">
                                {faq.answer}
                            </p>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
}
