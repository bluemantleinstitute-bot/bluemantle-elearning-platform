# Bluemantle Production Deployment

Use this as the final hosting checklist.

## 1. Backend Environment

Set these variables in the backend hosting provider, not in GitHub:

```env
NODE_ENV=production
PORT=5000
MONGO_URI=your_mongodb_atlas_uri
JWT_SECRET=your_64_plus_character_secret
FRONTEND_URL=https://your-frontend-domain.com
CORS_ORIGINS=https://your-frontend-domain.com
ZOOM_ACCOUNT_ID=your_zoom_account_id
ZOOM_CLIENT_ID=your_zoom_client_id
ZOOM_CLIENT_SECRET=your_zoom_client_secret
SDK_ID=your_zoom_meeting_sdk_id
SDK_SECRET=your_zoom_meeting_sdk_secret
YOUTUBE_API_KEY=your_youtube_api_key
YOUTUBE_CHANNEL_ID=your_youtube_channel_id
```

Backend start command:

```bash
npm install
npm start
```

Health check:

```text
https://your-backend-domain.com/
```

Expected response: `API running...`

## 2. Frontend Environment

Set this variable in the frontend hosting provider:

```env
NEXT_PUBLIC_API_URL=https://your-backend-domain.com/api
```

Frontend build command:

```bash
npm install
npm run build
```

Frontend start command:

```bash
npm start
```

## 3. Deployment Order

1. Deploy MongoDB Atlas and allow backend host IP access.
2. Deploy backend and verify the health check.
3. Deploy frontend with `NEXT_PUBLIC_API_URL` pointing to backend `/api`.
4. Test login, student dashboard, teacher materials, student notes/resources, live class create/join, and embedded Zoom.

## 4. Security Rules

- Never commit real `.env` files.
- Keep `JWT_SECRET` at least 64 characters.
- In production, do not use localhost in `FRONTEND_URL` or `CORS_ORIGINS`.
- Use HTTPS frontend and backend URLs.
- Add each hosting domain explicitly to CORS.
