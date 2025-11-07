# Drive Chatbot (Fullstack)

Proyecto de ejemplo: backend (Node.js + Express) que indexa PDFs de Google Drive y frontend (React + Vite) con un chat que responde usando contextos extraídos.

Pasos rápidos:
1. Completar `backend/.env.example` -> `.env` con tus credenciales.
2. `cd backend && npm install`
3. `node server.js`
4. Abrir `http://localhost:3001/auth/url` para autorizar Google Drive.
5. Hacer POST a `/index` con `{ "tokens": <tokens_de_oauth> }` para indexar PDFs.
6. `cd frontend && npm install && npm run dev` y abrir la app.
