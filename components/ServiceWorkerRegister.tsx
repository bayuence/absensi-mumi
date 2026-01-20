"use client";

import { useEffect } from "react";

export default function ServiceWorkerRegister() {
    useEffect(() => {
        if (typeof window !== "undefined" && "serviceWorker" in navigator) {
            // Register service worker saat app dimuat
            navigator.serviceWorker
                .register("/service-worker.js")
                .then((registration) => {
                    console.log("✅ Service Worker registered successfully:", registration.scope);

                    // Optional: Update service worker jika ada versi baru
                    registration.addEventListener("updatefound", () => {
                        const newWorker = registration.installing;
                        if (newWorker) {
                            newWorker.addEventListener("statechange", () => {
                                if (newWorker.state === "installed" && navigator.serviceWorker.controller) {
                                    console.log("🔄 New service worker available. Refresh to update.");
                                }
                            });
                        }
                    });
                })
                .catch((error) => {
                    console.error("❌ Service Worker registration failed:", error);
                });
        }
    }, []);

    return null; // Komponen ini tidak merender apa-apa
}
