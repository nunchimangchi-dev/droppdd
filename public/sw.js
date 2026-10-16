// Push-only service worker. No caching and no fetch handler on purpose:
// this is not an offline strategy. Every push must show a notification
// (iOS revokes subscriptions that receive silent pushes).
self.addEventListener("push", (event) => {
  let payload = {};
  try {
    payload = event.data ? event.data.json() : {};
  } catch {
    payload = {};
  }
  const title = typeof payload.title === "string" && payload.title ? payload.title : "DROPPDD";
  const body = typeof payload.body === "string" ? payload.body : "";
  const url = typeof payload.url === "string" && payload.url.startsWith("/") ? payload.url : "/checkin";
  event.waitUntil(self.registration.showNotification(title, { body, data: { url } }));
});

self.addEventListener("notificationclick", (event) => {
  event.notification.close();
  const url = (event.notification.data && event.notification.data.url) || "/checkin";
  event.waitUntil(
    self.clients.matchAll({ type: "window", includeUncontrolled: true }).then((windows) => {
      for (const client of windows) {
        if ("focus" in client) {
          return client.focus().then((focused) => {
            if (focused && "navigate" in focused) return focused.navigate(url);
            return self.clients.openWindow(url);
          });
        }
      }
      return self.clients.openWindow(url);
    })
  );
});
