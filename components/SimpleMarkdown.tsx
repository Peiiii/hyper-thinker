import React from 'react';

// A simple markdown-to-HTML renderer
const SimpleMarkdown: React.FC<{ text: string }> = ({ text }) => {
    if (!text) return null;

    const lines = text
      .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>') // Bold
      .replace(/\*(.*?)\*/g, '<em>$1</em>') // Italic
      .split('\n');

    let html = '';
    let inList = false;

    lines.forEach(line => {
      const trimmedLine = line.trim();
      if (trimmedLine.startsWith('* ') || trimmedLine.startsWith('- ')) {
        if (!inList) {
          html += '<ul class="list-disc pl-5 my-2">';
          inList = true;
        }
        html += `<li class="ml-4">${trimmedLine.substring(2)}</li>`;
      } else {
        if (inList) {
          html += '</ul>';
          inList = false;
        }
        if (trimmedLine.startsWith('# ')) {
          html += `<h1 class="text-2xl font-bold mt-4 mb-2">${trimmedLine.substring(2)}</h1>`;
        } else if (trimmedLine.startsWith('## ')) {
          html += `<h2 class="text-xl font-bold mt-3 mb-1">${trimmedLine.substring(3)}</h2>`;
        } else if (trimmedLine.length > 0) {
          html += `<p class="my-2">${trimmedLine}</p>`;
        }
      }
    });

    if (inList) {
      html += '</ul>';
    }

    return <div dangerouslySetInnerHTML={{ __html: html }} />;
};

export default SimpleMarkdown;
