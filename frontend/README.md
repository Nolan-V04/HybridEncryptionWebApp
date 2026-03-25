# Frontend

React client for the Hybrid Encryption File Transfer System.

## Features

- Encrypt tab: upload file + public key and download .hybrid payload
- Decrypt tab: upload .hybrid payload + private key and recover original file
- Drag-and-drop uploader
- Key generation shortcut via backend API

## Development

1. Install dependencies
	- npm install
2. Optional API override
	- Create .env and set VITE_API_URL=http://localhost:5000/api
3. Start dev server
	- npm run dev

## Build

- npm run build
- npm run preview
