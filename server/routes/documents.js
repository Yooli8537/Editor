const { error } = require("console");
const express = require("express");
const router = express.Router();
const fs = require("fs");
const path = require("path");

// Gets full data folder
async function readDirRecursive(dir) {
  const entries = await fs.promises.readdir(dir, {
    withFileTypes: true,
  });

  return Promise.all(
    entries.map(async (entry) => {
      const fullPath = path.join(dir, entry.name);

      if (entry.isDirectory()) {
        return {
          name: entry.name,
          isFolder: true,
          children: await readDirRecursive(fullPath),
        };
      } else {
        return {
          name: entry.name,
          isFolder: false,
        };
      }
    }),
  );
}

async function searchNotebooks(dir, key, searchResults) {
  const entries = await fs.promises.readdir(dir, {
    withFileTypes: true,
  });

  return Promise.all(
    entries.map(async (entry) => {
      const fullPath = path.join(dir, entry.name);

      if (entry.isDirectory()) {
        return searchNotebooks(fullPath, key, searchResults);
      } else {
        const file = await fs.promises.readFile(fullPath, "utf-8");
        const praseFile = JSON.parse(file);
        return findText(
          praseFile[0].content,
          key,
          fullPath,
          searchResults,
          praseFile[0].title,
        );
      }
    }),
  );
}

function findText(node, key, file, searchResults, fileTitle) {
  if (fileTitle) {
    if (fileTitle.includes(key) && !searchResults.includes(file)) {
      searchResults.push(file);
    }
  }

  if (node.type === "text") {
    if (node.text.includes(key) && !searchResults.includes(file)) {
      searchResults.push(file);
    }
  }

  if (node.content) {
    node.content.forEach((child) => findText(child, key, file, searchResults));
  }

  return;
}

// GET all documents
router.get("/api/documents", async (req, res) => {
  const data = path.join(__dirname, "../../data");
  const resposneArray = await readDirRecursive(data);

  res.json(resposneArray);
});

router.get("/api/documents/search", async (req, res) => {
  const { key } = req.query;
  const searchResults = [];
  const data = path.join(__dirname, "../../data");
  await searchNotebooks(data, key, searchResults);

  console.log(searchResults);

  // Results that can be used by the Sidebar loading function
  const relativeResults = searchResults.map((fullPath) => ({
    path: path.relative(data, fullPath),
    name: path.basename(fullPath),
    folderPath: path.relative(data, path.dirname(fullPath)),
  }));

  res.json(relativeResults);
});

// Create new Notebook
router.post("/api/documents/newNotebook", async (req, res) => {
  const { name } = req.body;

  try {
    await fs.promises.mkdir(path.join(__dirname, "../../data", name));
    res.json({ success: true });
  } catch (err) {
    console.error(err);
    if (err.code === "EEXIST") {
      res
        .status(409)
        .json({ error: "A Notebook with that name already exists" });
    } else {
      res.status(500).json({ error: "Failed to create Notebook" });
    }
  }
});

// Create new File
router.post("/api/documents/newFile", async (req, res) => {
  const { name, folderPath } = req.body;
  const defaultContent = JSON.stringify(
    [
      {
        title: name,
        content: {
          type: "doc",
          content: [{ type: "paragraph" }],
        },
      },
    ],
    null,
    2,
  );

  try {
    if (name && folderPath) {
      const location = path.join(__dirname, "../../data", folderPath, name);
      await fs.promises.writeFile(location + ".json", defaultContent, "utf8");
      res.json({ success: true });
    } else if (name) {
      console.error("No Folder Path found.");
    } else if (folderPath) {
      console.error("No Name found.");
    } else {
      console.error("Required values not found for operation.");
    }
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to create File" });
  }
});

// Create new Folder
router.post("/api/documents/newFolder", async (req, res) => {
  const { name, folderPath } = req.body;

  try {
    if (name && folderPath) {
      await fs.promises.mkdir(
        path.join(__dirname, "../../data", folderPath, name),
      );
      res.json({ success: true });
    } else if (name) {
      console.error("No Folder Path found.");
    } else if (folderPath) {
      console.error("No Name found.");
    } else {
      console.error("Required values not found for operation.");
    }
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to create Folder" });
  }
});

