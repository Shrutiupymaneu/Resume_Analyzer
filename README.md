# Scanline — AI Resume Analyzer

Paste or upload a resume (PDF/.txt), optionally paste a job description, and get an instant score, a structure checklist, ATS keyword match, and a fix-it list. Runs fully client-side — no backend, no API key.

## Run locally

```bash
npm install
npm run dev
```

## Build

```bash
npm run build
npm run preview
```

## Deploy to Vercel

```bash
npm i -g vercel
vercel --prod
```

Or import the repo at [vercel.com/new](https://vercel.com/new) — Vite is auto-detected, no config needed.

## Stack

React + Vite, `pdfjs-dist` for PDF text extraction.