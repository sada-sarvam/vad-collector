# VAD Collector 🎙️

A gamified speech sample collection app for training Voice Activity Detection (VAD) models. Built with Next.js, MongoDB, and Gemini AI.

## Features

- **5 Collection Games** - Different games for varied speech patterns
  - 💭 Finish My Thought - Incomplete utterances
  - ⚡ Quick Answer - Complete, confident responses
  - 📖 Storyteller - Both complete and trailing speech
  - 🧠 Memory Lane - Authentic thinking/recall patterns
  - 🔢 Number Dictation - Numeric speech patterns

- **Multi-language Support** - Hindi, English, and Tamil
- **Real-time Audio Recording** - With waveform visualization
- **AI-powered Prompts** - Dynamic prompt generation with Gemini
- **Progress Tracking** - Dashboard with detailed statistics
- **Aurora Design** - Beautiful, modern UI with aurora theme

## Tech Stack

- **Frontend**: Next.js 14, React, TypeScript, Tailwind CSS
- **Backend**: Next.js API Routes
- **Database**: MongoDB with Mongoose
- **AI**: Google Gemini 3 Flash Preview
- **Storage**: Vercel Blob
- **Animations**: Framer Motion

## Getting Started

### Prerequisites

- Node.js 18+
- MongoDB Atlas account (or local MongoDB)
- Google Cloud account (for Gemini API)
- Vercel account (for deployment)

### Installation

1. Clone the repository:
```bash
cd /auto/ASR/sadakopa/semantic_vad/vad-collector
```

2. Install dependencies:
```bash
npm install
```

3. Set up environment variables:
```bash
cp env.example .env.local
```

Edit `.env.local` with your credentials:
```env
# MongoDB
MONGODB_URI=mongodb+srv://...

# Google Cloud / Gemini
GOOGLE_API_KEY=your_gemini_api_key
GEMINI_MODEL_ID=gemini-2.0-flash

# Vercel Blob (for audio storage)
BLOB_READ_WRITE_TOKEN=vercel_blob_xxx

# App URL
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

4. Run the development server:
```bash
npm run dev
```

5. Open [http://localhost:3000](http://localhost:3000)

## Project Structure

```
vad-collector/
├── src/
│   ├── app/                    # Next.js App Router
│   │   ├── games/[gameId]/     # Game pages
│   │   ├── dashboard/          # Progress dashboard
│   │   └── api/                # API routes
│   ├── components/             # React components
│   │   ├── ui/                 # Reusable UI
│   │   ├── recording/          # Audio recording
│   │   └── games/              # Game-specific
│   ├── lib/                    # Utilities
│   │   ├── mongodb.ts          # DB connection
│   │   ├── gemini.ts           # Gemini AI client
│   │   └── constants.ts        # App constants
│   ├── models/                 # Mongoose models
│   └── types/                  # TypeScript types
├── public/                     # Static assets
└── package.json
```

## Deployment to Vercel

1. Push to GitHub
2. Import to Vercel
3. Add environment variables in Vercel dashboard
4. Deploy!

### Environment Variables for Vercel

Set these in your Vercel project settings:

| Variable | Description |
|----------|-------------|
| `MONGODB_URI` | MongoDB connection string |
| `GOOGLE_API_KEY` | Gemini API key |
| `BLOB_READ_WRITE_TOKEN` | Vercel Blob token |

## Data Collection Workflow

1. **Expert selects a game** from the home page
2. **Chooses language** (Hindi/English/Tamil)
3. **Gets AI-generated prompt** via Gemini
4. **Records audio** (2-16 seconds)
5. **Reviews and categorizes** the recording
6. **Submits** to MongoDB + Blob storage

## Recording Categories

| Category | Label | Description |
|----------|-------|-------------|
| complete-nofiller | Complete | Clear, confident endings |
| complete-withfiller | Complete | Complete with "you know", etc. |
| incomplete-midfiller | Incomplete | Trailing with mid-sentence fillers |
| incomplete-endfiller | Incomplete | Trailing with end fillers |

## API Endpoints

- `GET /api/prompts?gameType=&language=` - Get AI-generated prompt
- `POST /api/recordings` - Save recording metadata
- `GET /api/recordings` - List recordings
- `POST /api/upload` - Upload audio file
- `GET /api/stats` - Get collection statistics

## Contributing

1. Fork the repo
2. Create feature branch
3. Make changes
4. Submit PR

## License

MIT License - Sarvam AI

---

Built with ❤️ for Semantic VAD training.
Author: sadakopa@sarvam.ai
