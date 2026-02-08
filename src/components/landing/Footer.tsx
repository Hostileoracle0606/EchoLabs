import Link from 'next/link';
import { Github, Twitter, Linkedin } from 'lucide-react';

export function Footer() {
    const currentYear = new Date().getFullYear();

    const links = {
        product: [
            { label: 'Features', href: '#features' },
            { label: 'How It Works', href: '#how-it-works' },
            { label: 'Pricing', href: '#pricing' },
            { label: 'Enterprise', href: '#enterprise' },
        ],
        company: [
            { label: 'About', href: '/about' },
            { label: 'Blog', href: '/blog' },
            { label: 'Careers', href: '/careers' },
            { label: 'Contact', href: '/contact' },
        ],
        legal: [
            { label: 'Privacy', href: '/privacy' },
            { label: 'Terms', href: '/terms' },
            { label: 'Security', href: '/security' },
        ],
    };

    const socials = [
        { icon: Twitter, href: 'https://twitter.com/echolens', label: 'Twitter' },
        { icon: Github, href: 'https://github.com/echolens', label: 'GitHub' },
        { icon: Linkedin, href: 'https://linkedin.com/company/echolens', label: 'LinkedIn' },
    ];

    return (
        <footer className="border-t border-[var(--glass-border)] py-16">
            <div className="container-narrow">
                <div className="grid grid-cols-2 md:grid-cols-5 gap-8 mb-12">
                    {/* Brand */}
                    <div className="col-span-2">
                        <Link href="/" className="inline-flex items-center gap-2 mb-4">
                            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-[var(--accent-primary)] to-[var(--accent-secondary)] flex items-center justify-center">
                                <span className="text-white font-bold text-sm">E</span>
                            </div>
                            <span className="text-xl font-semibold text-[var(--foreground)]">
                                EchoLens
                            </span>
                        </Link>
                        <p className="text-sm text-[var(--foreground-muted)] max-w-xs mb-4">
                            AI-powered presentation companion that transforms your voice into
                            stunning visualizations.
                        </p>
                        {/* Socials */}
                        <div className="flex items-center gap-3">
                            {socials.map((social) => (
                                <a
                                    key={social.label}
                                    href={social.href}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="w-9 h-9 rounded-lg glass flex items-center justify-center text-[var(--foreground-muted)] hover:text-[var(--foreground)] hover:bg-[var(--glass-hover)] transition-colors"
                                    aria-label={social.label}
                                >
                                    <social.icon className="w-4 h-4" />
                                </a>
                            ))}
                        </div>
                    </div>

                    {/* Links */}
                    <div>
                        <h4 className="text-sm font-semibold text-[var(--foreground)] mb-4">Product</h4>
                        <ul className="space-y-2">
                            {links.product.map((link) => (
                                <li key={link.label}>
                                    <Link
                                        href={link.href}
                                        className="text-sm text-[var(--foreground-muted)] hover:text-[var(--foreground)] transition-colors"
                                    >
                                        {link.label}
                                    </Link>
                                </li>
                            ))}
                        </ul>
                    </div>

                    <div>
                        <h4 className="text-sm font-semibold text-[var(--foreground)] mb-4">Company</h4>
                        <ul className="space-y-2">
                            {links.company.map((link) => (
                                <li key={link.label}>
                                    <Link
                                        href={link.href}
                                        className="text-sm text-[var(--foreground-muted)] hover:text-[var(--foreground)] transition-colors"
                                    >
                                        {link.label}
                                    </Link>
                                </li>
                            ))}
                        </ul>
                    </div>

                    <div>
                        <h4 className="text-sm font-semibold text-[var(--foreground)] mb-4">Legal</h4>
                        <ul className="space-y-2">
                            {links.legal.map((link) => (
                                <li key={link.label}>
                                    <Link
                                        href={link.href}
                                        className="text-sm text-[var(--foreground-muted)] hover:text-[var(--foreground)] transition-colors"
                                    >
                                        {link.label}
                                    </Link>
                                </li>
                            ))}
                        </ul>
                    </div>
                </div>

                {/* Bottom */}
                <div className="pt-8 border-t border-[var(--glass-border)] flex flex-col sm:flex-row items-center justify-between gap-4">
                    <p className="text-sm text-[var(--foreground-subtle)]">
                        © {currentYear} EchoLens. All rights reserved.
                    </p>
                    <p className="text-sm text-[var(--foreground-subtle)]">
                        Built with ❤️ for presenters everywhere
                    </p>
                </div>
            </div>
        </footer>
    );
}
