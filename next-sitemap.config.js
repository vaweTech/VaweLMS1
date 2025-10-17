/** @type {import('next-sitemap').IConfig} */
module.exports = {
  siteUrl: 'https://www.skillwins.in',
  generateRobotsTxt: true,
  generateIndexSitemap: false,
  exclude: ['/Admin/*', '/api/*', '/auth/*', '/forgot-password', '/reset-password'],
  robotsTxtOptions: {
    policies: [
      {
        userAgent: '*',
        allow: '/',
        disallow: ['/Admin/', '/api/', '/auth/', '/forgot-password', '/reset-password'],
      },
    ],
    additionalSitemaps: [
      'https://www.skillwins.in/sitemap.xml',
    ],
  },
  transform: async (config, path) => {
    // Custom priority and changefreq based on path
    let priority = 0.7;
    let changefreq = 'weekly';

    if (path === '/') {
      priority = 1.0;
      changefreq = 'daily';
    } else if (path.includes('/courses')) {
      priority = 0.9;
      changefreq = 'weekly';
    } else if (path.includes('/blog')) {
      priority = 0.8;
      changefreq = 'weekly';
    } else if (path.includes('/about') || path.includes('/contact') || path.includes('/placement')) {
      priority = 0.8;
      changefreq = 'monthly';
    } else if (path.includes('/privacy') || path.includes('/terms')) {
      priority = 0.5;
      changefreq = 'yearly';
    }

    return {
      loc: path,
      changefreq,
      priority,
      lastmod: new Date().toISOString(),
    };
  },
};
