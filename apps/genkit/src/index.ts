import { enableFirebaseTelemetry } from '@genkit-ai/firebase';
import { googleAI } from '@genkit-ai/googleai';
import { defineSecret } from 'firebase-functions/params';
import { onCallGenkit } from 'firebase-functions/v2/https';
import { genkit, z } from 'genkit';

enableFirebaseTelemetry();

const githubToken = defineSecret('GITHUB_TOKEN');
const geminiApiKey = defineSecret('GEMINI_API_KEY');

const ai = genkit({
  plugins: [googleAI()],
  model: googleAI.model('gemini-2.5-flash'),
});

const repoSchema = z.object({
  name: z.string(),
  language: z.string().nullable(),
  pushed_at: z.string(),
  stargazers_count: z.number(),
  forks: z.number(),
});

// (Removed event schemas previously used for roasting commit messages)

const fetchGithubRepos = ai.defineTool(
  {
    name: 'fetchGithubRepos',
    description:
      'Fetches a list of public repositories for a given GitHub username sorted by pushed date (recently updated).',
    // Input validation using Zod
    inputSchema: z.object({ username: z.string() }),
    // Output validation using Zod
    outputSchema: z.array(repoSchema),
  },
  async ({ username }) => {
    console.log(`Fetching repos for ${username}`);
    const response = await fetch(
      // Fetch the last 15 repos sorted by pushed date
      `https://api.github.com/users/${username}/repos?sort=pushed&per_page=15`,
      {
        headers: {
          // Use the GitHub token from your .env file
          Authorization: `Bearer ${process.env.GITHUB_TOKEN}`,
          Accept: 'application/vnd.github.v3+json',
          'User-Agent': 'Genkit-Repo-Roaster-Agent', // GitHub requires a User-Agent
        },
      },
    );

    if (!response.ok) {
      throw new Error(
        `Failed to fetch repos from GitHub: ${response.statusText}`,
      );
    }

    const repos = await response.json();
    const reposParsed = z.array(repoSchema).parse(repos);

    // We only care about a few properties, so we map the response
    // to match our repoSchema. This keeps the data clean.
    return reposParsed.map((repo) => ({
      name: repo.name,
      language: repo.language,
      pushed_at: repo.pushed_at,
      stargazers_count: repo.stargazers_count,
      forks: repo.forks,
    }));
  },
);

const fetchLanguageStats = ai.defineTool(
  {
    name: 'fetchLanguageStats',
    description:
      'Analyzes programming languages used across all repositories to calculate usage statistics.',
    inputSchema: z.object({ username: z.string() }),
    outputSchema: z.object({
      languages: z.record(z.string(), z.number()),
      totalRepos: z.number(),
      topLanguages: z.array(
        z.object({
          name: z.string(),
          count: z.number(),
          percentage: z.number(),
        }),
      ),
    }),
  },
  async ({ username }) => {
    console.log(`Analyzing language stats for ${username}`);

    // First get all repos (up to 100)
    const response = await fetch(
      `https://api.github.com/users/${username}/repos?per_page=100&type=all`,
      {
        headers: {
          Authorization: `Bearer ${process.env.GITHUB_TOKEN}`,
          Accept: 'application/vnd.github.v3+json',
          'User-Agent': 'Genkit-Repo-Roaster-Agent',
        },
      },
    );

    if (!response.ok) {
      throw new Error(`Failed to fetch repos: ${response.statusText}`);
    }

    const repos = await response.json();
    const languages: Record<string, number> = {};
    let totalRepos = 0;

    // Count languages
    for (const repo of repos) {
      if (repo.language) {
        languages[repo.language] = (languages[repo.language] || 0) + 1;
        totalRepos++;
      }
    }

    // Calculate top languages with percentages
    const topLanguages = Object.entries(languages)
      .map(([name, count]) => ({
        name,
        count,
        percentage: Math.round((count / totalRepos) * 100),
      }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 5);

    return {
      languages,
      totalRepos,
      topLanguages,
    };
  },
);

const fetchStarredRepos = ai.defineTool(
  {
    name: 'fetchStarredRepos',
    description:
      'Fetches repositories that the user has starred to analyze their interests vs their own work.',
    inputSchema: z.object({ username: z.string() }),
    outputSchema: z.object({
      totalStarred: z.number(),
      topStarredLanguages: z.array(z.string()),
      recentStars: z.array(
        z.object({
          name: z.string(),
          language: z.string().nullable(),
          description: z.string().nullable(),
          stargazers_count: z.number(),
        }),
      ),
    }),
  },
  async ({ username }) => {
    console.log(`Fetching starred repos for ${username}`);

    const response = await fetch(
      `https://api.github.com/users/${username}/starred?per_page=20&sort=created`,
      {
        headers: {
          Authorization: `Bearer ${process.env.GITHUB_TOKEN}`,
          Accept: 'application/vnd.github.v3+json',
          'User-Agent': 'Genkit-Repo-Roaster-Agent',
        },
      },
    );

    if (!response.ok) {
      throw new Error(`Failed to fetch starred repos: ${response.statusText}`);
    }

    const starred = await response.json();

    const languageCount: Record<string, number> = {};
    const recentStars = starred
      .slice(0, 10)
      .map(
        (repo: {
          name: string;
          language: string | null;
          description: string | null;
          stargazers_count: number;
        }) => {
          if (repo.language) {
            languageCount[repo.language] =
              (languageCount[repo.language] || 0) + 1;
          }
          return {
            name: repo.name,
            language: repo.language,
            description: repo.description,
            stargazers_count: repo.stargazers_count,
          };
        },
      );

    const topStarredLanguages = Object.entries(languageCount)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5)
      .map(([lang]) => lang);

    return {
      totalStarred: starred.length,
      topStarredLanguages,
      recentStars,
    };
  },
);

