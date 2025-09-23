import { Facebook, Linkedin, Mail, MapPin, Phone, Twitter, Youtube } from 'lucide-react';

export default function Footer() {
    const currentYear = new Date().getFullYear();

    const socialLinks = [
        { icon: Facebook, href: '#', label: 'Facebook' },
        { icon: Twitter, href: '#', label: 'Twitter' },
        { icon: Youtube, href: '#', label: 'YouTube' },
        { icon: Linkedin, href: '#', label: 'LinkedIn' },
    ];

    return (
        <footer className="border-t border-[#19140035]/20 bg-[#FDFDFC]/80 backdrop-blur-sm dark:border-[#3E3E3A]/30 dark:bg-[#0a0a0a]/80">
            <div className="mx-auto max-w-6xl px-6 py-16">
                <div className="flex w-full flex-col justify-between gap-10 lg:flex-row lg:items-start">
                    {/* Left Section - Logo and Description */}
                    <div className="flex w-full flex-col justify-between gap-6 lg:max-w-md">
                        {/* Logo Section */}
                        <div className="flex items-center gap-3">
                            <img src="/assets/img/unifast.png" alt="UNIFAST Logo" className="h-8 w-auto object-contain" />
                            <img src="/assets/img/ched-logo.png" alt="CHED Logo" className="h-8 w-auto object-contain" />
                            <div className="text-lg font-semibold text-foreground">UniFAST BARMM</div>
                        </div>

                        {/* Description */}
                        <p className="max-w-md text-sm leading-relaxed text-muted-foreground">
                            Empowering Filipino students through accessible higher education. Your feedback helps us improve our services and support
                            your academic journey.
                        </p>

                        {/* Contact Info */}
                        <div className="space-y-2 text-sm text-muted-foreground">
                            <div className="flex items-center gap-2">
                                <Mail className="h-4 w-4" />
                                <span>support@unifast.gov.ph</span>
                            </div>
                            <div className="flex items-center gap-2">
                                <Phone className="h-4 w-4" />
                                <span>(02) 8441-1171</span>
                            </div>
                            <div className="flex items-center gap-2">
                                <MapPin className="h-4 w-4" />
                                <span>Quezon City, Philippines</span>
                            </div>
                        </div>

                        {/* Social Links */}
                        <ul className="flex items-center space-x-4">
                            {socialLinks.map((social, idx) => {
                                const IconComponent = social.icon;
                                return (
                                    <li key={idx} className="text-muted-foreground transition-colors hover:text-primary">
                                        <a href={social.href} aria-label={social.label}>
                                            <IconComponent className="h-5 w-5" />
                                        </a>
                                    </li>
                                );
                            })}
                        </ul>
                    </div>

                    {/* Right Section - About only (pinned to right edge) */}
                    <div className="w-full lg:ml-auto lg:w-auto">
                        <h3 className="mb-4 font-semibold text-foreground">About</h3>
                        <ul className="space-y-3 text-sm">
                            <li className="text-muted-foreground transition-colors hover:text-primary">
                                <a href="#">UNIFAST</a>
                            </li>
                            <li className="text-muted-foreground transition-colors hover:text-primary">
                                <a href="#">CHED</a>
                            </li>
                            <li className="text-muted-foreground transition-colors hover:text-primary">
                                <a href="#">Our Mission</a>
                            </li>
                            <li className="text-muted-foreground transition-colors hover:text-primary">
                                <a href="#">Contact Us</a>
                            </li>
                        </ul>
                    </div>
                </div>

                {/* Bottom Section - Copyright only */}
                <div className="mt-12 border-t border-[#19140035]/20 pt-8 text-xs text-muted-foreground dark:border-[#3E3E3A]/30">
                    © {currentYear} UNIFAST & CHED. All rights reserved.
                </div>
            </div>
        </footer>
    );
}
