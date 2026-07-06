# DocVault (File Manager)

DocVault is a modern, premium file management web application that lets users upload, organize, search, preview, and share files. It is built using a React (TypeScript) frontend powered by Vite, and a Node.js/Express backend integrated with MongoDB GridFS for robust, scalable file storage.

## Key Features

- **Robust File Storage**: Files are saved asynchronously in MongoDB via GridFS bucket streams, bypassing local disk limitations and ensuring production scalability.
- **Recursive Folder Downloads (ZIP)**: Download entire folder structures (including deeply nested folders and files) in a single `.zip` file. Uses in-memory buffering to prevent race conditions during zipping.
- **Cross-Origin Safe Downloads**: Implements blob-based download handling (`fetch` & local blob URLs) on the frontend to circumvent browser security policies blocking cross-origin `download` attributes (e.g., when hosting frontend on Vercel and backend on Render).
- **Inline Previews**: Built-in support for viewing PDF documents and Markdown (`.md`) files inline in the browser, with correct mime-type headers.
- **Rich Markdown Viewer**: Interactively view markdown files inside a custom modal, copy raw text to the clipboard, and download files directly from the preview pane.
- **Folder Navigation & Operations**: Create, rename, move, copy, and soft-delete (Trash) files and folders.
- **Favorites & Search**: Star important documents for quick access and filter assets by categories.
- **Public & Temporary Sharing**: Share files or entire folders publicly with options for expiration times. Includes a responsive public share landing page.

---

## Technology Stack

### Frontend

- **Framework**: React (TypeScript) with Vite
- **Styling**: Tailwind CSS
- **State & Data Fetching**: TanStack Query (React Query)
- **Routing**: React Router DOM
- **Icons**: Lucide React

### Backend

- **Runtime**: Node.js & Express (TypeScript)
- **Database**: MongoDB & Mongoose
- **Storage System**: MongoDB GridFS Bucket
- **Multipart Upload**: Multer (Memory Storage)
- **Archiving**: Archiver (CommonJS v5 with TS typings pinned to prevent build failures)

---

## Directory Structure

```
├── backend/            # Express.js server & API routes
│   ├── src/
│   │   ├── models/     # Mongoose schemas (File, Folder)
│   │   ├── routes/     # Express API routes (file, folder, share, storage)
│   │   └── index.ts    # Main entry point & MongoDB connection
│   ├── package.json
│   └── tsconfig.json
│
├── frontend/           # React SPA client
│   ├── src/
│   │   ├── api/        # Client API helper methods (Axios-like fetch requests)
│   │   ├── components/ # Reusable UI components (FileCard, FolderCard, MarkdownPreviewModal, etc.)
│   │   ├── hooks/      # Custom React hooks
│   │   └── main.tsx    # Client entry point
│   ├── package.json
│   └── tailwind.config.js
```

---

## Getting Started

### Prerequisites

- Node.js (v18+)
- MongoDB running locally (or a MongoDB Atlas connection string)

### 1. Setup Backend

Navigate to the `backend` directory, install dependencies, configure environment variables, and start the development server:

```bash
cd backend
npm install

# Create a .env file:
# PORT=5000
# MONGODB_URI=mongodb://localhost:27017/file-manager

npm run dev
```

### 2. Setup Frontend

Open a new terminal session, navigate to the `frontend` directory, install dependencies, and start the Vite dev server:

```bash
cd frontend
npm install

# Create a .env file:
# VITE_API_URL=http://localhost:5000/api

npm run dev
```

The frontend will run at `http://localhost:5173` (or the port indicated in your console) and proxy requests to your backend on port `5000`.

---

## Development Insights & Implementation Details

### Recursive Zipping Mechanism

The backend traverses nested folder directories recursively. Since GridFS read streams are asynchronous, piping them raw would cause the ZIP stream to finalize before data completed streaming in cloud environments. To prevent empty/corrupted archives in production, the backend buffers each file chunk into memory via a custom Promise wrapper before calling `archive.append()`.

### Cross-Origin File Download Fix

Modern browsers prevent the `download` attribute on anchor tags (`<a>`) if the destination URL points to a different origin (e.g. frontend on Vercel, backend on Render).
To fix this:

1. The backend implements `?attachment=1` which changes the header to `Content-Disposition: attachment`.
2. The frontend fetches the resource as a raw binary `Blob` object, creates a temporary local object URL via `URL.createObjectURL(blob)`, and triggers an programatic trigger on an anchor tag.
