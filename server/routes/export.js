// Exporting TipTap documents as .pdf-files
// Importing server functions
const express = require("express");
const router = express.Router();
const fs = require("fs");
const path = require("path");
const puppeteer = require("puppeteer"); // Puppeteer converts HTML into PDF.

// Importing TipTap Extensions for Export
const StarterKit = require("@tiptap/starter-kit").default;
const Image = require("@tiptap/extension-image").default;
const { TableKit } = require("@tiptap/extension-table");
const { renderToHTMLString } = require("@tiptap/static-renderer");
const FileHandler = require("@tiptap/extension-file-handler").default;
const Emoji = require("@tiptap/extension-emoji").default;

// Configures all the TipTap extensions to be identical to editor.js
async function setExtensions() {
  // Importing Extensions which cannot be imported (no commonjs version)
  const { default: CodeBlockLowlight } =
    await import("@tiptap/extension-code-block-lowlight");
  const { createLowlight, all } = await import("lowlight");

  const lowlight = createLowlight(all);

  return [
    StarterKit.configure({
      codeBlock: false, // Disabling codeBlock so that Syntax Highlighting works properly
    }),
    TableKit,
    ListKit,
    Image.configure({
      inline: true,
      resize: {
        enabled: true,
        directions: ["top", "bottom", "left", "right"], // can be any direction or diagonal combination
        minWidth: 50,
        minHeight: 50,
        alwaysPreserveAspectRatio: true,
      },
    }),
    FileHandler.configure({
      allowedMimeTypes: ["image/png", "image/jpg", "image/gif"],
      consumePasteEvent: true,
      onPaste: async (editor, files, htmlContent) => {
        for (const file of files) {
          const url = await uploadImage(file);
          editor.chain().setImage({ src: url }).run();
        }
      },
    }),
    Emoji,
    CodeBlockLowlight.configure({
      lowlight,
      enableTabIndentation: true,
      tabSize: 2,
    }),
  ];
}

// Processes HTML and converts it into PDF
router.post("/api/export", async (req, res) => {
  const { exportDocument, name } = req.body;

  // Basic HTML structure.
  // The HTML from the request only includes the editor data, so stylesheets and stuff have to be set here.
  const exportHTML = `
  <html>
  <head>
    <link rel="stylesheet" href="http://localhost:8511/css/format.css" />
    <link rel="stylesheet" href="http://localhost:8511/css/syntax.css" />
  </head>
  <body>
    <div class="export-content">
      ${exportDocument}
    </div>
  </body>
  </html>
  `;

  // Simulated browser which Puppeteer uses to generate the PDF.
  const browser = await puppeteer.launch({
    args: ["--allow-file-access-from-files"],
  });
  // Creates new simulated page.
  const page = await browser.newPage();
  // Sets the page content to the exportHTML
  const content = await page.setContent(exportHTML, {
    waitUntil: "networkidle0",
  });

  // Converts the page into a PDF with specifications.
  const pdf = await page.pdf({
    format: "A4",
    printBackground: true,
    margin: { top: "75px", bottom: "75px", left: "75px", right: "75px" },
  });
  // Closes the simulated browser.
  await browser.close();

  // Sends the PDF back to the client.
  res.setHeader("Content-Type", "application/pdf");
  res.setHeader(
    "Content-Disposition",
    `attachment; filename=${req.body.name}.pdf`,
  );
  res.send(pdf);
});

module.exports = router;
