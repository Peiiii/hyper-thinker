import React, { useMemo, FC } from 'react';

// Ensure marked, DOMPurify and hljs are available on the window
declare global {
  interface Window {
    marked: {
      parse: (markdown: string, options?: any) => string;
      setOptions: (options: any) => void;
    };
    DOMPurify: {
      sanitize: (html: string) => string;
    };
    hljs: {
      highlight: (code: string, options: { language: string, ignoreIllegals?: boolean }) => { value: string };
      getLanguage: (name: string) => any;
    };
  }
}

interface MarkdownDisplayProps {
  text: string;
  className?: string;
}

const MarkdownDisplay: FC<MarkdownDisplayProps> = ({ text, className }) => {
  const htmlContent = useMemo(() => {
    // Check for libraries' existence *inside* useMemo to avoid race conditions
    if (
      typeof window.marked?.parse !== 'function' ||
      typeof window.DOMPurify?.sanitize !== 'function' ||
      typeof window.hljs?.highlight !== 'function'
    ) {
      console.warn("A required library (marked, DOMPurify, or highlight.js) is not loaded. Displaying plain text.");
      // Basic text escaping for safety when libraries are missing
      const tempDiv = document.createElement('div');
      tempDiv.textContent = text;
      return tempDiv.innerHTML;
    }

    // Configure marked right before parsing. This avoids race conditions
    // where the script hasn't loaded when the module is first evaluated.
    window.marked.setOptions({
      gfm: true,
      breaks: true,
      highlight: (code: string, lang: string) => {
        const language = window.hljs.getLanguage(lang) ? lang : 'plaintext';
        try {
          return window.hljs.highlight(code, { language, ignoreIllegals: true }).value;
        } catch (e) {
          console.error('Error during syntax highlighting:', e);
          return code; // Return un-highlighted code on error
        }
      },
      langPrefix: 'hljs language-',
    });

    const rawHtml = window.marked.parse(text || '');

    // Sanitize the final HTML to prevent XSS attacks
    return window.DOMPurify.sanitize(rawHtml);
  }, [text]);

  return (
    <div
      className={className}
      dangerouslySetInnerHTML={{ __html: htmlContent }}
    />
  );
};

export default MarkdownDisplay;
