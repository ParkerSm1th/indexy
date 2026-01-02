import { saveBookmark } from "./utils/api";
import { setAuthToken, clearAuthToken, getAuthToken } from "./utils/storage";

interface PageContent {
  url: string;
  title: string;
  markdown: string;
  favicon: string | null;
}

// Handle messages from popup
chrome.runtime.onMessage.addListener((message, _sender, sendResponse) => {
  if (message.type === "SAVE_BOOKMARK") {
    handleSaveBookmark(message.content)
      .then(sendResponse)
      .catch((error) => {
        console.error("Error saving bookmark:", error);
        sendResponse({ success: false, error: error.message });
      });
    return true;
  }

  if (message.type === "GET_AUTH_STATUS") {
    getAuthToken().then((token) => {
      sendResponse({ isAuthenticated: !!token });
    });
    return true;
  }

  if (message.type === "SIGN_OUT") {
    clearAuthToken().then(() => {
      sendResponse({ success: true });
    });
    return true;
  }
});

// Handle messages from web app (externally_connectable)
chrome.runtime.onMessageExternal.addListener((message, sender, sendResponse) => {
  console.log("External message received:", message, "from:", sender.origin);

  if (message.type === "SET_AUTH_TOKEN" && message.token) {
    setAuthToken(message.token)
      .then(() => {
        console.log("Auth token saved from web app");
        sendResponse({ success: true });
      })
      .catch((error) => {
        console.error("Failed to save auth token:", error);
        sendResponse({ success: false, error: error.message });
      });
    return true;
  }

  if (message.type === "GET_AUTH_STATUS") {
    getAuthToken().then((token) => {
      sendResponse({ isAuthenticated: !!token });
    });
    return true;
  }

  if (message.type === "SIGN_OUT") {
    clearAuthToken().then(() => {
      sendResponse({ success: true });
    });
    return true;
  }
});

async function handleSaveBookmark(
  content: PageContent
): Promise<{ success: boolean; error?: string }> {
  const result = await saveBookmark({
    url: content.url,
    title: content.title,
    markdown: content.markdown,
    favicon: content.favicon || undefined,
  });

  return result;
}

// Listen for installation
chrome.runtime.onInstalled.addListener(() => {
  console.log("AI Bookmark extension installed");
});
