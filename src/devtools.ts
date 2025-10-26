/// <reference types="chrome" />

// Create the DevTools panel
chrome.devtools.panels.create(
  'AssetSieve', // Panel title
  'icon16.png', // Icon (optional, using placeholder name)
  'panel.html', // Panel HTML file
  function (_panel: chrome.devtools.panels.ExtensionPanel) {
    // Panel created
  },
)
