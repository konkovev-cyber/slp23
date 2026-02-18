/**
 * 🔐 DOMPurify - Санитизация HTML для защиты от XSS атак
 * 
 * Использование:
 * import { sanitize } from '@/lib/sanitize';
 * 
 * <div dangerouslySetInnerHTML={{ __html: sanitize(userContent) }} />
 */

import DOMPurify from 'dompurify';

// Конфигурация для пользовательского контента
const USER_CONTENT_CONFIG = {
  ALLOWED_TAGS: [
    'b', 'i', 'em', 'strong', 'u',
    'a', 'p', 'br', 'ul', 'ol', 'li',
    'h1', 'h2', 'h3', 'h4', 'h5', 'h6',
    'blockquote', 'code', 'pre',
    'img', 'figure', 'figcaption',
    'table', 'thead', 'tbody', 'tr', 'th', 'td',
    'span', 'div', 'sub', 'sup'
  ],
  ALLOWED_ATTR: [
    'href', 'src', 'alt', 'title',
    'target', 'rel', 'class',
    'colspan', 'rowspan'
  ],
  ALLOWED_URI_REGEXP: /^(?:(?:(?:f|ht)tps?|mailto|tel):|[^a-z]|[a-z+.\-]+(?:[^a-z+.\-:]|$))/i,
  ADD_ATTR: ['target'],
  FORBID_ATTR: ['onclick', 'onerror', 'onload', 'style'],
};

// Конфигурация для простого текста (только форматирование)
const SIMPLE_TEXT_CONFIG = {
  ALLOWED_TAGS: ['b', 'i', 'em', 'strong', 'u', 'br', 'p'],
  ALLOWED_ATTR: [],
};

/**
 * Санитизация пользовательского HTML контента
 * @param html - Исходный HTML
 * @returns Безопасный HTML
 */
export function sanitize(html: string): string {
  if (!html) return '';
  
  return DOMPurify.sanitize(html, USER_CONTENT_CONFIG);
}

/**
 * Санитизация для простого текста (минимум тегов)
 * @param html - Исходный HTML
 * @returns Безопасный HTML
 */
export function sanitizeSimple(html: string): string {
  if (!html) return '';
  
  return DOMPurify.sanitize(html, SIMPLE_TEXT_CONFIG);
}

/**
 * Санитизация с кастомной конфигурацией
 * @param html - Исходный HTML
 * @param config - Конфигурация DOMPurify
 * @returns Безопасный HTML
 */
export function sanitizeCustom(html: string, config: Partial<DOMPurify.Config>): string {
  if (!html) return '';
  
  return DOMPurify.sanitize(html, config);
}

/**
 * Проверка на безопасный URL
 * @param url - URL для проверки
 * @returns Безопасный URL или пустая строка
 */
export function sanitizeUrl(url: string): string {
  if (!url) return '';
  
  const safeProtocols = ['http:', 'https:', 'mailto:', 'tel:'];
  try {
    const parsed = new URL(url, window.location.origin);
    if (safeProtocols.includes(parsed.protocol)) {
      return url;
    }
  } catch {
    // Неверный URL
  }
  
  return '';
}

/**
 * Санитизация для email
 * @param email - Email для проверки
 * @returns Безопасный email или пустая строка
 */
export function sanitizeEmail(email: string): string {
  if (!email) return '';
  
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (emailRegex.test(email)) {
    return email;
  }
  
  return '';
}

export default sanitize;
