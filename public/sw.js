self.addEventListener("install", () => {
  self.skipWaiting();
});

self.addEventListener("activate", (event) => {
  event.waitUntil(self.clients.claim());
});

self.addEventListener("message", (event) => {
  if (event.data?.type === "SKIP_WAITING") {
    self.skipWaiting();
  }
});

function resolveAssetUrl(path) {
  return new URL(path || "/icons/icon-192.svg", self.location.origin).href;
}

self.addEventListener("push", (event) => {
  let payload = {
    title: "E-Lelang",
    body: "Ada update lelang",
    url: "/",
    icon: "/icons/icon-192.svg",
  };

  if (event.data) {
    try {
      payload = { ...payload, ...event.data.json() };
    } catch {
      payload.body = event.data.text() || payload.body;
    }
  }

  const iconUrl = resolveAssetUrl(payload.icon);
  const targetUrl = payload.url.startsWith("http")
    ? payload.url
    : new URL(payload.url, self.location.origin).href;

  event.waitUntil(
    self.registration
      .showNotification(payload.title, {
        body: payload.body,
        icon: iconUrl,
        badge: iconUrl,
        tag: `elang-${targetUrl}`,
        renotify: true,
        vibrate: [180, 90, 180],
        data: { url: targetUrl },
      })
      .catch(() =>
        self.registration.showNotification(payload.title, {
          body: payload.body,
          data: { url: targetUrl },
        })
      )
  );
});

self.addEventListener("notificationclick", (event) => {
  event.notification.close();

  const targetUrl = event.notification.data?.url ?? self.location.origin;

  event.waitUntil(
    self.clients.matchAll({ type: "window", includeUncontrolled: true }).then((clientList) => {
      for (const client of clientList) {
        if (client.url.startsWith(self.location.origin) && "focus" in client) {
          return client.focus();
        }
      }

      if (self.clients.openWindow) {
        return self.clients.openWindow(targetUrl);
      }

      return undefined;
    })
  );
});
