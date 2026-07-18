// Custom Service Worker message handler for background sync
// This is injected into the Workbox-generated service worker

// Listen for background sync events (Android/Chrome)
self.addEventListener('sync', (event) => {
  if (event.tag === 'sync-data') {
    event.waitUntil(
      (async () => {
        // Notify all clients to trigger SyncManager.sync()
        const clients = await self.clients.matchAll({ type: 'window' })
        for (const client of clients) {
          client.postMessage({ type: 'TRIGGER_SYNC' })
        }
      })()
    )
  }
})

// Listen for periodic sync events (Android/Chrome)
self.addEventListener('periodicsync', (event) => {
  if (event.tag === 'sync-data') {
    event.waitUntil(
      (async () => {
        const clients = await self.clients.matchAll({ type: 'window' })
        for (const client of clients) {
          client.postMessage({ type: 'TRIGGER_SYNC' })
        }
      })()
    )
  }
})

// Listen for push events (future: reminders, budget alerts)
self.addEventListener('push', (event) => {
  const data = event.data?.json()
  const title = data?.title ?? 'LokiSpesi'
  const options = {
    body: data?.body ?? '',
    icon: '/icons/icon-192.svg',
    badge: '/icons/icon-192.svg',
    tag: data?.tag ?? 'lokispesi',
    data: data?.url ? { url: data.url } : undefined,
    vibrate: [200, 100, 200],
  }
  event.waitUntil(self.registration.showNotification(title, options))
})

// Handle notification click
self.addEventListener('notificationclick', (event) => {
  event.notification.close()
  const url = event.notification.data?.url || '/app/diary'
  event.waitUntil(
    self.clients.matchAll({ type: 'window' }).then((clients) => {
      // Focus existing window or open new one
      for (const client of clients) {
        if (client.url.includes(url) && 'focus' in client) {
          return (client as WindowClient).focus()
        }
      }
      if (self.clients.openWindow) {
        return self.clients.openWindow(url)
      }
    })
  )
})
