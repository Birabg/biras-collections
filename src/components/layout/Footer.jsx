import { Link } from 'react-router-dom';
import { Mail } from 'lucide-react';

// Simple SVG social icons
const InstagramIcon = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5} className="h-5 w-5" aria-hidden="true">
    <rect x="2" y="2" width="20" height="20" rx="5" ry="5" />
    <path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z" />
    <circle cx="17.5" cy="6.5" r="1" />
  </svg>
);

const TwitterIcon = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5} className="h-5 w-5" aria-hidden="true">
    <path d="M23 3a10.9 10.9 0 0 1-3.14 1.53 4.48 4.48 0 0 0-7.86 3v1A10.66 10.66 0 0 1 3 4s-4 9 5 13a11.64 11.64 0 0 1-7 2c9 5 20 0 20-11.5a4.5 4.5 0 0 0-.08-.83A7.72 7.72 0 0 0 23 3z" />
  </svg>
);

const FacebookIcon = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5} className="h-5 w-5" aria-hidden="true">
    <path d="M18 2h-3a5 5 0 0 0-5 5v3H7v4h3v8h4v-8h3l1-4h-4V7a1 1 0 0 1 1-1h3z" />
  </svg>
);

const footerLinks = {
  shop: [
    { label: 'Women', href: '/shop?category=women' },
    { label: 'Men', href: '/shop?category=men' },
    { label: 'Accessories', href: '/shop?category=accessories' },
    { label: 'New Arrivals', href: '/shop?new=true' },
  ],
  help: [
    { label: 'Contact', href: '/contact' },
    { label: 'Shipping', href: '/shipping' },
    { label: 'Returns', href: '/returns' },
    { label: 'FAQ', href: '/faq' },
  ],
  company: [
    { label: 'About', href: '/about' },
    { label: 'Our Story', href: '/our-story' },
    { label: 'Privacy Policy', href: '/privacy' },
    { label: 'Terms', href: '/terms' },
  ],
};

const socialLinks = [
  { label: 'Instagram', href: 'https://instagram.com', icon: InstagramIcon },
  { label: 'Twitter', href: 'https://twitter.com', icon: TwitterIcon },
  { label: 'Facebook', href: 'https://facebook.com', icon: FacebookIcon },
];

export default function Footer() {
  return (
    <footer className="bg-black text-white" role="contentinfo">
      <div className="mx-auto max-w-7xl px-5 py-14 lg:px-8 lg:py-20">
        <div className="grid gap-12 md:grid-cols-2 lg:grid-cols-5">
          {/* Brand */}
          <div className="lg:col-span-2 xl:col-span-2">
            <Link to="/" className="text-xl font-semibold tracking-tight" aria-label="Bira's Collections Home">
              Bira's <span className="font-normal">Collections</span>
            </Link>
            <p className="mt-4 max-w-sm text-sm leading-6 text-white/50">
              Modern fashion, carefully selected for your everyday style.
            </p>

            {/* Newsletter in footer */}
            <div className="mt-8 max-w-sm">
              <p className="text-xs font-semibold uppercase tracking-[0.25em] text-white/60 mb-3">
                Join our community
              </p>
              <form className="flex gap-2" onSubmit={(e) => e.preventDefault()}>
                <label htmlFor="footer-email" className="sr-only">Email address</label>
                <input
                  id="footer-email"
                  type="email"
                  placeholder="Your email"
                  className="flex-1 h-11 px-4 text-sm bg-white/5 border border-white/10 rounded-md text-white placeholder:text-white/40 focus:outline-none focus:ring-2 focus:ring-white focus:border-transparent"
                  aria-label="Email address for newsletter"
                />
                <button
                  type="submit"
                  className="h-11 px-5 bg-white text-black text-sm font-medium rounded-md hover:bg-gray-200 transition-colors"
                >
                  Subscribe
                </button>
              </form>
              <p className="mt-3 text-xs text-white/40">Unsubscribe anytime. <a href="/privacy" className="underline hover:text-white">Privacy Policy</a></p>
            </div>
          </div>

          {/* Shop */}
          <nav aria-labelledby="shop-heading">
            <h3 id="shop-heading" className="text-sm font-semibold uppercase tracking-[0.1em] mb-5">
              Shop
            </h3>
            <ul className="flex flex-col gap-3 text-sm text-white/50">
              {footerLinks.shop.map((link) => (
                <li key={link.label}>
                  <Link to={link.href} className="hover:text-white transition-colors">
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </nav>

          {/* Help */}
          <nav aria-labelledby="help-heading">
            <h3 id="help-heading" className="text-sm font-semibold uppercase tracking-[0.1em] mb-5">
              Help
            </h3>
            <ul className="flex flex-col gap-3 text-sm text-white/50">
              {footerLinks.help.map((link) => (
                <li key={link.label}>
                  <Link to={link.href} className="hover:text-white transition-colors">
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </nav>

          {/* Company */}
          <nav aria-labelledby="company-heading">
            <h3 id="company-heading" className="text-sm font-semibold uppercase tracking-[0.1em] mb-5">
              Company
            </h3>
            <ul className="flex flex-col gap-3 text-sm text-white/50">
              {footerLinks.company.map((link) => (
                <li key={link.label}>
                  <Link to={link.href} className="hover:text-white transition-colors">
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </nav>
        </div>

        {/* Social & Copyright */}
        <div className="mt-12 border-t border-white/10 pt-6">
          <div className="flex flex-col md:flex-row items-center justify-between gap-6">
            <div className="flex items-center gap-5">
              {socialLinks.map((social) => (
                <a
                  key={social.label}
                  href={social.href}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-white/40 hover:text-white transition-colors"
                  aria-label={social.label}
                >
                  <social.icon size={20} strokeWidth={1.5} aria-hidden="true" />
                </a>
              ))}
            </div>

            <p className="text-xs text-white/40 text-center md:text-left">
              © {new Date().getFullYear()} Bira's Collections. All rights reserved.
            </p>

            <div className="flex items-center gap-5 text-sm text-white/50">
              <Link to="/shipping" className="hover:text-white transition-colors">Shipping</Link>
              <Link to="/returns" className="hover:text-white transition-colors">Returns</Link>
              <Link to="/faq" className="hover:text-white transition-colors">FAQ</Link>
              <Link to="/contact" className="hover:text-white transition-colors">Contact</Link>
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
}