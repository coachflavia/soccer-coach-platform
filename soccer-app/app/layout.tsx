import type { Metadata, Viewport } from "next";
import type { ReactNode } from "react";
import Script from "next/script";
import { PwaClient } from "../components/pwa-client";
import "./globals.css";

export const metadata: Metadata = {
  title: "Coach Hub",
  description: "Soccer coaching platform",
  applicationName: "Coach Hub",
  manifest: "/manifest.webmanifest",
  appleWebApp: {
    capable: true,
    statusBarStyle: "black-translucent",
    title: "Coach Hub",
  },
  icons: {
    icon: "/icon-192.png",
    shortcut: "/icon-192.png",
    apple: "/icon-180.png",
  },
};

export const viewport: Viewport = {
  themeColor: "#020617",
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html
      lang="en"
      className="h-full antialiased"
    >
      <body className="min-h-full flex flex-col">
        {process.env.NODE_ENV === "development" && (
          <Script id="coach-hub-dev-worker-cleanup" strategy="beforeInteractive">
            {`if ("serviceWorker" in navigator) {
              navigator.serviceWorker.getRegistrations()
                .then(function (registrations) {
                  return Promise.all(registrations
                    .filter(function (registration) {
                      var worker = registration.active || registration.waiting || registration.installing;
                      return worker && new URL(worker.scriptURL).pathname === "/sw.js";
                    })
                    .map(function (registration) { return registration.unregister(); }));
                })
                .then(function () {
                  if (!("caches" in window)) return;
                  return caches.keys().then(function (names) {
                    return Promise.all(names
                      .filter(function (name) { return name.indexOf("coach-hub-") === 0; })
                      .map(function (name) { return caches.delete(name); }));
                  });
                })
                .catch(function (error) {
                  console.error("Could not clear the Coach Hub offline cache in development.", error);
                });
            }`}
          </Script>
        )}
        <PwaClient />
        {children}
      </body>
    </html>
  );
}