// Delete Folder / File
router.delete("/api/documents/deletePath", async (req, res) => {
  // Originally only meant for folders but works for Files too... Happy accidents :)
  const { name, folderPath } = req.body;

  try {
    if (name && folderPath) {
      const fullFolderPath = path.join(__dirname, "../../data", folderPath);

      await fs.promises.rm(fullFolderPath, { recursive: true, force: true });
      res.send("Path successfully deleted.");
    } else if (name) {
      console.error("No Folder Path found.");
    } else if (folderPath) {
      console.error("No Name found.");
    } else {
      console.error("Required values not found for operation.");
    }
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to fulfill deletion Request." });
  }
});

// GET single File
router.get("/api/documents/getFile", async (req, res) => {
  const { name, folderPath } = req.query;

  const fullFolderPath = path.join(__dirname, "../../data", folderPath, name);
  const file = await fs.promises.readFile(fullFolderPath);
  res.send(JSON.parse(file));
});

// Rename single File
router.post("/api/documents/renameFile", async (req, res) => {
  console.log(req.body);
  const { newName, folderPath, name } = req.body;

  const baseName = path.parse(name).name;
  const filePath = path.join(
    __dirname,
    "../../data",
    folderPath,
    baseName + ".json",
  );
  const newFilePath = path.join(
    __dirname,
    "../../data",
    folderPath,
    newName + ".json",
  );

  try {
    if (newName && folderPath && name) {
      await fs.promises.rename(filePath, newFilePath);

      // Changing Title inside Document
      const fileContent = await fs.promises.readFile(newFilePath, "utf-8");
      const fileData = JSON.parse(fileContent);
      fileData[0].title = newName;
      await fs.promises.writeFile(
        newFilePath,
        JSON.stringify(fileData, null, 2),
        "utf-8",
      );

      res.json({ success: true });
    } else if (!newName || newName == "") {
      console.error("No new Name found");
    } else if (!folderPath) {
      console.error("No Folder Path found.");
    } else if (!name) {
      console.error("No File found.");
    } else {
      console.error(
        "Multiple values which are required for renaming a File were not found.",
      );
    }
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to rename File." });
  }
});

// Rename Folder
router.post("/api/documents/renameFolder", async (req, res) => {
  console.log(req.body);
  const { newName, folderPath, name } = req.body;

  const currentPath = path.join(__dirname, "../../data", folderPath, name);
  const newPath = path.join(__dirname, "../../data", folderPath, newName);
  /*
  If a Folder is in the "root" directory, no folderPath will be recieved.
  This exception requires a different path to be built.
  */
  const rootPath = path.join(__dirname, "../../data", name);
  const newRootPath = path.join(__dirname, "../../data", newName);

  try {
    if (newName && folderPath && name) {
      await fs.promises.rename(currentPath, newPath);

      res.json({ success: true });
      return;
    } else if (newName && name) {
      await fs.promises.cp(currentPath, newPath, { recursive: true });
      await fs.promises.rm(currentPath, { recursive: true, force: true });

      res.json({ success: true });
    } else if (!newName || newName == "") {
      console.error("No new Name found");
    } else if (!folderPath) {
      console.error("No Folder Path found.");
    } else if (!name) {
      console.error("No Folder found.");
    } else {
      console.error(
        "Multiple values which are required for renaming a Folder were not found.",
      );
    }
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to rename Folder." });
  }
});

router.put("/api/documents/updateFile", async (req, res) => {
  const { saveData, name, folderPath } = req.body;

  const filePath = path.join(__dirname, "../../data", folderPath, name);
  const file = await fs.promises.readFile(filePath, "utf-8");

  console.log(saveData.content);
  const fileData = JSON.parse(file);
  fileData[0].content = saveData;

  await fs.promises.writeFile(
    filePath,
    JSON.stringify(fileData, null, 2),
    "utf8",
  );
  res.json({ success: true });
});

// Autosaves
router.post("/api/documents/autosave", async (req, res) => {
  const { name, folderPath, saveData } = req.body;
  const defaultContent = JSON.stringify(
    [
      {
        title: name,
        content: saveData,
      },
    ],
    null,
    2,
  );

  try {
    if (name && folderPath) {
      const location = path.join(__dirname, "../../data", folderPath, name);
      await fs.promises.writeFile(location, defaultContent, "utf8");
      res.json({ success: true });
    } else if (name) {
      console.error("No Folder Path found.");
    } else if (folderPath) {
      console.error("No Name found.");
    } else {
      console.error("Required values not found for operation.");
    }
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to create Autosave" });
  }
});

module.exports = router;
