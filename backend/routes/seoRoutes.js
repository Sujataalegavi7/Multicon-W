const express = require('express');
const router = express.Router();
const Paper = require('../models/Paper');

/**
 * Escape special XML characters
 */
function escapeXml(unsafe) {
  if (!unsafe) return '';
  return unsafe
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;');
}

/**
 * GET /sitemap.xml
 * Dynamically generates a sitemap including static pages and all approved research papers
 */
router.get('/sitemap.xml', async (req, res) => {
  try {
    const rawClientUrl = process.env.CLIENT_URL || `${req.protocol}://${req.get('host')}`;
    const baseUrl = rawClientUrl.replace(/\/$/, '');

    // Fetch all approved papers
    const papers = await Paper.find({ status: 'approved' })
      .select('_id title updatedAt createdAt')
      .sort({ updatedAt: -1 })
      .lean();

    const now = new Date().toISOString().split('T')[0];

    let xml = `<?xml version="1.0" encoding="UTF-8"?>\n`;
    xml += `<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9"\n`;
    xml += `        xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance"\n`;
    xml += `        xsi:schemaLocation="http://www.sitemaps.org/schemas/sitemap/0.9\n`;
    xml += `        http://www.sitemaps.org/schemas/sitemap/0.9/sitemap.xsd">\n\n`;

    // Static Core Pages
    xml += `  <!-- Main Website Pages -->\n`;
    xml += `  <url>\n`;
    xml += `    <loc>${baseUrl}/</loc>\n`;
    xml += `    <lastmod>${now}</lastmod>\n`;
    xml += `    <changefreq>daily</changefreq>\n`;
    xml += `    <priority>1.0</priority>\n`;
    xml += `  </url>\n`;

    xml += `  <url>\n`;
    xml += `    <loc>${baseUrl}/search</loc>\n`;
    xml += `    <lastmod>${now}</lastmod>\n`;
    xml += `    <changefreq>daily</changefreq>\n`;
    xml += `    <priority>0.9</priority>\n`;
    xml += `  </url>\n`;

    xml += `  <url>\n`;
    xml += `    <loc>${baseUrl}/login</loc>\n`;
    xml += `    <changefreq>monthly</changefreq>\n`;
    xml += `    <priority>0.4</priority>\n`;
    xml += `  </url>\n`;

    xml += `  <url>\n`;
    xml += `    <loc>${baseUrl}/register</loc>\n`;
    xml += `    <changefreq>monthly</changefreq>\n`;
    xml += `    <priority>0.4</priority>\n`;
    xml += `  </url>\n\n`;

    // Dynamic Paper Pages
    xml += `  <!-- Dynamic Research Papers (${papers.length} indexed) -->\n`;
    papers.forEach((paper) => {
      const lastModDate = paper.updatedAt
        ? new Date(paper.updatedAt).toISOString().split('T')[0]
        : paper.createdAt
        ? new Date(paper.createdAt).toISOString().split('T')[0]
        : now;

      xml += `  <url>\n`;
      xml += `    <loc>${baseUrl}/papers/${paper._id}</loc>\n`;
      xml += `    <lastmod>${lastModDate}</lastmod>\n`;
      xml += `    <changefreq>weekly</changefreq>\n`;
      xml += `    <priority>0.8</priority>\n`;
      xml += `  </url>\n`;
    });

    xml += `</urlset>`;

    res.header('Content-Type', 'application/xml');
    res.header('Cache-Control', 'public, max-age=3600'); // Cache for 1 hour
    return res.status(200).send(xml);
  } catch (error) {
    console.error('Sitemap generation error:', error);
    return res.status(500).send('Error generating sitemap.xml');
  }
});

/**
 * GET /robots.txt
 * Serves a dynamic robots.txt with the sitemap location
 */
router.get('/robots.txt', (req, res) => {
  const rawClientUrl = process.env.CLIENT_URL || `${req.protocol}://${req.get('host')}`;
  const baseUrl = rawClientUrl.replace(/\/$/, '');

  const robots = `# TCET Research Repository Robots.txt
User-agent: *
Allow: /
Allow: /search
Allow: /papers/
Allow: /uploads/
Disallow: /admin
Disallow: /admin/*
Disallow: /contributor
Disallow: /contributor/*
Disallow: /api/

# Dynamic XML Sitemap
Sitemap: ${baseUrl}/sitemap.xml
`;

  res.header('Content-Type', 'text/plain');
  res.header('Cache-Control', 'public, max-age=86400');
  return res.status(200).send(robots);
});

module.exports = router;
