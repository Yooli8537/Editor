# API Endpoints

All of the API Endpoints including request and response data, what each endpoint does and the URL to use.

If you want to test these requests, a tool like [Hoppscotch](https://hoppscotch.io) is recommended.

## server.js

### GET /api/getMaster

Gets the full data from `master.json`.

Response:

``` JSON
{
    "unsavedFiles": [],
    "autosaveInterval": 10,
    ...
}
```

### PUT /api/updateMaster

Overwrites the entire `master.json` file.

Headers:

``` JSON
{ "Content-Type": "application/json" }
```

Body:

``` JSON
{
    "data": [
        {
            "unsavedFiles": [],
            "autosaveInterval": 10,
            ...
        }
    ]
}
```

Response:

``` JSON
{ "success": true }
```

### PUT /api/updateMasterProperty

Overwrites a single `master.json` property.

Headers:

``` JSON
{ "Content-Type": "application/json" }`
```

Body:

``` JSON
{
    "property": "unsavedFiles",
    "newValue": []
}
```

Response:

``` JSON
{ "success": true }
```

## documents.js

### GET /api/documents

Gets all of the notebooks, including subfolders and files (`~/Editor/data/notebooks`).

Response:

``` JSON
[
    {
        "name": "foldername",
        "isFolder": true,
        "children": [
            {
                "name": "filename.json",
                "isFolder": false
            }
        ]
    },
    {
        "name": "foldername 2",
        "isFolder": true,
        "children": [
            {
                "name": "childname",
                "isFolder": true,
                "children": []
            },
            {
                "name": "filename.json",
                "isFolder": false
            }
        ]
    }
]
```

### GET /api/documents/search

Searches through all the documents including title and content. Folder names are not included in the search.

Query Parameters:

``` Query Parameter
key="String"
```

Response:

``` JSON
[
    {
        "path": "full/path/on/the/FS.json",
        "name":"name of the file.json",
        "folderPath":"path/excluding/the/file"
    },
    { ... }
]
```

### POST /api/documents/newNotebook

Creates a new notebook. The path of this request is automatically set to `~/Editor/data/notebooks/`.

Headers:

``` JSON
{ "Content-Type": "application/json" }`
```

Body:

``` JSON
{ "name": "Very good and descriptive Notebook name which will be cut off by sliceIndex anyways" }
```

Response:

``` JSON
{ "success": true }
```

### POST /api/documents/newFile

Creates a new empty tiptap file.

Headers:

``` JSON

```

Body:

``` JSON
{
    "name": "Example Name",
    "folderPath": "Example/folder/path"
}
```

Response:

``` JSON
{ "success": true }
```
