"use server";

import { z } from "zod";
import { auth } from "@/auth";
import { GoogleGenerativeAI } from "@google/generative-ai";

// Input validation schemas for the two entry points
const pantryInputSchema = z.object({
  type: z.literal("pantry"),
  ingredients: z.string().trim().min(1, "Ingredients are required").max(1000),
});

const macroInputSchema = z.object({
  type: z.literal("macro"),
  calories: z.coerce.number().int().positive("Calories must be a positive number"),
  protein: z.coerce.number().int().positive("Protein must be a positive number"),
  fat: z.coerce.number().int().positive("Fat must be a positive number"),
  netCarbs: z.coerce.number().int().nonnegative("Net carbs must be a non-negative number"),
});

const actionInputSchema = z.discriminatedUnion("type", [
  pantryInputSchema,
  macroInputSchema,
]);

// Validation schema for the generated AI response (representing a Meal model + optional groceryList)
const generatedMealSchema = z.object({
  title: z.string().trim().min(1, "Title is required"),
  description: z.string().trim().min(1, "Description is required"),
  calories: z.number().int().positive("Calories must be positive"),
  protein: z.number().int().positive("Protein must be positive"),
  fat: z.number().int().positive("Fat must be positive"),
  netCarbs: z.number().int().nonnegative("Net carbs must be non-negative"),
  category: z.enum(["OMAD FEAST", "KETO POWER", "REFUEL"]),
  ingredients: z.array(z.string().trim().min(1)).min(1, "At least one ingredient is required"),
  instructions: z.array(z.string().trim().min(1)).min(1, "At least one instruction is required"),
  groceryList: z.array(z.string().trim().min(1)).optional(),
});

export type GeneratedMealType = z.infer<typeof generatedMealSchema>;

export async function generateAiMeal(rawData: unknown) {
  // 1. Session check
  const session = await auth();
  if (!session?.user?.id) {
    return {
      success: false,
      error: "UNAUTHORIZED: You must be signed in to generate AI meal protocols.",
    };
  }

  // 2. Validate input parameters
  const parsedInput = actionInputSchema.safeParse(rawData);
  if (!parsedInput.success) {
    const errorMsg = parsedInput.error.issues.map((issue) => issue.message).join(", ");
    return {
      success: false,
      error: `INVALID PARAMETERS: ${errorMsg}`,
    };
  }

  const input = parsedInput.data;

  // 3. Check for API key
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    return {
      success: false,
      error: "CONFIGURATION ERROR: GEMINI_API_KEY is missing from the server environment.",
    };
  }

  // 4. Initialize Gemini API Client
  let genAI: GoogleGenerativeAI;
  try {
    genAI = new GoogleGenerativeAI(apiKey);
  } catch (err: unknown) {
    console.error("Failed to initialize GoogleGenerativeAI:", err);
    return {
      success: false,
      error: "INTEGRATION ERROR: Failed to initialize generative AI service.",
    };
  }

  // 5. Construct the contextual prompt for Gemini
  let prompt = `You are a professional tactical keto/OMAD chef, sports nutritionist, and keto coach.
Your task is to generate a highly tailored, bulletproof keto recipe matching the requested inputs.
All recipes must align with low-carb, high-fat, high-protein protocols (such as OMAD FEAST, KETO POWER, or REFUEL category).

`;

  if (input.type === "pantry") {
    prompt += `ENTRY POINT: PANTRY-DRIVEN ("kitchen sink").
The user has provided the following ingredients on hand:
"${input.ingredients}"

Your instructions:
- Generate a single keto-friendly, low-carb recipe derived PRIMARILY from these ingredients.
- You can supplement with standard keto pantry essentials (salt, pepper, cooking fats/oils, butter, standard spices, water).
- Be creative but realistic, and ensure the dish is appetizing and has solid keto macros (high fat, good protein, minimal net carbs).
- Keep net carbs as low as possible.
- The "groceryList" field in the response must NOT be populated (or can be an empty array), as the user already has these ingredients.
`;
  } else {
    prompt += `ENTRY POINT: MACRO-DRIVEN ("let's go shopping").
The user wants a meal targeting these exact nutrition guidelines:
- Calories: ${input.calories} kcal
- Protein: ${input.protein}g
- Fat: ${input.fat}g
- Net Carbs: ${input.netCarbs}g

Your instructions:
- Design a single keto-friendly, low-carb recipe that hits these targets as close as mathematically possible (within 10-15% of each macro target).
- Since the user needs to shop for this meal, generate a detailed grocery list of the items needed.
- Put the required grocery items in the "groceryList" array in the response JSON.
`;
  }

  prompt += `

OUTPUT FORMAT REQUIREMENTS:
You MUST respond with a single, raw, valid JSON object ONLY.
Do not include any Markdown blocks, backticks (such as \`\`\`json), or conversational leading/trailing text.
The JSON object must strictly conform to this TypeScript schema:

{
  "title": string,        // Active, aggressive, appetizing name for the recipe (e.g., "SKILLET BACON & CHEDDAR RIBEYE PROTOCOL")
  "description": string,  // A detailed, motivational description highlighting why this meal rules for athletic energy and keto fuel
  "calories": number,     // Integer value representing total kcal
  "protein": number,      // Integer value representing protein in grams
  "fat": number,          // Integer value representing fat in grams
  "netCarbs": number,     // Integer value representing net carbs in grams (must be very low, e.g., 0-10g)
  "category": "OMAD FEAST" | "KETO POWER" | "REFUEL", // Select the category that fits best
  "ingredients": string[], // Detailed ingredients list with precise measurements (e.g., "8 oz Grass-Fed Ribeye Steak", "2 Large Pasture-Raised Eggs")
  "instructions": string[], // Step-by-step instructions (e.g., ["Pat ribeye dry and season heavily...", "Heat cast iron skillet to high..."])
  "groceryList"?: string[] // (Required only for macro type) Array of grocery store items to buy. If pantry type, keep empty or omit.
}

Return ONLY this valid JSON object.`;

  try {
    const model = genAI.getGenerativeModel({
      model: "gemini-1.5-flash",
      generationConfig: {
        responseMimeType: "application/json",
      },
    });

    const result = await model.generateContent(prompt);
    const textResponse = result.response.text();

    if (!textResponse) {
      return {
        success: false,
        error: "GENERATION ERROR: Gemini returned an empty response.",
      };
    }

    // 6. Attempt to parse JSON response
    let rawJson: unknown;
    try {
      rawJson = JSON.parse(textResponse);
    } catch (parseErr) {
      console.error("Failed to parse Gemini response text:", textResponse, parseErr);
      return {
        success: false,
        error: "AI ENGINE ERROR: The model returned malformed output that could not be parsed.",
      };
    }

    // 7. Zod-validate the model output against the schema
    const validatedMeal = generatedMealSchema.safeParse(rawJson);
    if (!validatedMeal.success) {
      console.error("Gemini output failed validation:", rawJson, validatedMeal.error);
      return {
        success: false,
        error: "AI VALIDATION ERROR: The model output did not match the required schema constraints.",
      };
    }

    return {
      success: true,
      meal: validatedMeal.data,
    };
  } catch (apiErr: unknown) {
    console.error("Gemini API call failed:", apiErr);
    return {
      success: false,
      error: `API ERROR: Failed to communicate with the generative AI model. ${apiErr instanceof Error ? apiErr.message : String(apiErr)}`,
    };
  }
}
