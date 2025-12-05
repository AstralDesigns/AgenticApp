import { Pipe, PipeTransform, inject } from '@angular/core';
import { DomSanitizer, SafeHtml } from '@angular/platform-browser';

// A very simple markdown to HTML converter.
// For a real app, a robust library like 'marked' and a sanitizer like DOMPurify are recommended.
function simpleMarkdownToHtml(markdown: string): string {
  if (!markdown) return '';

  let html = markdown
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');

  // Code blocks (```...```)
  html = html.replace(/```(\w*)\n([\s\S]*?)```/g, (match, lang, code) => {
    const languageClass = lang ? `language-${lang}` : '';
    // The code is already escaped
    return `</p><pre class="bg-slate-900/70 rounded-md p-3 my-2 font-mono text-sm overflow-x-auto"><code class="${languageClass}">${code.trim()}</code></pre><p>`;
  });

  // Headers (e.g., ### Header)
  html = html.replace(/^### (.*$)/gim, '<h3>$1</h3>');
  html = html.replace(/^## (.*$)/gim, '<h2>$1</h2>');
  html = html.replace(/^# (.*$)/gim, '<h1>$1</h1>');
  
  // Bold (**...**)
  html = html.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>');
  
  // Italic (*...*)
  html = html.replace(/\*(.*?)\*/g, '<em>$1</em>');
  
  // Inline code (`...`)
  html = html.replace(/`(.*?)`/g, '<code class="bg-slate-700/50 rounded px-1.5 py-0.5 text-sm font-mono">$1</code>');
  
  // Unordered list (* or -) - simple version
  html = html.replace(/^\s*[\*-] (.*)/gim, '<li>$1</li>');
  html = html.replace(/(<\/li>\n<li>)/g, '</li><li>'); // Join list items
  html = html.replace(/((<li>.*<\/li>)+)/gs, '<ul>$1</ul>');

  // Links ([text](url))
  html = html.replace(/\[(.*?)\]\((.*?)\)/g, '<a href="$2" target="_blank" rel="noopener noreferrer" class="text-indigo-400 hover:underline">$1</a>');

  // Paragraphs (split by newlines)
  html = '<p>' + html.split(/\n\n+/).join('</p><p>') + '</p>';
  html = html.replace(/<p>\s*<\/p>/g, ''); // Remove empty paragraphs
  html = html.replace(/<p><(h[1-3]|ul|pre)/g, '<$1');
  html = html.replace(/<\/(h[1-3]|ul|pre)><\/p>/g, '</$1>');

  return html;
}

@Pipe({
  name: 'markdownToHtml',
  standalone: true,
})
export class MarkdownPipe implements PipeTransform {
  private sanitizer = inject(DomSanitizer);

  transform(value: string): SafeHtml {
    if (!value) {
      // FIX: The transform method must return SafeHtml, but was returning a string.
      // This mismatch caused a cascading type error where the compiler inferred
      // `sanitizer` as `unknown`. Using bypassSecurityTrustHtml for the empty
      // case resolves both issues.
      return this.sanitizer.bypassSecurityTrustHtml('');
    }
    const html = simpleMarkdownToHtml(value);
    return this.sanitizer.bypassSecurityTrustHtml(html);
  }
}
