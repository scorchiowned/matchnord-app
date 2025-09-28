'use client';

import { useMemo } from 'react';

interface SafeHtmlProps {
  content: string;
  className?: string;
}

export function SafeHtml({ content, className = '' }: SafeHtmlProps) {
  const sanitizedContent = useMemo(() => {
    if (!content) return '';

    // Basic HTML sanitization - remove potentially dangerous tags
    const allowedTags = [
      'p',
      'br',
      'strong',
      'b',
      'em',
      'i',
      'u',
      'h1',
      'h2',
      'h3',
      'h4',
      'h5',
      'h6',
      'ul',
      'ol',
      'li',
      'blockquote',
      'a',
      'span',
      'div',
    ];

    // Remove script tags and other potentially dangerous content
    let sanitized = content
      .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '')
      .replace(/<iframe\b[^<]*(?:(?!<\/iframe>)<[^<]*)*<\/iframe>/gi, '')
      .replace(/<object\b[^<]*(?:(?!<\/object>)<[^<]*)*<\/object>/gi, '')
      .replace(/<embed\b[^<]*(?:(?!<\/embed>)<[^<]*)*<\/embed>/gi, '')
      .replace(/on\w+="[^"]*"/gi, '') // Remove event handlers
      .replace(/javascript:/gi, ''); // Remove javascript: URLs

    console.log('SafeHtml - Original content:', content);
    console.log('SafeHtml - Sanitized content:', sanitized);

    return sanitized;
  }, [content]);

  return (
    <div
      className={`prose prose-sm max-w-none ${className}`}
      dangerouslySetInnerHTML={{ __html: sanitizedContent }}
    />
  );
}
