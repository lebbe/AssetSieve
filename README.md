# AssetSieve

**AssetSieve** is a Chrome DevTools extension designed for personal use. It allows you to capture, manage, and export image assets that are dynamically loaded on a webpage. The primary use case is for creating personal PDF archives of digitally owned magazines or comics where images are loaded sequentially as the user navigates.

**This tool is intended strictly for personal archiving and not for piracy or illegal distribution.**

---

### Core Features

1.  **Network Monitoring**:

    - Actively listens to network traffic within the inspected tab using the `chrome.devtools.network` API.
    - Automatically identifies and captures image files (`jpeg`, `png`, `webp`, etc.) as they are loaded.

2.  **Image Asset Management**:

    - Displays all captured images in a dedicated list within the DevTools panel.
    - For each image, it shows a thumbnail preview, filename, image resolution, and the full URL path.
    - Provides tools to manage the captured assets:
      - **Search**: A text input to find images by filename or path.
      - **Filter**: Options to filter out images based on criteria like minimum resolution (to exclude thumbnails and icons).
      - **Sort**: Automatically sort images by filename to establish a logical initial order.

3.  **Manual Reordering**:

    - Features a drag-and-drop interface, allowing you to manually reorder the captured images into the precise sequence required for the final document.

4.  **Export Functionality**:
    - **Save to PDF**: Generates a single, consolidated PDF file from the sorted images. This is achieved by creating a temporary print-friendly HTML page and invoking the browser's "Save as PDF" functionality. Each image is placed on its own page.
    - **Save Individual Images**: Allows you to download all the selected images as individual files to your local machine using the `chrome.downloads` API.

---

### How It Works: The PDF Generation Process

The "Print to PDF" feature is designed for simplicity and reliability.

1.  **Tab Creation**: When you request a PDF export, the extension creates a new, hidden browser tab.
2.  **Content Injection**: It then dynamically builds an HTML page in that tab, embedding each of your sorted images in order using their base64 data.
3.  **Print Styling**: A special CSS rule (`page-break-after: always;`) is applied to ensure every image starts on a new page in the final document.
4.  **Print Trigger**: Finally, it programmatically triggers the browser's print dialog.
5.  **User Action**: You simply select "Save as PDF" as the printer destination and save the file to your computer.
