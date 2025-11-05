# AssetSieve: A Web Archiving Tool

**AssetSieve** is a powerful Chrome extension that captures, organizes, and exports images from any website. Effortlessly create PDFs from digital magazines, reassemble high-resolution art from museum archives, or simply download all images from a gallery. Stop juggling screenshots and manual saves—let AssetSieve automate your digital archiving.

It includes specialized parsers for complex content formats like FlippingBook and IIIF, a visual magazine layout editor called MagForge for creating custom PDF publications, and a full-featured network inspector, making it an indispensable tool for developers, archivists, and security researchers.

---

## Usage Workflow

1.  Navigate to the target website.
2.  Open Chrome DevTools (`F12` or `Cmd+Opt+I`).
3.  Select the **"AssetSieve"** tab from the panel options.
4.  The extension starts listening to network traffic by default. Browse the website to begin capturing assets.
5.  Use the different tabs (`Images`, `FlippingBook`, `IIIF`, `MagForge`) to manage captured assets or the `Traffic` tab to analyze all network requests.
6.  Organize the collected assets using filters, sorting, and drag-and-drop.
7.  Export your collection as a PDF or download individual files.

---

## Core Functionality

### 1. Images Tab (General Use)

This mode intercepts standard image requests as they load.

- **Use Case**: Capturing assets from blogs, image galleries, and most standard websites.
- **Pro-Tip**: Set minimum dimension filters (e.g., `width > 500`) to exclude thumbnails and UI elements.

### 2. FlippingBook Tab

Optimized for publications built with FlippingBook.com. It intelligently detects and pairs `WebP` background images with their `SVG` text overlays to reconstruct complete, high-fidelity pages.

- **Use Case**: Archiving digital magazines and catalogs you have legitimate access to.
- **Configuration**: The default regex (`page\d{4}_3\.webp`) should work for most publications, but can be adjusted.

### 3. IIIF Tab

For capturing ultra-high-resolution images from sources using the [International Image Interoperability Framework](https://iiif.io/) (IIIF).

- **Use Case**: Archiving digitized books, manuscripts, and artwork from museum and library collections (e.g., National Library of Norway, Europeana).
- **Mechanism**: Automatically detects and captures image "tiles" and stitches them back into a single, complete high-resolution image on the client side.

### 4. MagForge Tab

A visual magazine layout editor for creating custom PDF publications from captured images.

- **Use Case**: Creating professional-looking magazines, photo albums, portfolios, or multi-page documents from collected images.
- **Features**:
  - Drag-and-drop images onto pages to arrange your layout.
  - Multi-page document creation with easy page management (add, remove, reorder).
  - Customizable page formats (A4 Portrait/Landscape, Letter, Legal, etc.).
  - Image filtering by name, dimensions, and usage status.
  - Visual canvas editor with zoom controls for precise positioning.
  - Export to PDF with custom magazine name and creator information.

### 5. Traffic Tab (Network Analysis)

A comprehensive network analysis utility built into the extension. This provides a more powerful and export-focused alternative to the browser's native Network tab.

- **Features**:
  - Advanced filtering by URL, HTTP method, status code, content type, and size.
  - Multi-criteria sorting.
  - Export filtered request data as JSON or CSV.
  - Copy request summaries to the clipboard.
- **Use Case**: Debugging, performance analysis, API inspection, and security auditing.

---

## Installation from Source

This extension is intended to be installed locally from source.

### Steps

1.  **Go to [relases](https://github.com/lebbe/AssetSieve/releases)**

2.  **Download the `AssetSieve.zip` asset on the latest releasep**

3.  Unzip the downloaded release

4.  **Load in Chrome**
    1.  Open Chrome and navigate to `chrome://extensions`.
    2.  Enable the **"Developer mode"** toggle, usually in the top-right corner.
    3.  Click **"Load unpacked"**.
    4.  Select the `AssetSieve/` directory created in the previous step.
    5.  The AssetSieve extension icon will appear in your browser's toolbar, and the panel will be available in DevTools.

---

## Legal and Privacy Notice

- **Local Processing**: All data collection and processing occur locally within your browser. No information is sent to any external server.
- **User Responsibility**: This tool is for personal, archival use of content you legally own or have explicit permission to access. Users are solely responsible for complying with all copyright laws, terms of service, and other legal agreements for any website they use this tool on. Do not use this tool for piracy or to circumvent paywalls. Do not redistribute content created with this tool without consent from the copyright holder.
