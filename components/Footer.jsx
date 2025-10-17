
"use client";
import Link from "next/link";
import { motion } from "framer-motion";
import { 
  Mail, Phone, MapPin, 
  Facebook, Twitter, Instagram, Linkedin, Youtube,
  BookOpen, Users, Award, Globe
} from "lucide-react";

export default function Footer() {
  const currentYear = new Date().getFullYear();

  return (
    <footer className="bg-gradient-to-br from-slate-900 via-blue-900 to-slate-900 mt-[-128px] text-white relative overflow-hidden text-sm">
      {/* Background */}
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_30%_20%,rgba(59,130,246,0.1)_0%,transparent_50%)]"></div>
      <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-cyan-400 via-blue-500 to-purple-600"></div>
      
      <div className="relative z-10">
        {/* Main content */}
        <div className="max-w-7xl mx-auto px-3 sm:px-6 lg:px-8 py-6 sm:py-10 lg:py-16">
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4 sm:gap-8 lg:gap-12">
            
            {/* Company Info */}
            <motion.div 
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6 }}
            >
              <div className="flex items-center mb-3 sm:mb-5">
                <div className="w-8 h-8 sm:w-10 sm:h-10 bg-gradient-to-r from-cyan-400 to-blue-500 rounded-lg flex items-center justify-center mr-2 sm:mr-3">
                  <BookOpen className="w-4 h-4 sm:w-5 sm:h-5 text-white" />
                </div>
                <h3 className="text-lg sm:text-2xl font-bold bg-gradient-to-r from-cyan-400 to-blue-500 bg-clip-text text-transparent">
                  VAWE LMS
                </h3>
              </div>
              <p className="text-slate-300 mb-4 sm:mb-6 leading-relaxed text-xs sm:text-base">
                Empowering students with cutting-edge learning technology. 
              </p>
              
              {/* Social Links */}
              <div className="grid grid-cols-3 gap-3 sm:flex sm:flex-wrap sm:gap-4">
                {[
                  { icon: Facebook, href: "#", label: "Facebook" },
                  { icon: Twitter, href: "#", label: "Twitter" },
                  { icon: Instagram, href: "#", label: "Instagram" },
                  { icon: Linkedin, href: "#", label: "LinkedIn" },
                  { icon: Youtube, href: "#", label: "YouTube" }
                ].map((social, index) => (
                  <motion.a
                    key={social.label}
                    href={social.href}
                    className="w-8 h-8 sm:w-10 sm:h-10 bg-white/10 hover:bg-gradient-to-r hover:from-cyan-400 hover:to-blue-500 rounded-lg flex items-center justify-center transition-all duration-300 group"
                    whileHover={{ scale: 1.1, y: -2 }}
                    whileTap={{ scale: 0.95 }}
                    initial={{ opacity: 0, y: 20 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.6, delay: index * 0.1 }}
                  >
                    <social.icon className="w-4 h-4 sm:w-5 sm:h-5 text-slate-300 group-hover:text-white transition-colors" />
                  </motion.a>
                ))}
              </div>
            </motion.div>

            {/* Quick Links */}
            <motion.div 
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.2 }}
            >
              <h4 className="text-base sm:text-xl font-semibold mb-2 sm:mb-4 text-white">Quick Links</h4>
              <ul className="space-y-1 sm:space-y-2">
                {[
                  { name: "Courses", href: "/courses" },
                  { name: "Dashboard", href: "/dashboard" },
                  { name: "Practice", href: "/practice" },
                  { name: "Assignments", href: "/assignments" },
                  { name: "Compiler", href: "/compiler" }
                ].map((link, index) => (
                  <motion.li
                    key={link.name}
                    initial={{ opacity: 0, x: -20 }}
                    whileInView={{ opacity: 1, x: 0 }}
                    transition={{ duration: 0.6, delay: index * 0.1 }}
                  >
                    <Link 
                      href={link.href}
                      className="text-slate-300 hover:text-cyan-400 transition-colors flex items-center text-xs sm:text-base"
                    >
                      {link.name}
                    </Link>
                  </motion.li>
                ))}
              </ul>
            </motion.div>

            {/* Resources */}
            <motion.div 
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.4 }}
            >
              <h4 className="text-base sm:text-xl font-semibold mb-2 sm:mb-4 text-white">Resources</h4>
              <ul className="space-y-1 sm:space-y-2">
                {[
                  { name: "About Us", href: "/about", icon: Users },
                  { name: "Pricing Details", href: "/pricing", icon: Award },
                  { name: "Contact Us", href: "/contact", icon: Globe },
                  { name: "Blog", href: "/blog", icon: BookOpen },
                  { name: "Cancellation Policy", href: "/cancellation-policy", icon: Users }
                ].map((resource, index) => (
                  <motion.li
                    key={resource.name}
                    initial={{ opacity: 0, x: -20 }}
                    whileInView={{ opacity: 1, x: 0 }}
                    transition={{ duration: 0.6, delay: index * 0.1 }}
                  >
                    <Link 
                      href={resource.href}
                      className="text-slate-300 hover:text-cyan-400 flex items-center text-xs sm:text-base"
                    >
                      <resource.icon className="w-4 h-4 mr-2 text-cyan-400" />
                      {resource.name}
                    </Link>
                  </motion.li>
                ))}
              </ul>
            </motion.div>

            {/* Contact Info */}
            <motion.div 
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.6 }}
            >
              <h4 className="text-base sm:text-xl font-semibold mb-2 sm:mb-4 text-white">Contact Us</h4>
              <div className="space-y-2 sm:space-y-3">
                {[
                  { icon: Mail, text: "info@vawelms.com", href: "mailto:info@vawelms.com" },
                  { icon: Phone, text: "8885103333", href: "tel:8885103333" },
                  { icon: MapPin, text: "Vijayawada, Andhra Pradesh, India", href: "#" }
                ].map((contact, index) => (
                  <motion.a
                    key={contact.text}
                    href={contact.href}
                    className="flex items-start text-slate-300 hover:text-cyan-400 transition-colors"
                    initial={{ opacity: 0, x: -20 }}
                    whileInView={{ opacity: 1, x: 0 }}
                    transition={{ duration: 0.6, delay: index * 0.1 }}
                  >
                    <contact.icon className="w-4 h-4 mr-2 text-cyan-400" />
                    <span className="text-xs sm:text-base">{contact.text}</span>
                  </motion.a>
                ))}
              </div>

              {/* Newsletter */}
              <div className="mt-4 sm:mt-6">
                <h5 className="text-xs sm:text-sm font-medium mb-2 text-white">Stay Updated</h5>
                <div className="flex w-full">
                  <input
                    type="email"
                    placeholder="Enter your email"
                    className="flex-1 px-2 py-1 sm:px-3 sm:py-2 bg-white/10 border border-white/20 rounded-l-lg text-white placeholder-slate-400 focus:outline-none focus:border-cyan-400 text-xs sm:text-sm"
                  />
                  <button className="px-3 sm:px-4 py-1 sm:py-2 bg-gradient-to-r from-cyan-400 to-blue-500 hover:from-cyan-500 hover:to-blue-600 rounded-r-lg transition-all">
                    <Mail className="w-4 h-4 sm:w-5 sm:h-5" />
                  </button>
                </div>
              </div>
            </motion.div>
          </div>
        </div>

        {/* Bottom bar */}
        <div className="border-t border-white/10">
          <div className="max-w-7xl mx-auto px-3 sm:px-6 py-3 sm:py-4 flex flex-col sm:flex-row justify-between items-center gap-2 sm:gap-3">
            <motion.p 
              className="text-slate-400 text-[10px] sm:text-sm text-center sm:text-left"
              initial={{ opacity: 0 }}
              whileInView={{ opacity: 1 }}
              transition={{ duration: 0.6 }}
            >
              © {currentYear} VAWE LMS. All rights reserved.
            </motion.p>
            
            {/* Hidden SEO Keywords for Search Engines */}
            <div className="hidden">
              <p>Software training institutes in Vijayawada, best software training institute in Vijayawada, 
              programming courses in Vijayawada, software courses in Vijayawada, web development training Vijayawada, 
              python training Vijayawada, java training Vijayawada, software coaching in Vijayawada, 
              learning management system provider in India, best LMS software for colleges in India, 
              training management software Vijayawada, e-learning software for institutes, 
              corporate LMS solutions in India, placement assistance Vijayawada</p>
            </div>
            
            <motion.div 
              className="flex flex-wrap justify-center sm:justify-end gap-3 text-[11px] sm:text-sm"
              initial={{ opacity: 0 }}
              whileInView={{ opacity: 1 }}
              transition={{ duration: 0.6, delay: 0.2 }}
            >
              {[
                { name: "Privacy Policy", href: "/privacy" },
                { name: "Terms of Service", href: "/terms" },
                { name: "Sitemap", href: "/sitemap" }
              ].map((link) => (
                <Link
                  key={link.name}
                  href={link.href}
                  className="text-slate-400 hover:text-cyan-400 transition-colors"
                >
                  {link.name}
                </Link>
              ))}
            </motion.div>
          </div>
        </div>
      </div>
    </footer>
  );
}
