// sw.js - Service Worker for in-browser transpilation and PWA caching

const BABEL_URL = 'https://cdn.jsdelivr.net/npm/@babel/standalone@7.24.7/babel.min.js';
const CACHE_NAME = 'taskhaha-cache-v1';

// Danh sách các tài nguyên cần cache để ứng dụng hoạt động offline
const ASSETS_TO_CACHE = [
  '/',
  '/index.html',
  '/index.tsx',
  '/App.tsx',
  '/types.ts',
  '/components/KanbanBoard.tsx',
  '/components/CalendarView.tsx',
  '/components/WeeklyView.tsx',
  '/components/TodoListView.tsx',
  '/components/NotesView.tsx',
  '/components/ChatAssistant.tsx',
  '/components/TaskModal.tsx',
  '/components/ConfirmationModal.tsx',
  '/components/SettingsModal.tsx',
  '/components/ApiKeyModal.tsx',
  '/components/LoginModal.tsx',
  '/components/Notification.tsx',
  '/components/Icons.tsx',
  '/components/MobileApp.tsx',
  '/hooks/useDataManager.ts',
  '/services/geminiService.ts',
  '/services/promptService.ts',
  '/manifest.webmanifest',
];

// Create a promise that resolves when Babel is loaded and ready.
const babelReadyPromise = new Promise((resolve, reject) => {
  try {
    self.importScripts(BABEL_URL);
    if (self.Babel) {
      console.log('Babel loaded successfully in Service Worker.');
      resolve(self.Babel);
    } else {
      reject(new Error("Babel object not found after script import."));
    }
  } catch (error) {
    console.error("Failed to import Babel:", error);
    reject(error);
  }
});

// Event: install - Cache the app shell
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then((cache) => {
        console.log('Opened cache and caching app shell');
        return cache.addAll(ASSETS_TO_CACHE);
      })
      .then(() => self.skipWaiting())
      .catch(error => {
        console.error('Failed to cache app shell:', error);
      })
  );
});

// Event: activate - Clean up old caches
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cacheName) => {
          if (cacheName !== CACHE_NAME) {
            console.log('Deleting old cache:', cacheName);
            return caches.delete(cacheName);
          }
        })
      );
    }).then(() => self.clients.claim())
  );
});

// Intercept fetch requests
self.addEventListener('fetch', (event) => {
  const { request } = event;
  const url = new URL(request.url);

  // Handle .ts/.tsx files with transpilation (existing logic)
  if (url.origin === self.location.origin && (url.pathname.endsWith('.tsx') || url.pathname.endsWith('.ts'))) {
    event.respondWith(transpileAndServe(request));
    return; // Stop processing further for these files
  }

  // Handle other requests with a cache-first strategy
  event.respondWith(
    caches.match(request)
      .then((response) => {
        // Cache hit - return response
        if (response) {
          return response;
        }

        // Not in cache - go to network
        return fetch(request).then(
          (networkResponse) => {
            // Check if we received a valid response to cache
            if (!networkResponse || networkResponse.status !== 200 || networkResponse.type !== 'basic') {
              return networkResponse;
            }

            const responseToCache = networkResponse.clone();
            caches.open(CACHE_NAME)
              .then((cache) => {
                cache.put(request, responseToCache);
              });

            return networkResponse;
          }
        ).catch(error => {
            console.error('Fetch failed; app might be offline.', error);
            // Optional: You could return a specific offline fallback page here
            // e.g., return caches.match('/offline.html');
        });
      })
  );
});

async function transpileAndServe(request) {
  try {
    // Crucially, wait for Babel to be ready before proceeding.
    const babel = await babelReadyPromise;
    
    const fileContentResponse = await fetch(request);

    if (!fileContentResponse.ok) {
        return fileContentResponse; // Pass through errors like 404
    }
    
    const fileContent = await fileContentResponse.text();

    // Transpile the code using Babel
    const transformedCode = babel.transform(fileContent, {
      presets: ['react', 'typescript'],
      filename: request.url, // Helps Babel with source maps and error messages
    }).code;

    // Create a new Response object with the transpiled JavaScript code
    return new Response(transformedCode, {
      headers: {
        'Content-Type': 'application/javascript; charset=utf-8'
      }
    });

  } catch (error) {
    console.error(`Error transpiling ${request.url}:`, error);
    // Return an error response that is still valid JavaScript
    const errorMsg = `/* Transpilation Error in ${request.url}: ${error.message.replace(/\*/g, '')} */`;
    return new Response(errorMsg, {
      status: 500,
      headers: {
        'Content-Type': 'application/javascript; charset=utf-8'
      }
    });
  }
}
