#!/usr/bin/env node

import { mkdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const projectRoot = path.resolve(__dirname, "..");

const GROQ_API_KEY = "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";
const GROQ_MODEL = "llama-3.3-70b-versatile";
const ELEVENLABS_API_KEY = "sk_ee6331ab07fcff4868f808faff2c8a083f6e9a74f868ba55";
const ELEVENLABS_VOICE_ID = "jVksOBp2JF0Egy6blape";
const ELEVENLABS_MODEL_ID = "eleven_flash_v2_5";

async function main() {
  assertRequiredEnv("GROQ_API_KEY", GROQ_API_KEY);
  assertRequiredEnv("ELEVENLABS_API_KEY", ELEVENLABS_API_KEY);
  assertRequiredEnv("ELEVENLABS_VOICE_ID", ELEVENLABS_VOICE_ID);

  const dataDir = path.join(projectRoot, "data");
  const audioDir = path.join(projectRoot, "audio");

  await Promise.all([
    mkdir(dataDir, { recursive: true }),
    mkdir(audioDir, { recursive: true }),
  ]);

  const library = await loadMentalLibrary();
  const selectors = process.argv.slice(2);
  const topics = resolveTopics(selectors, library);

  if (topics.length === 0) {
    throw new Error("No topics were found to process.");
  }

  const failures = [];

  for (let topicIndex = 0; topicIndex < topics.length; topicIndex += 1) {
    const topic = topics[topicIndex];
    try {
      console.log(`[${topicIndex + 1}/${topics.length}] Generating slides for "${topic.title}"...`);
      const slides = await generateSlides(topic);
      console.log(`[${topicIndex + 1}/${topics.length}] Created ${slides.length} slides for "${topic.title}".`);
      const lesson = await buildLesson(topic, slides, dataDir, audioDir, {
        topicIndex,
        topicCount: topics.length,
      });
      console.log(`[${topicIndex + 1}/${topics.length}] Saved data/${lesson.fileBase}.json`);
    } catch (error) {
      failures.push({
        topic: topic.title,
        error: error instanceof Error ? error.message : String(error),
      });
      console.error(`Failed ${topic.title}: ${failures.at(-1)?.error}`);
    }
  }

  if (failures.length > 0) {
    process.exitCode = 1;
  }
}

async function loadMentalLibrary() {
  const routeSource = await readFile(
    path.join(projectRoot, "apps", "web", "app", "api", "mental", "content", "route.ts"),
    "utf8",
  );
  const lessonSource = await readFile(
    path.join(projectRoot, "apps", "mobile", "app", "mental", "lesson.tsx"),
    "utf8",
  );

  const modules = extractLiteral(routeSource, "LEARNING_MODULES");
  const lessonContent = extractLiteral(lessonSource, "LESSON_CONTENT");

  return modules
    .slice()
    .sort((a, b) => a.order - b.order)
    .map((module) => ({
      moduleId: module.moduleId,
      title: module.title,
      description: module.description,
      category: module.category,
      duration: module.duration,
      difficulty: module.difficulty,
      article: lessonContent[module.moduleId] || `${module.title}\n\n${module.description}`,
    }));
}

function extractLiteral(source, constName) {
  const match = source.match(
    new RegExp(
      `const\\s+${constName}(?:\\s*:[^=]+)?\\s*=\\s*(\\[[\\s\\S]*?\\n\\]|\\{[\\s\\S]*?\\n\\})\\s*;`,
      "m",
    ),
  );

  if (!match) {
    throw new Error(`Unable to read ${constName} from source.`);
  }

  return Function(`"use strict"; return (${match[1]});`)();
}

function resolveTopics(selectors, library) {
  if (selectors.length === 0) {
    return library;
  }

  const seen = new Set();
  const selected = [];

  for (const selector of selectors.flatMap(splitSelector)) {
    const key = normalizeMatchKey(selector);
    const match =
      library.find((topic) => normalizeMatchKey(topic.moduleId) === key) ||
      library.find((topic) => normalizeMatchKey(topic.title) === key) ||
      library.find((topic) => slugify(topic.title) === slugify(selector));

    const topic =
      match ||
      ({
        moduleId: slugify(selector),
        title: selector.trim(),
        description: "",
        category: "stress",
        duration: "3 min",
        difficulty: "beginner",
        article: selector.trim(),
      });

    if (!topic.title || seen.has(topic.moduleId)) {
      continue;
    }

    seen.add(topic.moduleId);
    selected.push(topic);
  }

  return selected;
}

function splitSelector(value) {
  return value
    .split(",")
    .map((part) => part.trim())
    .filter(Boolean);
}

function normalizeMatchKey(value) {
  return value.trim().toLowerCase().replace(/\s+/g, " ");
}

async function generateSlides(topic) {
  let lastError;

  for (let attempt = 1; attempt <= 4; attempt += 1) {
    try {
      const response = await fetch(
        "https://api.groq.com/openai/v1/chat/completions",
        {
          method: "POST",
          headers: {
            Authorization: `Bearer ${GROQ_API_KEY}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            model: GROQ_MODEL,
            temperature: 0.6,
            response_format: {
              type: "json_object",
            },
            messages: [
              {
                role: "system",
                content:
                  'You turn wellness articles into calm beginner slide lessons. Return a valid JSON object only, with this exact shape: {"slides":[{"text":"...","audio_script":"..."}]}. Do not include markdown or any extra keys.',
              },
              {
                role: "user",
                content: [
                  `Topic: ${topic.title}`,
                  `Category: ${topic.category}`,
                  `Difficulty: ${topic.difficulty}`,
                  "",
                  "Rules:",
                  '- Return exactly one JSON object shaped like {"slides":[{"text":"...","audio_script":"..."}]}.',
                  "- Create 5 or 6 slides.",
                  "- Each text must be simple, calm, and jargon-free.",
                  "- Each text must be at most 2 short lines.",
                  "- audio_script must match text exactly.",
                  "- Do not add bullets, numbering, markdown, or extra keys.",
                  "- Stay faithful to the source article.",
                  "",
                  "Source article:",
                  topic.article,
                ].join("\n"),
              },
            ],
          }),
        },
      );

      if (!response.ok) {
        const error = await createApiError("Groq", response);
        if (response.status === 429 && attempt < 4) {
          await sleep(5000 * attempt);
          lastError = error;
          continue;
        }
        throw error;
      }

      const payload = await response.json();
      const rawContent = payload.choices?.[0]?.message?.content;
      const parsed = parseJson(rawContent);
      return normalizeSlides(parsed?.slides);
    } catch (error) {
      lastError = error;
    }
  }

  throw lastError instanceof Error ? lastError : new Error("Slide generation failed.");
}

function parseJson(value) {
  if (typeof value !== "string" || value.trim() === "") {
    throw new Error("Groq returned an empty response.");
  }

  const cleaned = value
    .trim()
    .replace(/^```json\s*/i, "")
    .replace(/^```\s*/i, "")
    .replace(/\s*```$/, "");

  return JSON.parse(cleaned);
}

function normalizeSlides(slides) {
  if (!Array.isArray(slides)) {
    throw new Error("Groq response did not include a slides array.");
  }

  const normalized = slides
    .map((slide) => {
      const text = normalizeSlideText(
        typeof slide?.text === "string" ? slide.text : "",
      );

      if (!text) {
        return null;
      }

      return {
        text,
        audio_script: text,
      };
    })
    .filter(Boolean);

  if (normalized.length < 5 || normalized.length > 6) {
    throw new Error("Expected 5 or 6 slides from Groq.");
  }

  return normalized;
}

function normalizeSlideText(text) {
  const trimmed = text.replace(/\r/g, "").trim();

  if (!trimmed) {
    return "";
  }

  let lines = trimmed
    .split("\n")
    .map((line) => line.replace(/\s+/g, " ").trim())
    .filter(Boolean);

  if (lines.length === 0) {
    return "";
  }

  if (lines.length > 2) {
    lines = [lines[0], lines.slice(1).join(" ")];
  }

  let value = lines.join("\n");

  if (!value.includes("\n") && value.length > 72) {
    const breakIndex = findBreakPoint(value);
    if (breakIndex > 20 && breakIndex < value.length - 12) {
      value = `${value.slice(0, breakIndex).trim()}\n${value.slice(breakIndex).trim()}`;
    }
  }

  return value
    .split("\n")
    .map((line) => line.trim())
    .filter(Boolean)
    .slice(0, 2)
    .join("\n");
}

function findBreakPoint(text) {
  const midpoint = Math.floor(text.length / 2);
  const punctuation = [". ", ", ", "; ", ": "];

  for (const token of punctuation) {
    const after = text.indexOf(token, midpoint);
    if (after !== -1) {
      return after + token.length;
    }

    const before = text.lastIndexOf(token, midpoint);
    if (before !== -1) {
      return before + token.length;
    }
  }

  const afterSpace = text.indexOf(" ", midpoint);
  if (afterSpace !== -1) {
    return afterSpace + 1;
  }

  return text.lastIndexOf(" ", midpoint);
}

async function buildLesson(topic, slides, dataDir, audioDir, progress) {
  const fileBase = slugify(topic.title || topic.moduleId);
  const lessonSlides = [];

  for (let index = 0; index < slides.length; index += 1) {
    const slide = slides[index];
    const audioFileName = `${fileBase}_${index}.mp3`;
    const audioFilePath = path.join(audioDir, audioFileName);

    console.log(
      `[${progress.topicIndex + 1}/${progress.topicCount}] Audio ${index + 1}/${slides.length} for "${topic.title}"...`,
    );
    await synthesizeSpeech(slide.audio_script, audioFilePath);
    console.log(
      `[${progress.topicIndex + 1}/${progress.topicCount}] Saved audio/${audioFileName}`,
    );

    lessonSlides.push({
      text: slide.text,
      audio: `/audio/${audioFileName}`,
    });
  }

  const lesson = {
    title: topic.title,
    category: topic.category || "stress",
    duration: topic.duration || "3 min",
    difficulty: topic.difficulty || "beginner",
    slides: lessonSlides,
  };

  await writeFile(
    path.join(dataDir, `${fileBase}.json`),
    `${JSON.stringify(lesson, null, 2)}\n`,
    "utf8",
  );

  return { fileBase, lesson };
}

async function synthesizeSpeech(text, outputPath) {
  const response = await fetch(
    `https://api.elevenlabs.io/v1/text-to-speech/${ELEVENLABS_VOICE_ID}`,
    {
      method: "POST",
      headers: {
        Accept: "audio/mpeg",
        "Content-Type": "application/json",
        "xi-api-key": ELEVENLABS_API_KEY,
      },
      body: JSON.stringify({
        text,
        model_id: ELEVENLABS_MODEL_ID,
        voice_settings: {
          stability: 0.45,
          similarity_boost: 0.8,
        },
      }),
    },
  );

  if (!response.ok) {
    throw await createApiError("ElevenLabs", response);
  }

  const audioBuffer = Buffer.from(await response.arrayBuffer());
  await writeFile(outputPath, audioBuffer);
}

async function createApiError(label, response) {
  const body = await response.text().catch(() => response.statusText);
  const message = body.slice(0, 800) || response.statusText;
  return new Error(`${label} API ${response.status}: ${message}`);
}

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function slugify(value) {
  return value
    .toLowerCase()
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, "_")
    .replace(/^_+|_+$/g, "")
    .replace(/_+/g, "_");
}

function assertRequiredEnv(name, value) {
  if (!value) {
    throw new Error(`Missing required environment variable: ${name}`);
  }
}

main().catch((error) => {
  console.error(error instanceof Error ? error.message : String(error));
  process.exit(1);
});