// (Removed commit messages tool that supported roasting)

const fetchGithubUserProfile = ai.defineTool(
  {
    name: 'fetchGithubUserProfile',
    description:
      'Fetches the public profile of a GitHub user including bio, followers, company, etc.',
    inputSchema: z.object({ username: z.string() }),
    outputSchema: z.object({
      login: z.string(),
      id: z.number(),
      avatar_url: z.string(),
      html_url: z.string(),
      name: z.string().nullable(),
      company: z.string().nullable(),
      blog: z.string().nullable(),
      location: z.string().nullable(),
      bio: z.string().nullable(),
      public_repos: z.number(),
      followers: z.number(),
      following: z.number(),
      created_at: z.string(),
      updated_at: z.string(),
    }),
  },
  async ({ username }) => {
    console.log(`Fetching profile for ${username}`);
    const response = await fetch(`https://api.github.com/users/${username}`, {
      headers: {
        Authorization: `Bearer ${process.env.GITHUB_TOKEN}`,
        Accept: 'application/vnd.github.v3+json',
        'User-Agent': 'Genkit-Repo-Roaster-Agent',
      },
    });

    if (!response.ok) {
      throw new Error(
        `Failed to fetch GitHub user profile: ${response.statusText}`,
      );
    }

    const profile = await response.json();

    return {
      login: profile.login,
      id: profile.id,
      avatar_url: profile.avatar_url,
      html_url: profile.html_url,
      name: profile.name,
      company: profile.company,
      blog: profile.blog,
      location: profile.location,
      bio: profile.bio,
      public_repos: profile.public_repos,
      followers: profile.followers,
      following: profile.following,
      created_at: profile.created_at,
      updated_at: profile.updated_at,
    };
  },
);

// (Removed roast flow and callable export)

// New: A flow that analyzes the user's languages and suggests a next project
const githubProjectSuggestFlow = ai.defineFlow(
  {
    name: 'githubProjectSuggestFlow',
    inputSchema: z.object({
      username: z.string(),
    }),
    outputSchema: z.string(),
  },
  async ({ username }, streamCallack) => {
    const { response, stream } = ai.generateStream({
      prompt: `
        You are a thoughtful, encouraging senior engineer career mentor.

        Task: Given the GitHub username "${username}", use the available tools to:
        1) Identify their top programming languages and recency of work (repos and pushed_at)
        2) Note any gaps between what they star and what they build
        3) Propose ONE concrete project they should build next that fits their current skills while stretching them a bit.

        Requirements for the output (short, actionable, no fluff):
        - Title: a catchy project title
        - Why: 1–2 sentences tying it to their top languages/experience
        - Key Features: 3–5 bullet points
        - Tech Stack: list primary languages/frameworks to use (from their strengths + 1 stretch)
        - Next Steps: 3–4 steps to get started

        Keep it under 180 words. Return only the suggestion text as a single string.
      `,
      tools: [
        fetchGithubUserProfile,
        fetchGithubRepos,
        fetchLanguageStats,
        fetchStarredRepos,
      ],
      config: {
        temperature: 0.6,
      },
    });

    for await (const chunk of stream) {
      streamCallack(chunk);
    }

    const { text } = await response;
    return text;
  },
);

export const githubProjectSuggestFunction = onCallGenkit(
  {
    secrets: [githubToken, geminiApiKey],
    cors: true, // Enable CORS for local development
  },
  githubProjectSuggestFlow,
);
