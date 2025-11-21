import React, { useMemo, FC } from 'react';

// Ensure marked, DOMPurify and hljs are available on the window
declare global {
  interface Window {
    marked: {
      parse: (markdown: string, options?: any) => string;
      setOptions: (options: any) => void;
      Renderer: any; // Add Renderer for custom rendering
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

    const renderer = new window.marked.Renderer();

    // Override the code renderer for a custom display
    renderer.code = (code: string, lang: string) => {
      const language = window.hljs.getLanguage(lang) ? lang : 'plaintext';
      const highlightedCode = window.hljs.highlight(code, { language, ignoreIllegals: true }).value;
      const escapedLanguage = language.replace(/"/g, '&quot;');

      // SVGs for the copy button states
      const copyIconSvg = `<svg style="width: 1em; height: 1em; margin-right: 0.35em; vertical-align: -0.125em;" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor"><path d="M16 1H4c-1.1 0-2 .9-2 2v14h2V3h12V1zm3 4H8c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h11c1.1 0 2-.9 2-2V7c0-1.1-.9-2-2-2zm0 16H8V7h11v14z"></path></svg>`;
      const checkIconSvg = `<svg style="width: 1em; height: 1em; margin-right: 0.35em; vertical-align: -0.125em;" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor"><path d="M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41L9 16.17z"></path></svg>`;

      // The onclick logic is self-contained. It copies text from the sibling `code` tag.
      const copyButton = `
        <button 
          class="copy-button" 
          onclick="
            navigator.clipboard.writeText(this.closest('.code-block-wrapper').querySelector('code').innerText);
            this.innerHTML = \`${checkIconSvg} Copied\`;
            this.disabled = true;
            setTimeout(() => {
              this.innerHTML = \`${copyIconSvg} Copy\`;
              this.disabled = false;
            }, 2000);
          "
          aria-label="Copy code to clipboard"
        >
          ${copyIconSvg} Copy
        </button>
      `;

      // Return the full HTML structure for a code block
      return `
        <div class="code-block-wrapper">
          <div class="code-block-header">
            <span class="code-block-lang">${escapedLanguage}</span>
            ${copyButton}
          </div>
          <pre><code class="hljs language-${escapedLanguage}">${highlightedCode}</code></pre>
        </div>
      `;
    };

    // Use the custom renderer with marked
    const rawHtml = window.marked.parse(text || '', {
      renderer,
      gfm: true,
      breaks: true,
    });

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