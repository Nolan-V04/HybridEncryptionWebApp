# Hybrid Encryption File Transfer System

Full-stack web application for secure file transfer using hybrid encryption:
- Asymmetric: RSA-OAEP (2048-bit keys)
- Symmetric: AES-256-GCM (random session key per file)

## Project Structure

- backend: Express API, crypto service, optional Mongo metadata persistence
- frontend: React + Vite UI for sender/receiver flows

## Backend APIs

- POST /api/keys/generate
  - Returns PEM-formatted RSA key pair
- POST /api/encrypt
  - Multipart form-data:
    - file: any file
    - publicKey: receiver public key PEM text
  - Returns downloadable .hybrid payload
- POST /api/decrypt
  - Multipart form-data:
    - file: .hybrid payload
    - privateKey: receiver private key PEM text
  - Returns original file bytes

## Example .hybrid Payload

{
  "version": 1,
  "algorithm": {
    "asymmetric": "RSA-OAEP-SHA256",
    "symmetric": "AES-256-GCM"
  },
  "encrypted_key": "<base64>",
  "iv": "<base64>",
  "ciphertext": "<base64>",
  "tag": "<base64>",
  "original_name": "document.pdf",
  "mime_type": "application/pdf"
}

## Run Instructions

1. Backend setup
   - cd backend
   - npm install
   - copy .env.example to .env
   - optional: set MONGODB_URI for metadata storage
   - npm run dev

2. Frontend setup
   - cd frontend
   - npm install
   - optional: set VITE_API_URL in .env (default http://localhost:5000/api)
   - npm run dev

3. Open UI
   - Visit http://localhost:5173
   - Use Encrypt tab for sender workflow
   - Use Decrypt tab for receiver workflow

## Security Notes

- Private keys are never persisted by backend
- Session keys are generated per file and never stored
- AES-GCM authentication tag is verified during decryption
- Decryption failures return safe error messages
