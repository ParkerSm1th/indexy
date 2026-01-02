"use client";

import { useAuth, useUser } from "@clerk/nextjs";
import { useState, useEffect, useCallback } from "react";

// Extension ID - you'll need to update this after loading the extension
const EXTENSION_ID = process.env.NEXT_PUBLIC_EXTENSION_ID;

type ConnectionStatus = "checking" | "connected" | "not_installed" | "error";

export default function ExtensionAuthPage() {
  const { isSignedIn, getToken } = useAuth();
  const { user } = useUser();
  const [status, setStatus] = useState<ConnectionStatus>("checking");
  const [error, setError] = useState<string | null>(null);

  const sendTokenToExtension = useCallback(async () => {
    if (!EXTENSION_ID) {
      setError("Extension ID not configured");
      setStatus("error");
      return;
    }

    try {
      // Get token using the extension-template session template (1 year expiry)
      const token = await getToken({ template: "extension-template" });
      if (!token) {
        setError("Could not get auth token");
        setStatus("error");
        return;
      }

      // Send token to extension
      chrome.runtime.sendMessage(
        EXTENSION_ID,
        { type: "SET_AUTH_TOKEN", token },
        (response) => {
          if (chrome.runtime.lastError) {
            console.error("Extension error:", chrome.runtime.lastError);
            setStatus("not_installed");
            return;
          }

          if (response?.success) {
            setStatus("connected");
          } else {
            setError(response?.error || "Failed to connect");
            setStatus("error");
          }
        }
      );
    } catch (err) {
      console.error("Failed to send token:", err);
      setError("Failed to connect to extension");
      setStatus("error");
    }
  }, [getToken]);

  // Check extension status and send token on load
  useEffect(() => {
    if (!isSignedIn) return;

    if (!EXTENSION_ID) {
      setStatus("error");
      setError("Extension ID not configured. Add NEXT_PUBLIC_EXTENSION_ID to .env");
      return;
    }

    // Check if extension is installed
    if (typeof chrome === "undefined" || !chrome.runtime?.sendMessage) {
      setStatus("not_installed");
      return;
    }

    // Try to connect
    sendTokenToExtension();
  }, [isSignedIn, sendTokenToExtension]);


  if (!isSignedIn) {
    return (
      <main className="flex min-h-screen flex-col items-center justify-center p-8">
        <div className="max-w-md text-center">
          <h1 className="text-2xl font-bold mb-4">Connect Extension</h1>
          <p className="text-muted-foreground mb-6">
            Please sign in first to connect your browser extension.
          </p>
          <a
            href="/sign-in?redirect_url=/extension-auth"
            className="px-6 py-3 bg-primary text-primary-foreground rounded-lg font-medium hover:opacity-90 transition inline-block"
          >
            Sign In
          </a>
        </div>
      </main>
    );
  }

  return (
    <main className="flex min-h-screen flex-col items-center justify-center p-8">
      <div className="max-w-md text-center">
        <h1 className="text-2xl font-bold mb-4">Connect Extension</h1>

        {status === "checking" && (
          <div className="space-y-4">
            <div className="animate-pulse flex justify-center">
              <div className="w-12 h-12 rounded-full bg-muted"></div>
            </div>
            <p className="text-muted-foreground">Connecting to extension...</p>
          </div>
        )}

        {status === "connected" && (
          <div className="space-y-4">
            <div className="w-16 h-16 mx-auto bg-green-100 rounded-full flex items-center justify-center">
              <svg className="w-8 h-8 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
            </div>
            <p className="text-green-600 font-medium">Extension connected!</p>
            <p className="text-sm text-muted-foreground">
              Signed in as {user?.emailAddresses[0]?.emailAddress}
            </p>
            <p className="text-sm text-muted-foreground">
              You can close this tab and start saving bookmarks.
            </p>
            <a
              href="/dashboard"
              className="inline-block mt-4 px-6 py-2 border border-border rounded-lg hover:bg-muted transition"
            >
              Go to Dashboard
            </a>
          </div>
        )}

        {status === "not_installed" && (
          <div className="space-y-4">
            <div className="w-16 h-16 mx-auto bg-yellow-100 rounded-full flex items-center justify-center">
              <svg className="w-8 h-8 text-yellow-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
              </svg>
            </div>
            <p className="text-yellow-600 font-medium">Extension not detected</p>
            <p className="text-sm text-muted-foreground">
              Please install the AI Bookmark extension first, then refresh this page.
            </p>
            <button
              onClick={() => window.location.reload()}
              className="mt-4 px-6 py-2 bg-primary text-primary-foreground rounded-lg hover:opacity-90 transition"
            >
              Retry Connection
            </button>
          </div>
        )}

        {status === "error" && (
          <div className="space-y-4">
            <div className="w-16 h-16 mx-auto bg-red-100 rounded-full flex items-center justify-center">
              <svg className="w-8 h-8 text-red-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </div>
            <p className="text-red-600 font-medium">Connection failed</p>
            <p className="text-sm text-muted-foreground">{error}</p>
            <button
              onClick={sendTokenToExtension}
              className="mt-4 px-6 py-2 bg-primary text-primary-foreground rounded-lg hover:opacity-90 transition"
            >
              Try Again
            </button>
          </div>
        )}
      </div>
    </main>
  );
}
