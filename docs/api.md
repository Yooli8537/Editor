# API Endpoints

All of the API Endpoints including request and response data, what each endpoint does and the URL to use.

## server.js

### GET /api/getMaster

Gets the full data from `master.json`.

Response:
    { master.json[0] }

### PUT /api/updateMaster

Overwrites the entire `master.json` file.

Headers: { "Content-Type": "application/json" }
Body: { "data": [master.json] }

Response: { "success": true }

### PUT /api/updateMasterProperty

Overwrites a single `master.json` property.

Headers: { "Content-Type": "application/json" }
Body: { "property": "unsavedFiles", "newValue": [] }

Response: { "success": true }
