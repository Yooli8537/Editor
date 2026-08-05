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

const extensions = [StarterKit, TableKit, Image, FileHandler, Emoji];

router.post("/api/export", async (req, res) => {
  const { exportDocument, name } = req.body;

  const editorHTML = renderToHTMLString({
    extensions,
    content: exportDocument,
  });

  console.log(editorHTML);

  const exportHTML = `
  <html>
  <head>
    <link rel="stylesheet" href="http://localhost:8511/css/style.css" />
    <link rel="stylesheet" href="http://localhost:8511/css/editor.css" />
  </head>
  <body>
    ${editorHTML}
  </body>
  </html>
  `

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
