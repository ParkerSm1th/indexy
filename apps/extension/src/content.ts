import { Readability } from "@mozilla/readability";
import TurndownService from "turndown";

interface PageContent {
  url: string;
  title: string;
  markdown: string;
  favicon: string | null;
}

function extractPageContent(): PageContent | null {
  try {
    // Clone the document for Readability
    const documentClone = document.cloneNode(true) as Document;
    const reader = new Readability(documentClone);
    const article = reader.parse();

    if (!article || !article.content) {
      // Fallback: use body content
      const title = document.title || "Untitled";
      const bodyHtml = document.body.innerHTML;
      const turndown = new TurndownService({
        headingStyle: "atx",
        codeBlockStyle: "fenced",
      });
      const markdown = turndown.turndown(bodyHtml);

      return {
        url: window.location.href,
        title,
        markdown: markdown.slice(0, 50000), // Limit size
        favicon: getFavicon(),
      };
    }

    // Convert article HTML to markdown
    const turndown = new TurndownService({
      headingStyle: "atx",
      codeBlockStyle: "fenced",
    });

    const markdown = turndown.turndown(article.content);

    return {
      url: window.location.href,
      title: article.title || document.title || "Untitled",
      markdown: markdown.slice(0, 50000), // Limit size
      favicon: getFavicon(),
    };
  } catch (error) {
    console.error("Failed to extract page content:", error);
    return null;
  }
}

function getFavicon(): string | null {
  // Try different favicon sources
  const iconLink =
    document.querySelector<HTMLLinkElement>('link[rel="icon"]') ||
    document.querySelector<HTMLLinkElement>('link[rel="shortcut icon"]') ||
    document.querySelector<HTMLLinkElement>('link[rel="apple-touch-icon"]');

  if (iconLink?.href) {
    return iconLink.href;
  }

  // Default favicon path
  try {
    const url = new URL(window.location.href);
    return `${url.origin}/favicon.ico`;
  } catch {
    return null;
  }
}

// Listen for messages from the popup/background script
chrome.runtime.onMessage.addListener((message, _sender, sendResponse) => {
  if (message.type === "EXTRACT_CONTENT") {
    const content = extractPageContent();
    sendResponse(content);
  }
  return true; // Keep message channel open for async response
});

// Export for type checking
export type { PageContent };
