"use client";

import { useEffect } from "react";

export default function ServiceWorkerRegister() {
    useEffect(() => {
        if (typeof window !== "undefined" && "serviceWorker" in navigator) {
            // Register service worker
            navigator.serviceWorker
                .register("/service-worker.js", {
                    updateViaCache: 'none' // PENTING: Selalu cek versi terbaru, tidak pakai cache
                })
                .then((registration) => {
                    console.log("✅ Service Worker registered");

                    // Cek update SETIAP KALI halaman dibuka
                    registration.update();

                    // Cek update setiap 30 detik
                    setInterval(() => {
                        registration.update();
                    }, 30 * 1000);

                    // Detect dan langsung aktifkan service worker baru
                    registration.addEventListener("updatefound", () => {
                        const newWorker = registration.installing;
                        if (newWorker) {
                            console.log("🔄 Update ditemukan, menginstall...");
                            newWorker.addEventListener("statechange", () => {
                                if (newWorker.state === "installed") {
                                    if (navigator.serviceWorker.controller) {
                                        // Ada service worker lama, langsung skip waiting
                                        console.log("🔄 Update ready, activating...");
                                        newWorker.postMessage({ type: 'SKIP_WAITING' });
                                    }
                                }
                            });
                        }
                    });
                })
                .catch((error) => {
                    console.error("❌ Service Worker registration failed:", error);
                });

            // Listen untuk message dari service worker
            navigator.serviceWorker.addEventListener('message', (event) => {
                if (event.data && event.data.type === 'SW_ACTIVATED') {
                    console.log("✅ Service Worker updated, reloading page...");
                    // Reload untuk mendapatkan versi terbaru
                    window.location.reload();
                }
            });

            // Auto-reload saat controller berubah
            let refreshing = false;
            navigator.serviceWorker.addEventListener('controllerchange', () => {
                if (!refreshing) {
                    refreshing = true;
                    console.log("🔄 New version activated, reloading...");
                    window.location.reload();
                }
            });
        }
    }, []);

    return null;
}
