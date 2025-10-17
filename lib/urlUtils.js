// Utility functions for URL generation and parsing

/**
 * Convert a string to a URL-friendly slug
 * @param {string} text - The text to convert
 * @returns {string} - URL-friendly slug
 */
export function createSlug(text) {
  if (!text) return '';
  
  return text
    .toLowerCase()
    .trim()
    // Replace spaces and special characters with hyphens
    .replace(/[^\w\s-]/g, '')
    .replace(/[\s_-]+/g, '-')
    // Remove leading/trailing hyphens
    .replace(/^-+|-+$/g, '');
}

/**
 * Extract course ID from slug
 * @param {string} slug - The URL slug
 * @returns {string} - Course ID
 */
export function extractCourseIdFromSlug(slug) {
  // If the slug contains a hyphen followed by what looks like an ID, extract it
  const parts = slug.split('-');
  const lastPart = parts[parts.length - 1];
  
  // Check if the last part looks like a Firebase ID (alphanumeric, 20+ characters)
  if (lastPart && lastPart.length >= 20 && /^[a-zA-Z0-9]+$/.test(lastPart)) {
    return lastPart;
  }
  
  return slug; // Return the original slug if no ID found
}

/**
 * Create SEO-friendly course URL (without ID)
 * @param {string} courseTitle - The course title
 * @returns {string} - SEO-friendly URL
 */
export function createCourseUrl(courseTitle) {
  return createSlug(courseTitle);
}

/**
 * Parse course URL to get the slug (no ID needed)
 * @param {string} urlSlug - The URL slug
 * @returns {object} - Object containing slug
 */
export function parseCourseUrl(urlSlug) {
  return {
    slug: urlSlug
  };
}
