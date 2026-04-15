// ─── Gemini AI Service ───
// Handles all AI-powered features:
// 1. Image analysis → generates title + description
// 2. Smart department categorization (maps to actual gov departments)
// 3. Criticality assessment for color-coded map markers
// 4. Official complaint letter drafting

import { GoogleGenerativeAI, HarmBlockThreshold, HarmCategory } from '@google/generative-ai';
import { env } from '../config/env.js';
import type { AIAnalysisResult } from '../types/index.js';
import { log } from '../utils/logger.js';

const genAI = new GoogleGenerativeAI(env.geminiApiKey);

const SAFETY_SETTINGS = [
  { category: HarmCategory.HARM_CATEGORY_DANGEROUS_CONTENT, threshold: HarmBlockThreshold.BLOCK_NONE },
  { category: HarmCategory.HARM_CATEGORY_HARASSMENT, threshold: HarmBlockThreshold.BLOCK_NONE },
  { category: HarmCategory.HARM_CATEGORY_HATE_SPEECH, threshold: HarmBlockThreshold.BLOCK_NONE },
  { category: HarmCategory.HARM_CATEGORY_SEXUALLY_EXPLICIT, threshold: HarmBlockThreshold.BLOCK_NONE },
];

/**
 * Analyzes a civic issue image and returns:
 * - Title (concise, max 8 words)
 * - Description (2-3 sentences)
 * - Department classification (from predefined list)
 * - Criticality level (for map color coding)
 */
export async function analyzeIssueImage(imageBase64: string, mimeType: string): Promise<AIAnalysisResult> {
  const model = genAI.getGenerativeModel({
    model: 'gemini-2.0-flash',
    safetySettings: SAFETY_SETTINGS,
  });

  const prompt = `You are a civic infrastructure analyst for an Indian municipal complaint system.

Analyze this image of a civic issue carefully.

TASK 1 — CLASSIFY into exactly ONE government department:
- Water Department (water leaks, pipe burst, contamination, drainage, flooding, water supply)
- Roads & Infrastructure (potholes, road cracks, broken sidewalks, bridge damage, unpaved roads)
- Electricity (streetlight outage, exposed wires, transformer issues, power pole damage)
- Sanitation & Waste (garbage overflow, illegal dumping, blocked drains, sewage, unclean areas)
- Traffic & Transport (broken signal, missing signs, parking issues, highway damage, toll issues)
- Urban Development (construction hazard, building violation, encroachment)
- Parks & Environment (fallen tree, park damage, pollution, stray animals, deforestation)
- General Administration (any other civic issue not matching above)

TASK 2 — ASSESS CRITICALITY:
- critical: Immediate danger to life/safety (exposed live wires, structural collapse, flood, gas leak, open manhole)
- high: Serious hazard needing urgent attention within 24h (large potholes on busy road, water main break, broken traffic signal on highway)
- medium: Notable issue needing attention within a week (streetlight out, moderate garbage, small pothole)
- low: Minor inconvenience (faded road markings, cosmetic damage, overgrown grass)

TASK 3 — GENERATE DETAILS:
- title: Concise issue title (maximum 8 words, be specific)
- description: Detailed description (2-3 sentences describing the issue, location context, and impact)

Return ONLY a valid JSON object, no markdown, no code blocks:
{"title": "...", "description": "...", "department": "Water Department", "criticality": "high"}`;

  const validDepts = [
    'Water Department', 'Roads & Infrastructure', 'Electricity',
    'Sanitation & Waste', 'Traffic & Transport', 'Urban Development',
    'Parks & Environment', 'General Administration',
  ];
  const validCriticalities = ['critical', 'high', 'medium', 'low'];

  const parseAIResponse = (text: string): AIAnalysisResult => {
    // Strip markdown code fences, leading/trailing whitespace
    let clean = text.trim();
    clean = clean.replace(/^```(?:json)?\s*/i, '').replace(/```\s*$/i, '').trim();
    // Try to extract JSON object if surrounded by other text
    const jsonMatch = clean.match(/\{[\s\S]*\}/);
    if (jsonMatch) clean = jsonMatch[0];
    const parsed = JSON.parse(clean) as AIAnalysisResult;
    if (!validDepts.includes(parsed.department)) parsed.department = 'General Administration';
    if (!validCriticalities.includes(parsed.criticality)) parsed.criticality = 'medium';
    return parsed;
  };

  try {
    const result = await model.generateContent([
      prompt,
      { inlineData: { data: imageBase64, mimeType } },
    ]);

    const text = result.response.text().trim();
    log(`Gemini raw response (first 500 chars): ${text.substring(0, 500)}`);
    const parsed = parseAIResponse(text);
    log(`AI Analysis: "${parsed.title}" → ${parsed.department} [${parsed.criticality}]`);
    return parsed;
  } catch (error: any) {
    log(`Gemini primary model failed: ${error?.message || error}`, 'error');

    // Retry with fallback model
    try {
      log('Retrying with fallback model gemini-1.5-flash...');
      const fallback = genAI.getGenerativeModel({ model: 'gemini-1.5-flash', safetySettings: SAFETY_SETTINGS });
      const result = await fallback.generateContent([
        prompt,
        { inlineData: { data: imageBase64, mimeType } },
      ]);
      const text = result.response.text().trim();
      log(`Fallback raw response (first 500 chars): ${text.substring(0, 500)}`);
      const parsed = parseAIResponse(text);
      log(`Fallback AI Analysis: "${parsed.title}" → ${parsed.department} [${parsed.criticality}]`);
      return parsed;
    } catch (fallbackErr: any) {
      log(`Gemini fallback also failed: ${fallbackErr?.message || fallbackErr}`, 'error');
      throw new Error(`AI analysis failed: ${error?.message || 'Unknown error'}. Fallback also failed: ${fallbackErr?.message || 'Unknown'}`);
    }
  }
}

