import OpenAI from "openai";

export const runtime = "nodejs";

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

const nutritionSchema = {
  type: "object",
  additionalProperties: false,
  properties: {
    is_food: {
      type: "boolean",
    },

    meal_name: {
      type: "string",
    },

    confidence: {
      type: "string",
      enum: ["high", "medium", "low"],
    },

    calories: {
      type: "number",
    },

    protein_g: {
      type: "number",
    },

    carbs_g: {
      type: "number",
    },

    fat_g: {
      type: "number",
    },

    items: {
      type: "array",
      items: {
        type: "object",
        additionalProperties: false,
        properties: {
          name: {
            type: "string",
          },
          portion: {
            type: "string",
          },
          calories: {
            type: "number",
          },
          protein_g: {
            type: "number",
          },
          carbs_g: {
            type: "number",
          },
          fat_g: {
            type: "number",
          },
        },
        required: [
          "name",
          "portion",
          "calories",
          "protein_g",
          "carbs_g",
          "fat_g",
        ],
      },
    },

    assumptions: {
      type: "array",
      items: {
        type: "string",
      },
    },

    coaching_message: {
      type: "string",
    },

    next_action: {
      type: "string",
    },

    recommendations: {
      type: "array",
      items: {
        type: "object",
        additionalProperties: false,
        properties: {
          name: {
            type: "string",
          },
          reason: {
            type: "string",
          },
          calories: {
            type: "number",
          },
          protein_g: {
            type: "number",
          },
        },
        required: [
          "name",
          "reason",
          "calories",
          "protein_g",
        ],
      },
    },
  },

  required: [
    "is_food",
    "meal_name",
    "confidence",
    "calories",
    "protein_g",
    "carbs_g",
    "fat_g",
    "items",
    "assumptions",
    "coaching_message",
    "next_action",
    "recommendations",
  ],
};

function number(value, fallback = 0) {
  const n = Number(value);
  return Number.isFinite(n) ? n : fallback;
}

function safeJson(value, fallback) {
  if (!value) return fallback;

  try {
    return JSON.parse(value);
  } catch {
    return fallback;
  }
}

