const { bulletListInputRegex } = require("@tiptap/extension-list");
const express = require("express");
const router = express.Router();
const fs = require("fs");
const path = require("path");
const puppeteer = require("puppeteer");

let exportHTML;

// Preparing JSON as HTML for Puppeteer Export
function convertToHTML(node) {
  console.log(node);

  let children;
  if (node.content) {
    children = node.content.map((child) => convertToHTML(child)).join("");
  } else {
    children = "";
  }

  if (node.type === "doc") return children; // "Root" of the Document
  if (node.type === "text") {
    let text = node.text;

    // Handles special Formatting
    if (node.marks) {
      for (let i = 0; i < node.marks.length; i++) {
        if (node.marks[i].type === "bold") text = `<strong>${text}</strong>`;
        if (node.marks[i].type === "italic") text = `<em>${text}</em>`;
        if (node.marks[i].type === "underline") text = `<u>${text}</u>`;
        if (node.marks[i].type === "code") text = `<code>${text}</code>`;
        console.log(node.marks[i].attrs);
        if (node.marks[i].type === "link")
          text = `<a target="${node.marks[i].attrs.target}" rel="${node.marks[i].attrs.rel}" href="${node.marks[i].attrs.href}">${text}</a>`;
      }
    }
    return text;
  }
  if (node.type === "paragraph") {
    return `<p>${children}</p>`;
  }
  if (node.type === "heading")
    if (node.attrs.level === 1) {
      return `<h1>${children}</h1>`;
    } else if (node.attrs.level === 2) {
      return `<h2>${children}</h2>`;
    } else if (node.attrs.level === 3) {
      return `<h3>${children}</h3>`;
    }
  if (node.type === "bulletList") return `<ul>${children}</ul>`;
  if (node.type === "orderedList")
    return `<ol start="${node.attrs.start}">${children}</ol>`;
  if (node.type === "taskList")
    return `<ul data-type="taskList">${children}</ul>`;
  if (node.type === "taskItem") {
    const checked = node.attrs.checked ? "checked" : "";
    return `<li><label contenteditable="false"><input aria-label="Task item checkbox for false" type="checkbox" ${checked}></label><div>${children}</div></li>`;
  }
  if (node.type === "listItem") return `<li>${children}</li>`;
  if (node.type === "codeBlock") return `<pre><code>${children}</code></pre>`;
  if (node.type === "table") return `<table><tbody>${children}</tbody></table>`;
  if (node.type === "tableRow") return `<tr>${children}</tr>`;
  if (node.type === "tableHeader")
    return `<th colspan="${node.attrs.colspan}" rowspan="${node.attrs.rowspan}">${children}</th>`;
  if (node.type === "tableCell")
    return `<td colspan="${node.attrs.colspan}" rowspan="${node.attrs.rowspan}">${children}</td>`;
  if (node.type === "image")
    return `<img src="${node.attrs.src}" alt="${node.attrs.alt}">`;
}

router.post("/api/export", async (req, res) => {
  console.log(req.body.exportDocument.content);
  exportHTML = `<html>
  <head>
    <style>
     body {overflow-y: auto; overflow-x: auto; font-family: Calibri, sans-serif; font-weight: 500; margin: 0 auto;}
     li p {margin: 0;}
     table {border-collapse: collapse; width: 100%; table-layout: fixed;}
     th, td {border: 1px solid #ccc; padding: 8px; text-align: left;}
     th {background-color: #f5f5f5; font-weight: bold;}
     ul[data-type="taskList"] {list-style: none; padding: 0;}
     ul[data-type="taskList"] li {display: flex; align-items: center; gap: 8px;}
     ul[data-type="taskList"] li > label { display: flex; align-items: center;}
     pre {background-color: #222222; border-radius: 1px;}
     code {background-color: #cdcdcd; padding: 2px 4px; border-radius: 4px;}
     pre code {background-color: inherit; color: #a5dad9; padding: 0;}
     h1 {margin: 5px;}
     h2 {margin: 3px;}
     h3 {margin: 1px;}
    </style>
  </head>
  <body>`;
  exportHTML += convertToHTML(req.body.exportDocument);
  exportHTML += `</body></html>`;

  console.log(exportHTML);

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
    margin: { top: "75px", bottom: "75px", left: "75px", right: "75px" }
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
