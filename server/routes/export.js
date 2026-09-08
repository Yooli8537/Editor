// Exporting TipTap documents as .pdf-files
// Importing server functions
const express = require("express");
const router = express.Router();
const serverMaster = require("../serverMaster");
const logger = require("../logger");
const error = require("../error");
const puppeteer = require("puppeteer"); // Puppeteer converts HTML into PDF.

// Processes HTML and converts it into PDF
router.post("/api/export", async (req, res) => {
  const { exportDocument, name } = req.body;
  if (serverMaster.detailLogs) {
    logger.info({ "Document name": name }, "Recived document export request.");
  }

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
  try {
    if (serverMaster.detailLogs) {
      logger.info("Launching simulated browser.");
    }
    // Simulated browser which Puppeteer uses to generate the PDF.
    const browser = await puppeteer.launch({
      args: ["--allow-file-access-from-files"],
    });
    // Creates new simulated page.
    const page = await browser.newPage();
    // Sets the page content to the exportHTML
    const content = await page.setContent(exportHTML, {
      // Waits until no network activities are active, ensuring that all async functions and similar
      waitUntil: "networkidle0",
    });

    if (serverMaster.detailLogs) {
      logger.info("Converting HTML to PDF.");
    }
    // Converts the page into a PDF with specifications.
    const pdf = await page.pdf({
      format: "A4",
      printBackground: true,
      margin: { top: "75px", bottom: "75px", left: "75px", right: "75px" },
    });

    if (serverMaster.detailLogs) {
      logger.info("Closing simulated browser.");
    }
    // Closes the simulated browser.
    await browser.close();

    // Sends the PDF back to the client.
    res.setHeader("Content-Type", "application/pdf");
    res.setHeader(
      "Content-Disposition",
      `attachment; filename=${req.body.name}.pdf`,
    );
    res.send(pdf);
    if (serverMaster.successLogs) {
      logger.info("Sent PDF-Export to Client.");
    }
  } catch (err) {
    res
      .status(500)
      .json(error("PDF export", "Failed to export PDF.", { Name: name }, err));
  }
});

module.exports = router;
