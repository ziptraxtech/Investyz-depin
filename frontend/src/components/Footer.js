import React from 'react';
import { Link } from 'react-router-dom';
import { Twitter, Facebook, Instagram, Mail } from 'lucide-react';
import BrandLogo from './BrandLogo';

const Footer = () => {
  const currentYear = new Date().getFullYear();

  const footerLinks = {
    product: [
      { name: 'Segments', href: '/segments' },
      { name: 'Investment Plans', href: '/segments' },
      { name: 'Dashboard', href: '/dashboard' },
    ],
    company: [
      { name: 'About Us', href: '/about' },
      { name: 'How It Works', href: '/#how-it-works' },
      { name: 'Blog', href: '/blog' },
    ],
    legal: [
      { name: 'Privacy Policy', href: '/privacy-policy', external: true },
      { name: 'Terms of Service', href: '/terms-of-service', external: true },
      { name: 'Risk Disclaimer', href: '/risk-disclaimer', external: true },
    ],
  };

  const socialLinks = [
    { name: 'Twitter', icon: Twitter, href: '#' },
    { name: 'Facebook', icon: Facebook, href: '#' },
    { name: 'Instagram', icon: Instagram, href: '#' },
    { name: 'Email', icon: Mail, href: 'mailto:investyzasset@gmail.com' },
  ];

  return (
    <footer className="bg-muted/30 border-t border-border">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 md:py-16">
        <div className="grid grid-cols-2 md:grid-cols-5 gap-8">
          <div className="col-span-2 md:col-span-2">
            <BrandLogo className="mb-4" frameClassName="h-11 w-[180px]" />
            <div className="text-sm text-muted-foreground mb-6 max-w-xs space-y-2">
              <p className="font-semibold text-foreground">ZIPTRAX CLEANTECH PRIVATE LIMITED</p>
              <p className="font-semibold text-foreground">CIN: U74999DL2016PTC309316</p>
              <p>H No. 24, Gujar Gali, Mohalla, Chandan Hola, Chhatarpur, New Delhi, Delhi 110074</p>
              <p>Email : investyzasset@gmail.com &amp; hello@ziptrax.in</p>
            </div>
            <div className="flex gap-3">
              {socialLinks.map((social) => (
                <a
                  key={social.name}
                  href={social.href}
                  className="p-2 rounded-lg bg-muted hover:bg-muted/80 text-muted-foreground hover:text-foreground transition-colors"
                  aria-label={social.name}
                  data-testid={`footer-social-${social.name.toLowerCase()}`}
                >
                  <social.icon className="h-5 w-5" />
                </a>
              ))}
            </div>
          </div>

          <div>
            <h4 className="font-semibold mb-4 font-['Outfit'] text-foreground">Product</h4>
            <ul className="space-y-3">
              {footerLinks.product.map((link) => (
                <li key={link.name}>
                  <Link
                    to={link.href}
                    className="text-sm text-muted-foreground hover:text-foreground transition-colors"
                  >
                    {link.name}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          <div>
            <h4 className="font-semibold mb-4 font-['Outfit'] text-foreground">Company</h4>
            <ul className="space-y-3">
              {footerLinks.company.map((link) => (
                <li key={link.name}>
                  <Link
                    to={link.href}
                    className="text-sm text-muted-foreground hover:text-foreground transition-colors"
                  >
                    {link.name}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          <div>
            <h4 className="font-semibold mb-4 font-['Outfit'] text-foreground">Legal</h4>
            <ul className="space-y-3">
              {footerLinks.legal.map((link) => (
                <li key={link.name}>
                  {link.external ? (
                    <a
                      href={link.href}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-sm text-muted-foreground hover:text-foreground transition-colors"
                    >
                      {link.name}
                    </a>
                  ) : (
                    <Link
                      to={link.href}
                      className="text-sm text-muted-foreground hover:text-foreground transition-colors"
                    >
                      {link.name}
                    </Link>
                  )}
                </li>
              ))}
            </ul>
          </div>
        </div>

        <div className="mt-12 pt-8 border-t border-border flex flex-col md:flex-row justify-between items-center gap-4">
          <p className="text-sm text-muted-foreground">
            Copyright {currentYear} Investyz. All rights reserved.
          </p>
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <span>Powered by</span>
            <span className="font-semibold text-foreground">Polygon</span>
            <div className="w-4 h-4 rounded-full bg-gradient-to-r from-teal-400 to-cyan-400" />
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
