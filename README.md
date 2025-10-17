# Project Suggestor

A Gemini-powered web app that analyzes your GitHub profile and suggests personalized next project ideas based on your programming languages, repositories, and interests. Built with Genkit, Firebase, and Angular.

## Features

- **Smart Analysis**: Analyzes your GitHub profile, repos, language stats, and starred repositories
- **AI-Powered Suggestions**: Uses Google's Gemini AI to generate tailored project ideas
- **Detailed Recommendations**: Get project title, rationale, key features, tech stack, and next steps
- **Modern UI**: Clean, responsive interface with downloadable/shareable suggestion cards

## How It Works

1. Enter a GitHub username
2. The app fetches your:
   - Public repositories and languages
   - Language statistics across all repos
   - Starred repositories (to understand interests)
   - Profile information
3. Gemini analyzes this data and suggests one concrete project that:
   - Matches your current skill level
   - Stretches you slightly with new technologies
   - Aligns with your interests

## Getting Started

### Prerequisites

- Node.js 18+
- pnpm 9+
- Firebase project with Functions enabled
- Google Gemini API key
- GitHub Personal Access Token

### Installation

1. Clone the repo:

```bash
git clone https://github.com/kiganyamburu/ripper-the-github-griller.git
cd ripper-the-github-griller
```

2. Install dependencies:

```bash
pnpm install
```

3. Set up Firebase secrets (for production):

```bash
firebase functions:secrets:set GEMINI_API_KEY
firebase functions:secrets:set GITHUB_TOKEN
```

4. For local development, create `apps/genkit/.env`:

```
GEMINI_API_KEY=your_gemini_api_key
GITHUB_TOKEN=your_github_token
```

### Running Locally

**Web app (development):**

```bash
pnpm nx serve web
```

**Firebase Functions emulator:**

```bash
pnpm nx serve genkit
```

**Build for production:**

```bash
pnpm nx build web
pnpm nx build genkit
```

### Deployment

Deploy Firebase Functions:

```bash
pnpm nx run genkit:deploy
```

Deploy web app to your preferred hosting (Vercel, Firebase Hosting, etc.)

## Tech Stack

- **Frontend**: Angular 20, TailwindCSS
- **Backend**: Firebase Functions, Genkit
- **AI**: Google Gemini 2.5 Flash
- **APIs**: GitHub REST API v3
- **Build**: Nx monorepo

## Project Structure

```
apps/
  web/              # Angular frontend
  genkit/           # Firebase Functions + Genkit flows
```

## License

MIT
