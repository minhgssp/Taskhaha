// sw.js - Service Worker for in-browser transpilation of TSX/TS files

const BABEL_URL = 'https://unpkg.com/@babel/standalone/babel.min.js';

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


// Intercept fetch requests
self.addEventListener('fetch', (event) => {
  const { request } = event;
  const url = new URL(request.url);

  // Only intercept requests for .ts and .tsx files from our own origin
  if (url.origin === self.location.origin && (url.pathname.endsWith('.tsx') || url.pathname.endsWith('.ts'))) {
    event.respondWith(transpileAndServe(request));
  }
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

// This forces the waiting service worker to become the active service worker.
self.addEventListener('install', (event) => {
  event.waitUntil(self.skipWaiting());
});

// This claims control of the page as soon as the service worker activates.
self.addEventListener('activate', (event) => {
  event.waitUntil(self.clients.claim());
});