export async function POST(request) {
  try {
    // ---------------------------------------------
    // BASIC VALIDATION
    // ---------------------------------------------

    if (!process.env.OPENAI_API_KEY) {
      return Response.json(
        {
          success: false,
          error: "OPENAI_API_KEY is not configured.",
        },
        { status: 500 }
      );
    }

    const formData = await request.formData();

    const image = formData.get("image");

    if (!image || typeof image.arrayBuffer !== "function") {
      return Response.json(
        {
          success: false,
          error: "No valid food image was received.",
        },
        { status: 400 }
      );
    }

    // ---------------------------------------------
    // OPTIONAL USER STATE
    //
    // These fields don't need to exist yet.
    // Page.jsx can start sending them later.
    // ---------------------------------------------

    const profile = safeJson(
      formData.get("profile"),
      {}
    );

    const day = safeJson(
      formData.get("day"),
      {
        calories: 0,
        protein_g: 0,
        carbs_g: 0,
        fat_g: 0,
        meals: [],
      }
    );

    const history = safeJson(
      formData.get("history"),
      []
    );

    const preferences = safeJson(
      formData.get("preferences"),
      {
        likes: [],
        dislikes: [],
        dietary_rules: [],
      }
    );

    // ---------------------------------------------
    // IMAGE
    // ---------------------------------------------

    const bytes = await image.arrayBuffer();

    const base64 = Buffer.from(bytes).toString("base64");

    const mimeType =
      image.type || "image/jpeg";

    const imageDataUrl =
      `data:${mimeType};base64,${base64}`;

    // ---------------------------------------------
    // USER CONTEXT
    // ---------------------------------------------

    const goal =
      profile.goal || "maintain";

    const currentWeight =
      number(profile.current_weight, null);

    const goalWeight =
      number(profile.goal_weight, null);

    const height =
      number(profile.height, null);

    const caloriesAlready =
      number(day.calories, 0);

    const proteinAlready =
      number(day.protein_g, 0);

    const carbsAlready =
      number(day.carbs_g, 0);

    const fatAlready =
      number(day.fat_g, 0);

    // ---------------------------------------------
    // CORE INTELLIGENCE PROMPT
    // ---------------------------------------------

    const instructions = `
You are the nutrition intelligence engine behind a consumer
food application.

Your job is to turn a photograph of food into useful,
honest and actionable nutrition intelligence.

You are NOT a generic chatbot.

You must do four things:

1. UNDERSTAND THE FOOD
2. ESTIMATE ITS NUTRITION
3. UNDERSTAND WHAT IT MEANS FOR THE USER'S DAY
4. RECOMMEND THE MOST USEFUL NEXT ACTION

IMPORTANT PRINCIPLES:

- Never pretend a photograph provides laboratory precision.
- Use sensible portion estimates.
- Account for oils, sauces, dressings and cooking methods
  when they are visually plausible.
- Do not hallucinate ingredients that are impossible to infer.
- If uncertain, make the best practical estimate and record
  the uncertainty in assumptions.
- Keep recommendations practical.
- Prefer ordinary foods people can actually obtain.
- Do not lecture the user.
- Do not overwhelm the user.
- The user should feel that the app is quietly helping them
  make better food decisions.

USER

Goal: ${goal}

Current weight:
${currentWeight === null ? "unknown" : `${currentWeight} kg`}

Goal weight:
${goalWeight === null ? "unknown" : `${goalWeight} kg`}

Height:
${height === null ? "unknown" : `${height} cm`}

TODAY

Calories already logged:
${caloriesAlready}

Protein already logged:
${proteinAlready} g

Carbohydrates already logged:
${carbsAlready} g

Fat already logged:
${fatAlready} g

RECENT MEALS

${JSON.stringify(history)}

PREFERENCES

Likes:
${JSON.stringify(preferences.likes || [])}

Dislikes:
${JSON.stringify(preferences.dislikes || [])}

Dietary rules:
${JSON.stringify(preferences.dietary_rules || [])}

PHOTO TASK

Analyse the photograph.

Identify the meal and visible food.

Estimate:

- calories
- protein
- carbohydrates
- fat
- portions
- individual components

Then consider the user's current state.

If the user is trying to lose weight, prioritise sustainable
calorie control and adequate protein.

If maintaining, prioritise consistency and balanced intake.

If gaining, prioritise sufficient calories and protein.

Do NOT calculate a supposedly exact daily calorie requirement
from insufficient information.

If the app has not supplied a validated daily target, do not
invent one.

Instead, make the recommendation relative to the user's goal
and current logged intake.

NEXT ACTION

Your next_action should be a short instruction such as:

"Prioritise a high-protein dinner."

"You're in a good position. Just eat normally tonight."

"Add a protein-rich snack later."

"Log your next meal when you're ready."

RECOMMENDATIONS

Return three genuinely different options.

Each should be:

- realistic
- specific
- compatible with the user's goal
- meaningfully useful given what they have already eaten

Examples:

"Greek yoghurt + berries"

"Chicken rice bowl"

"Eggs on toast with fruit"

Do not simply return three generic "healthy foods."

COACHING MESSAGE

One short sentence.

It should feel encouraging and useful rather than like
fitness-influencer content.

If the photograph is not food:

Set is_food to false.

Do not invent nutrition.

Return an empty items array and empty recommendations.

The meal_name should explain what happened, e.g.
"No food detected".
`;

    // ---------------------------------------------
    // OPENAI
    // ---------------------------------------------

    const response =
      await openai.responses.create({
        model: "gpt-5.6-luna",

        input: [
          {
            role: "user",

            content: [
              {
                type: "input_text",
                text: instructions,
              },

              {
                type: "input_image",
                image_url: imageDataUrl,
                detail: "high",
              },
            ],
          },
        ],

        text: {
          format: {
            type: "json_schema",

            name: "nutrition_analysis",

            strict: true,

            schema: nutritionSchema,
          },
        },
      });

    // ---------------------------------------------
    // STRUCTURED OUTPUT
    // ---------------------------------------------

    const raw = response.output_text;

    if (!raw) {
      throw new Error(
        "The nutrition model returned no output."
      );
    }

    const analysis = JSON.parse(raw);

    // ---------------------------------------------
    // NON-FOOD PHOTO
    // ---------------------------------------------

    if (!analysis.is_food) {
      return Response.json({
        success: true,

        food_detected: false,

        meal: null,

        day: {
          calories: caloriesAlready,
          protein_g: proteinAlready,
          carbs_g: carbsAlready,
          fat_g: fatAlready,
        },

        next_action:
          "Take a photo of your meal or snack.",

        recommendations: [],

        insight:
          "No food was detected in that photo.",
      });
    }

    // ---------------------------------------------
    // CALCULATE UPDATED DAY
    //
    // These calculations happen in our code rather
    // than asking the model to do arithmetic.
    // ---------------------------------------------

    const mealCalories =
      Math.max(0, number(analysis.calories));

    const mealProtein =
      Math.max(0, number(analysis.protein_g));

    const mealCarbs =
      Math.max(0, number(analysis.carbs_g));

    const mealFat =
      Math.max(0, number(analysis.fat_g));

    const updatedCalories =
      caloriesAlready + mealCalories;

    const updatedProtein =
      proteinAlready + mealProtein;

    const updatedCarbs =
      carbsAlready + mealCarbs;

    const updatedFat =
      fatAlready + mealFat;

    // ---------------------------------------------
    // RESPONSE
    // ---------------------------------------------

    return Response.json({
      success: true,

      food_detected: true,

      meal: {
        name: analysis.meal_name,

        calories: mealCalories,

        protein_g: mealProtein,

        carbs_g: mealCarbs,

        fat_g: mealFat,

        confidence:
          analysis.confidence,

        items:
          analysis.items,

        assumptions:
          analysis.assumptions,
      },

      day: {
        calories: updatedCalories,

        protein_g: updatedProtein,

        carbs_g: updatedCarbs,

        fat_g: updatedFat,
      },

      next_action:
        analysis.next_action,

      recommendations:
        analysis.recommendations,

      insight:
        analysis.coaching_message,

      meta: {
        goal,

        has_profile:
          Boolean(
            currentWeight ||
            goalWeight ||
            height
          ),

        history_items:
          Array.isArray(history)
            ? history.length
            : 0,
      },
    });

  } catch (error) {
    console.error(
      "NUTRITION_ENGINE_ERROR",
      error
    );

    return Response.json(
      {
        success: false,

        error:
          error?.message ||
          "Nutrition analysis failed.",

        debug:
          process.env.NODE_ENV === "development"
            ? String(error)
            : undefined,
      },
      { status: 500 }
    );
  }
}