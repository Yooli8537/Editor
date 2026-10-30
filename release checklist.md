# Release Checklist

- Create fresh clone of newest commit and check if fresh install works.
- Name new version in Changelog
- Update version under Server -> server.js -> allProperties -> version
- Update version under Settings -> Info -> Version
- Update link under Settings -> Info -> Version
- Commit changes & push
- Delete "version" property in master.json
- Merge & Delete Branch
- Create release
- Copy Changelog into release
- Publish Release
- Switch to a new branch `git checkout -b "Development+vNEWLY.RELEASED.VERSION"`.
- Publish branch
- Add Unreleased section to Changelog
