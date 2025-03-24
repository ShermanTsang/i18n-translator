#!/usr/bin/env node

try {
  // Use dynamic import to load and run the main module
  import('../.output/dist/index.js')
    .catch(err => {
      console.error('Failed to import the main module:', err);
      process.exit(1);
    });
} catch (error) {
  console.error('Error executing i18n-translator:', error);
  process.exit(1);
}
