import { Mail, Phone, MapPin, Facebook, Twitter, Linkedin, Youtube } from 'lucide-react';

export default function Footer() {
    const currentYear = new Date().getFullYear();

    const sections = [
        {
            title: "Survey",
            links: [
                { name: "Submit Feedback", href: "#" },
                { name: "Survey Guidelines", href: "#" },
                { name: "FAQ", href: "#" },
                { name: "Help Center", href: "#" },
            ],
        },
        {
            title: "About",
            links: [
                { name: "UNIFAST", href: "#" },
                { name: "CHED", href: "#" },
                { name: "Our Mission", href: "#" },
                { name: "Contact Us", href: "#" },
            ],
        },
        {
            title: "Resources",
            links: [
                { name: "Student Portal", href: "#" },
                { name: "School Directory", href: "#" },
                { name: "Scholarship Info", href: "#" },
                { name: "Updates", href: "#" },
            ],
        },
    ];

    const socialLinks = [
        { icon: Facebook, href: "#", label: "Facebook" },
        { icon: Twitter, href: "#", label: "Twitter" },
        { icon: Youtube, href: "#", label: "YouTube" },
        { icon: Linkedin, href: "#", label: "LinkedIn" },
    ];

    const legalLinks = [
        { name: "Privacy Policy", href: "#" },
        { name: "Terms of Service", href: "#" },
        { name: "Data Protection", href: "#" },
    ];

    return (
        <footer className="bg-[#FDFDFC]/80 dark:bg-[#0a0a0a]/80 border-t border-[#19140035]/20 dark:border-[#3E3E3A]/30 backdrop-blur-sm">
            <div className="max-w-6xl mx-auto px-6 py-16">
                <div className="flex w-full flex-col justify-between gap-10 lg:flex-row lg:items-start">

                    {/* Left Section - Logo and Description */}
                    <div className="flex w-full flex-col justify-between gap-6 lg:max-w-md">
                        {/* Logo Section */}
                        <div className="flex items-center gap-3">
                            <div className="flex items-center gap-3">
                                <img
                                    src="/assets/img/unifast.png"
                                    alt="UNIFAST Logo"
                                    className="h-8 w-auto object-contain"
                                />
                                <img
                                    src="/assets/img/ched-logo.png"
                                    alt="CHED Logo"
                                    className="h-8 w-auto object-contain"
                                />
                                <div className="text-lg font-semibold text-foreground">
                                    UniFAST BARMM
                                </div>
                            </div>
                        </div>

                        {/* Description */}
                        <p className="text-muted-foreground text-sm leading-relaxed max-w-md">
                            Empowering Filipino students through accessible higher education.
                            Your feedback helps us improve our services and support your academic journey.
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
                                    <li key={idx} className="text-muted-foreground hover:text-primary transition-colors">
                                        <a href={social.href} aria-label={social.label}>
                                            <IconComponent className="h-5 w-5" />
                                        </a>
                                    </li>
                                );
                            })}
                        </ul>
                    </div>

                    {/* Right Section - Links */}
                    <div className="grid w-full gap-8 md:grid-cols-3 lg:gap-12 lg:max-w-2xl">
                        {sections.map((section, sectionIdx) => (
                            <div key={sectionIdx}>
                                <h3 className="mb-4 font-semibold text-foreground">{section.title}</h3>
                                <ul className="space-y-3 text-sm">
                                    {section.links.map((link, linkIdx) => (
                                        <li key={linkIdx} className="text-muted-foreground hover:text-primary transition-colors">
                                            <a href={link.href}>{link.name}</a>
                                        </li>
                                    ))}
                                </ul>
                            </div>
                        ))}
                    </div>
                </div>

                {/* Bottom Section - Copyright and Legal */}
                <div className="mt-12 flex flex-col justify-between gap-4 border-t border-[#19140035]/20 dark:border-[#3E3E3A]/30 pt-8 text-xs text-muted-foreground md:flex-row md:items-center">
                    <p className="order-2 md:order-1">
                        © {currentYear} UNIFAST & CHED. All rights reserved.
                    </p>
                    <ul className="order-1 flex flex-col gap-2 md:order-2 md:flex-row md:gap-6">
                        {legalLinks.map((link, idx) => (
                            <li key={idx} className="hover:text-primary transition-colors">
                                <a href={link.href}>{link.name}</a>
                            </li>
                        ))}
                    </ul>
                </div>
            </div>
        </footer>
    );
}
