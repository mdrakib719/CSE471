import { Link } from "react-router-dom";
import { GraduationCap, Facebook, Twitter, Instagram, Linkedin, Mail, Phone, MapPin } from "lucide-react";

const Footer = () => {
  return (
    <footer className="bg-gradient-to-r from-primary to-primary-dark text-primary-foreground">
      <div className="container mx-auto px-4 py-12">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
          {/* Brand Section */}
          <div className="space-y-4">
            <div className="flex items-center space-x-3">
              <img src="/favicon.svg" alt="BRACU Logo" className="h-8 w-8" />
              <div>
                <h3 className="text-xl font-bold">BRACU SAM Portal</h3>
                <p className="text-sm text-primary-foreground/80">Student Activity Management Portal</p>
              </div>
            </div>
            <p className="text-primary-foreground/90 text-sm leading-relaxed">
              The official student activity portal for BRAC University, connecting students and fostering campus community.
            </p>
            <div className="flex space-x-3">
              <a href="https://www.facebook.com/BRACUniversity" className="bg-white/10 hover:bg-white/20 p-2 rounded-lg transition-all duration-200 hover:scale-110">
                <Facebook className="h-4 w-4" />
              </a>
              <a href="https://x.com/i/flow/login?redirect_after_login=%2Fbracuniversity" className="bg-white/10 hover:bg-white/20 p-2 rounded-lg transition-all duration-200 hover:scale-110">
                <Twitter className="h-4 w-4" />
              </a>
              <a href="https://www.instagram.com/bracuniversity/?hl=en" className="bg-white/10 hover:bg-white/20 p-2 rounded-lg transition-all duration-200 hover:scale-110">
                <Instagram className="h-4 w-4" />
              </a>
              <a href="https://www.linkedin.com/school/58028/" className="bg-white/10 hover:bg-white/20 p-2 rounded-lg transition-all duration-200 hover:scale-110">
                <Linkedin className="h-4 w-4" />
              </a>
            </div>
          </div>

          {/* Quick Links */}
          <div className="space-y-4">
            <h4 className="text-lg font-semibold">Quick Links</h4>
            <ul className="space-y-2">
              {[
                { name: "Clubs", href: "/clubs" },
                { name: "Events", href: "/events" },
                { name: "Forums", href: "/forum" },
                { name: "Resources", href: "/resources" },
              ].map((link) => (
                <li key={link.name}>
                  <Link 
                    to={link.href} 
                    className="text-primary-foreground/80 hover:text-primary-foreground transition-colors duration-200 text-sm hover:underline"
                  >
                    {link.name}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Services */}
          <div className="space-y-4">
            <h4 className="text-lg font-semibold">Services</h4>
            <ul className="space-y-2">
              {[
                "Club Management",
                "Event Planning",
                "Academic Resources",
                "Career Services",
                "Student Support",
              ].map((service) => (
                <li key={service}>
                  <span className="text-primary-foreground/80 text-sm">{service}</span>
                </li>
              ))}
            </ul>
          </div>

          {/* Contact Info */}
          <div className="space-y-4">
            <h4 className="text-lg font-semibold">Contact Us</h4>
            <div className="space-y-3">
              <div className="flex items-center space-x-3">
                <div className="bg-white/10 p-1.5 rounded-md">
                  <Mail className="h-4 w-4" />
                </div>
                <span className="text-primary-foreground/80 text-sm">info@bracu.ac.bd</span>
              </div>
              <div className="flex items-center space-x-3">
                <div className="bg-white/10 p-1.5 rounded-md">
                  <Phone className="h-4 w-4" />
                </div>
                <span className="text-primary-foreground/80 text-sm">+88 09638464646</span>
              </div>
              <div className="flex items-center space-x-3">
                <div className="bg-white/10 p-1.5 rounded-md">
                  <MapPin className="h-4 w-4" />
                </div>
                <span className="text-primary-foreground/80 text-sm">Kha 224 Pragati Sarani, Merul Badda , Dhaka 1212, Bangladesh</span>
              </div>
            </div>
          </div>
        </div>

        {/* Bottom Bar */}
        <div className="border-t border-white/20 mt-8 pt-6 flex flex-col md:flex-row justify-between items-center">
          <p className="text-primary-foreground/70 text-sm">
            © 2025 BRAC University. All rights reserved.
          </p>
          <div className="flex space-x-6 mt-4 md:mt-0">
            <Link to="/privacy" className="text-primary-foreground/70 hover:text-primary-foreground text-sm transition-colors">
              Privacy Policy
            </Link>
            <Link to="/terms" className="text-primary-foreground/70 hover:text-primary-foreground text-sm transition-colors">
              Terms of Service
            </Link>
            <Link to="/help" className="text-primary-foreground/70 hover:text-primary-foreground text-sm transition-colors">
              Help Center
            </Link>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;