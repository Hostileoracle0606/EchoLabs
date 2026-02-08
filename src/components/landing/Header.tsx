'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { motion, AnimatePresence } from 'framer-motion';
import { Menu, X } from 'lucide-react';

const navLinks = [
    { label: 'How It Works', href: '#how-it-works' },
    { label: 'Features', href: '#features' },
    { label: 'The Aura', href: '#aura' },
];

export function Header() {
    const [isScrolled, setIsScrolled] = useState(false);
    const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

    useEffect(() => {
        const handleScroll = () => {
            setIsScrolled(window.scrollY > 20);
        };

        window.addEventListener('scroll', handleScroll);
        return () => window.removeEventListener('scroll', handleScroll);
    }, []);

    return (
        <>
            <header
                className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${isScrolled ? 'glass py-3' : 'py-5'
                    }`}
            >
                <div className="container-narrow flex items-center justify-between">
                    {/* Logo */}
                    <Link href="/" className="inline-flex items-center gap-2 group">
                        <motion.div
                            className="w-9 h-9 rounded-xl bg-gradient-to-br from-[var(--accent-primary)] to-[var(--accent-secondary)] flex items-center justify-center"
                            whileHover={{ scale: 1.05 }}
                            whileTap={{ scale: 0.95 }}
                        >
                            <span className="text-white font-bold">E</span>
                        </motion.div>
                        <span className="text-xl font-semibold text-[var(--foreground)] group-hover:text-gradient-accent transition-all">
                            EchoLens
                        </span>
                    </Link>

                    {/* Desktop Nav */}
                    <nav className="hidden md:flex items-center gap-8">
                        {navLinks.map((link) => (
                            <Link
                                key={link.label}
                                href={link.href}
                                className="text-sm text-[var(--foreground-muted)] hover:text-[var(--foreground)] transition-colors"
                            >
                                {link.label}
                            </Link>
                        ))}
                    </nav>

                    {/* Desktop Auth */}
                    <div className="hidden md:flex items-center gap-3">
                        <Link
                            href="/sign-in"
                            className="text-sm text-[var(--foreground-muted)] hover:text-[var(--foreground)] transition-colors px-4 py-2"
                        >
                            Sign In
                        </Link>
                        <Link
                            href="/sign-up"
                            className="btn-primary text-sm py-2.5 px-5"
                        >
                            Get Started
                        </Link>
                    </div>

                    {/* Mobile Menu Button */}
                    <button
                        className="md:hidden p-2 text-[var(--foreground-muted)]"
                        onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
                        aria-label="Toggle menu"
                    >
                        {isMobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
                    </button>
                </div>
            </header>

            {/* Mobile Menu */}
            <AnimatePresence>
                {isMobileMenuOpen && (
                    <motion.div
                        initial={{ opacity: 0, y: -20 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -20 }}
                        className="fixed inset-0 z-40 md:hidden"
                    >
                        <div
                            className="absolute inset-0 bg-[var(--bg-primary)]/95 backdrop-blur-xl"
                            onClick={() => setIsMobileMenuOpen(false)}
                        />
                        <nav className="relative pt-24 px-6">
                            <div className="space-y-4">
                                {navLinks.map((link, index) => (
                                    <motion.div
                                        key={link.label}
                                        initial={{ opacity: 0, x: -20 }}
                                        animate={{ opacity: 1, x: 0 }}
                                        transition={{ delay: index * 0.1 }}
                                    >
                                        <Link
                                            href={link.href}
                                            className="block text-2xl font-medium text-[var(--foreground)] py-3"
                                            onClick={() => setIsMobileMenuOpen(false)}
                                        >
                                            {link.label}
                                        </Link>
                                    </motion.div>
                                ))}
                            </div>

                            <motion.div
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: 0.3 }}
                                className="mt-8 pt-8 border-t border-[var(--glass-border)] space-y-4"
                            >
                                <Link
                                    href="/sign-in"
                                    className="block text-center py-3 text-[var(--foreground-muted)]"
                                    onClick={() => setIsMobileMenuOpen(false)}
                                >
                                    Sign In
                                </Link>
                                <Link
                                    href="/sign-up"
                                    className="btn-primary block text-center"
                                    onClick={() => setIsMobileMenuOpen(false)}
                                >
                                    Get Started
                                </Link>
                            </motion.div>
                        </nav>
                    </motion.div>
                )}
            </AnimatePresence>
        </>
    );
}
