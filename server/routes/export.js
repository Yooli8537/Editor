const express = require("express");
const router = express.Router();
const fs = require("fs");
const path = require("path");
const puppeteer = require("puppeteer");

// Importing TipTap Extensions for Export
const StarterKit = require("@tiptap/starter-kit").default;
const Image = require("@tiptap/extension-image").default;
const { TableKit } = require("@tiptap/extension-table");
const { renderToHTMLString } = require("@tiptap/static-renderer");
const FileHandler = require("@tiptap/extension-file-handler").default;
const Emoji = require("@tiptap/extension-emoji").default;

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

router.post("/api/export", async (req, res) => {
  const { exportDocument, name } = req.body;

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

  const browser = await puppeteer.launch({
    args: ["--allow-file-access-from-files"],
  });
  const page = await browser.newPage();
  const content = await page.setContent(exportHTML, {
    waitUntil: "networkidle0",
  });

  const pdf = await page.pdf({
    format: "A4",
    printBackground: true,
    margin: { top: "75px", bottom: "75px", left: "75px", right: "75px" },
  });
  await browser.close();

  res.setHeader("Content-Type", "application/pdf");
  res.setHeader(
    "Content-Disposition",
    `attachment; filename=${req.body.name}.pdf`,
  );
  res.send(pdf);
});

module.exports = router;
