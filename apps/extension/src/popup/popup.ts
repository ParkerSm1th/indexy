import { getAuthToken, clearAuthToken } from "../utils/storage";
import { checkAuth } from "../utils/api";

interface PageContent {
  url: string;
  title: string;
  markdown: string;
  favicon: string | null;
}

const contentEl = document.getElementById("content")!;

async function init() {
  const isAuthenticated = await checkAuth();

  if (!isAuthenticated) {
    showAuthPrompt();
    return;
  }

  showSaveUI();
}

async function handleAuthError() {
  await clearAuthToken();
  showAuthPrompt("Session expired. Please sign in again.");
}

function showAuthPrompt(message?: string) {
  contentEl.innerHTML = `
    <div class="auth-prompt">
      ${message ? `<p class="error-message" style="color: #dc2626; margin-bottom: 12px; font-size: 13px;">${message}</p>` : ""}
      <p>Sign in to start saving bookmarks</p>
      <button id="signin-btn" class="btn btn-primary">
        Sign In
      </button>
      <p style="margin-top: 12px; font-size: 11px; color: #888;">
        Opens the web app to connect your account
      </p>
    </div>
  `;

  document.getElementById("signin-btn")?.addEventListener("click", () => {
    chrome.tabs.create({ url: "http://localhost:3000/extension-auth" });
  });
}

async function showSaveUI() {
  contentEl.innerHTML = `
    <div class="status info" id="status">
      Extracting page content...
    </div>
    <div class="page-info" id="page-info" style="display: none;">
      <div class="page-title" id="page-title"></div>
      <div class="page-url" id="page-url"></div>
    </div>
    <button id="save-btn" class="btn btn-primary" disabled>
      Save Bookmark
    </button>
    <div style="display: flex; justify-content: space-between; margin-top: 12px;">
      <a href="http://localhost:3000/dashboard" target="_blank" class="settings-link" style="margin: 0;">
        View bookmarks
      </a>
      <button id="signout-btn" style="background: none; border: none; color: #666; font-size: 12px; cursor: pointer; text-decoration: underline;">
        Sign out
      </button>
    </div>
  `;

  document.getElementById("signout-btn")?.addEventListener("click", async () => {
    await clearAuthToken();
    showAuthPrompt();
  });

  // Get current tab and extract content
  const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });

  if (!tab?.id) {
    showError("Could not access current tab");
    return;
  }

  try {
    const content = await chrome.tabs.sendMessage(tab.id, {
      type: "EXTRACT_CONTENT",
    }) as PageContent | null;

    if (!content) {
      showError("Could not extract page content");
      return;
    }

    showPageInfo(content);
  } catch (error) {
    showError("Content script not loaded. Please refresh the page.");
  }
}

function showPageInfo(content: PageContent) {
  const statusEl = document.getElementById("status")!;
  const pageInfoEl = document.getElementById("page-info")!;
  const pageTitleEl = document.getElementById("page-title")!;
  const pageUrlEl = document.getElementById("page-url")!;
  const saveBtn = document.getElementById("save-btn") as HTMLButtonElement;

  statusEl.className = "status info";
  statusEl.textContent = "Ready to save";
  pageInfoEl.style.display = "block";
  pageTitleEl.textContent = content.title;
  pageUrlEl.textContent = content.url;
  saveBtn.disabled = false;

  saveBtn.addEventListener("click", () => saveBookmark(content));
}

async function saveBookmark(content: PageContent) {
  const statusEl = document.getElementById("status")!;
  const saveBtn = document.getElementById("save-btn") as HTMLButtonElement;

  statusEl.className = "status info";
  statusEl.textContent = "Saving...";
  saveBtn.disabled = true;

  try {
    const response = await chrome.runtime.sendMessage({
      type: "SAVE_BOOKMARK",
      content,
    });

    if (response.success) {
      statusEl.className = "status success";
      statusEl.textContent = "Bookmark saved!";
      saveBtn.textContent = "Saved ✓";
    } else {
      // Check if it's an auth error
      const errorMsg = response.error || "Failed to save bookmark";
      if (errorMsg.toLowerCase().includes("token") ||
          errorMsg.toLowerCase().includes("unauthorized") ||
          errorMsg.toLowerCase().includes("auth") ||
          errorMsg.toLowerCase().includes("expired")) {
        await handleAuthError();
      } else {
        showError(errorMsg);
        saveBtn.disabled = false;
      }
    }
  } catch (error) {
    showError("Failed to save bookmark");
    saveBtn.disabled = false;
  }
}

function showError(message: string) {
  const statusEl = document.getElementById("status")!;
  statusEl.className = "status error";
  statusEl.textContent = message;
}

// Initialize popup
init();