/**
 * Analyzes text description (without image) for department + criticality.
 * Used as fallback when no image is uploaded.
 */
export async function analyzeIssueText(title: string, description: string): Promise<{ department: string; criticality: string }> {
  const model = genAI.getGenerativeModel({
    model: 'gemini-2.0-flash',
    safetySettings: SAFETY_SETTINGS,
  });

  const prompt = `Classify this civic complaint into a department and assess criticality.

Title: "${title}"
Description: "${description}"

Departments: Water Department, Roads & Infrastructure, Electricity, Sanitation & Waste, Traffic & Transport, Urban Development, Parks & Environment, General Administration

Criticality: critical, high, medium, low

Return ONLY valid JSON: {"department": "...", "criticality": "..."}`;

  try {
    const result = await model.generateContent(prompt);
    const text = result.response.text().trim();
    const cleanJson = text.replace(/```json\s*/g, '').replace(/```\s*/g, '').trim();
    return JSON.parse(cleanJson);
  } catch {
    return { department: 'General Administration', criticality: 'medium' };
  }
}

/**
 * Drafts a formal official complaint letter from issue details.
 */
export async function draftOfficialComplaint(issue: {
  title: string;
  description: string;
  department: string;
  location: string;
  upvotes: number;
}): Promise<string> {
  const model = genAI.getGenerativeModel({
    model: 'gemini-2.0-flash',
    safetySettings: SAFETY_SETTINGS,
  });

  const prompt = `Draft a formal complaint letter in English to the relevant Indian municipal authority.

Issue Details:
- Title: ${issue.title}
- Description: ${issue.description}
- Department: ${issue.department}
- Location: ${issue.location}
- Community Support: ${issue.upvotes} citizen upvotes

Format as a professional letter with:
- Proper salutation addressing the ${issue.department}
- Clear description of the problem
- Reference to community support (${issue.upvotes} upvotes)
- Request for timely action
- Professional closing

Write the complete letter text only, no JSON.`;

  try {
    const result = await model.generateContent(prompt);
    return result.response.text().trim();
  } catch {
    return `To,\nThe Commissioner,\n${issue.department},\n\nSubject: Formal Complaint - "${issue.title}"\n\nRespected Sir/Madam,\n\nThis is to bring to your attention the issue titled "${issue.title}" at ${issue.location}. ${issue.description}\n\nThis issue has received ${issue.upvotes} community upvotes, indicating significant public concern. We request immediate action.\n\nSincerely,\nA Concerned Citizen`;
  }
}
