import OpenAI from "openai";

export const runtime = "nodejs";

const client = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

export async function POST(request) {
  try {
    if (!process.env.OPENAI_API_KEY) {
      return Response.json(
        {
          error:
            "OPENAI_API_KEY is not configured.",
        },
        { status: 500 }
      );
    }

    const formData =
      await request.formData();

    const image =
      formData.get("image");

    if (!image) {
      return Response.json(
        {
          error:
            "No food photo received.",
        },
        { status: 400 }
      );
    }

    if (
      typeof image.arrayBuffer !==
      "function"
    ) {
      return Response.json(
        {
          error:
            "Invalid image upload.",
        },
        { status: 400 }
      );
    }

    const bytes =
      await image.arrayBuffer();

    const base64 =
      Buffer.from(bytes).toString(
        "base64"
      );

    const mimeType =
      image.type || "image/jpeg";

    /*
     * ------------------------------------------
     * USER CONTEXT
     * ------------------------------------------
     */

    let profile = {};

    let day = {};

    let history = [];

    try {
      profile = JSON.parse(
        formData.get("profile") ||
          "{}"
      );
    } catch {}

    try {
      day = JSON.parse(
        formData.get("day") ||
          "{}"
      );
    } catch {}

    try {
      history = JSON.parse(
        formData.get("history") ||
          "[]"
      );
    } catch {}

    /*
     * ------------------------------------------
     * SANITISE CONTEXT
     * ------------------------------------------
     */

    const goal =
      ["lose", "maintain", "gain"].includes(
        profile.goal
      )
        ? profile.goal
        : "maintain";

    const currentWeight =
      Number(profile.currentWeight) ||
      70;

    const goalWeight =
      Number(profile.goalWeight) ||
      currentWeight;

    const height =
      Number(profile.height) ||
      175;

    const caloriesAlready =
      Number(day.calories) || 0;

    const proteinAlready =
      Number(day.protein_g) || 0;

    /*
     * We deliberately don't let arbitrary
     * client data become an instruction.
     *
     * It is context only.
     */

    const userContext = {
      goal,
      currentWeight,
      goalWeight,
      height,
      caloriesAlready,
      proteinAlready,
      recentMeals: Array.isArray(history)
        ? history
            .slice(-8)
            .map((meal) => ({
              name: String(
                meal.meal_name ||
                  meal.name ||
                  ""
              ).slice(0, 100),

              calories:
                Number(
                  meal.calories
                ) || 0,
            }))
        : [],
    };

    /*
     * ------------------------------------------
     * MODEL
     * ------------------------------------------
     *
     * Use the current low-cost model available
     * to the project. If you specifically have
     * gpt-4.1-mini enabled, this is also compatible
     * with that model.
     */

    const response =
      await client.responses.create({
        model: "gpt-5.6-luna",

        input: [
          {
            role: "system",

            content: [
              {
                type: "input_text",

                text: `
You are the nutrition intelligence engine inside Food Copilot.

Your job is to turn a photograph of food into a useful, practical nutrition decision.

You are NOT a generic chatbot.

You must:

1. Determine whether the image actually contains food.
2. Identify the meal.
3. Identify visible food components.
4. Estimate realistic portions from visual evidence.
5. Estimate calories, protein, carbohydrates and fat.
6. Account for visible oils, sauces and cooking methods.
7. Avoid pretending that visual nutrition estimates are exact.
8. Give ONE best estimate, not a range.
9. Use the user's current daily intake and goal to make the next recommendation useful.
10. Recommend foods that are realistic and easy to understand.

IMPORTANT:

Do not invent information that cannot reasonably be inferred from the photograph.

If a portion is ambiguous, make the most reasonable estimate and record the assumption.

If the image does not contain food, return food_detected=false.

Do not provide medical advice.

The output must follow the supplied structured schema exactly.
`,
              },
            ],
          },

          {
            role: "user",

            content: [
              {
                type: "input_text",

                text: `
Analyse this food photograph.

USER CONTEXT:

Goal:
${userContext.goal}

Current weight:
${userContext.currentWeight} kg

Goal weight:
${userContext.goalWeight} kg

Height:
${userContext.height} cm

Calories already eaten today:
${userContext.caloriesAlready} kcal

Protein already eaten today:
${userContext.proteinAlready} g

Recent meals:
${JSON.stringify(
  userContext.recentMeals
)}

Use this context when generating the "next_action" and food recommendations.

Do NOT treat these numbers as medically precise targets.

The immediate priority is making the result useful and effortless.
`,
              },

              {
                type: "input_image",

                image_url:
                  `data:${mimeType};base64,${base64}`,
              },
            ],
          },
        ],

        /*
         * Structured output means we no longer
         * depend on stripping markdown fences
         * and hoping JSON.parse succeeds.
         */

        text: {
          format: {
            type: "json_schema",

            name: "food_analysis",

            strict: true,

            schema: {
              type: "object",

              additionalProperties: false,

              properties: {
                food_detected: {
                  type: "boolean",
                },

                meal_name: {
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

                confidence: {
                  type: "string",

                  enum: [
                    "high",
                    "medium",
                    "low",
                  ],
                },

                assumptions: {
                  type: "array",

                  items: {
                    type: "string",
                  },
                },

                items: {
                  type: "array",

                  items: {
                    type: "object",

                    additionalProperties:
                      false,

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

                next_action: {
                  type: "string",
                },

                insight: {
                  type: "string",
                },

                recommendations: {
                  type: "array",

                  items: {
                    type: "object",

                    additionalProperties:
                      false,

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
                "food_detected",
                "meal_name",
                "calories",
                "protein_g",
                "carbs_g",
                "fat_g",
                "confidence",
                "assumptions",
                "items",
                "next_action",
                "insight",
                "recommendations",
              ],
            },
          },
        },
      });

    /*
     * ------------------------------------------
     * PARSE STRUCTURED RESPONSE
     * ------------------------------------------
     */

    let result;

    try {
      result = JSON.parse(
        response.output_text
      );
    } catch (error) {
      console.error(
        "STRUCTURED OUTPUT PARSE ERROR:",
        response.output_text
      );

      return Response.json(
        {
          error:
            "The nutrition engine returned an invalid result.",
        },
        { status: 502 }
      );
    }

    /*
     * ------------------------------------------
     * SANITY CHECK
     * ------------------------------------------
     */

    if (
      typeof result.food_detected !==
      "boolean"
    ) {
      throw new Error(
        "Invalid food_detected value."
      );
    }

    if (!result.food_detected) {
      return Response.json({
        success: true,

        food_detected: false,

        meal_name: "",

        calories: 0,

        protein_g: 0,

        carbs_g: 0,

        fat_g: 0,

        confidence: "low",

        assumptions: [],

        items: [],

        next_action:
          "Take another photo of your food.",

        insight:
          "I couldn't confidently identify food in that image.",

        recommendations: [],
      });
    }

    /*
     * ------------------------------------------
     * NORMALISE NUMBERS
     * ------------------------------------------
     */

    const cleanNumber = (
      value
    ) => {
      const number =
        Number(value);

      if (!Number.isFinite(number)) {
        return 0;
      }

      return Math.max(
        0,
        Math.round(number)
      );
    };

    result.calories =
      cleanNumber(
        result.calories
      );

    result.protein_g =
      cleanNumber(
        result.protein_g
      );

    result.carbs_g =
      cleanNumber(
        result.carbs_g
      );

    result.fat_g =
      cleanNumber(
        result.fat_g
      );

    result.items =
      Array.isArray(
        result.items
      )
        ? result.items.map(
            (item) => ({
              name:
                String(
                  item.name || "Food"
                ),

              portion:
                String(
                  item.portion || ""
                ),

              calories:
                cleanNumber(
                  item.calories
                ),

              protein_g:
                cleanNumber(
                  item.protein_g
                ),

              carbs_g:
                cleanNumber(
                  item.carbs_g
                ),

              fat_g:
                cleanNumber(
                  item.fat_g
                ),
            })
          )
        : [];

    result.recommendations =
      Array.isArray(
        result.recommendations
      )
        ? result.recommendations
            .slice(0, 3)
            .map(
              (item) => ({
                name:
                  String(
                    item.name || ""
                  ),

                reason:
                  String(
                    item.reason || ""
                  ),

                calories:
                  cleanNumber(
                    item.calories
                  ),

                protein_g:
                  cleanNumber(
                    item.protein_g
                  ),
              })
            )
        : [];

    /*
     * ------------------------------------------
     * FINAL RESPONSE
     * ------------------------------------------
     */

    return Response.json({
      success: true,

      food_detected:
        true,

      meal_name:
        String(
          result.meal_name ||
            "Meal"
        ),

      calories:
        result.calories,

      protein_g:
        result.protein_g,

      carbs_g:
        result.carbs_g,

      fat_g:
        result.fat_g,

      confidence:
        result.confidence,

      assumptions:
        result.assumptions,

      items:
        result.items,

      next_action:
        result.next_action,

      insight:
        result.insight,

      recommendations:
        result.recommendations,
    });
  } catch (error) {
    console.error(
      "FOOD COPILOT API ERROR:",
      error
    );

    return Response.json(
      {
        error:
          "Couldn't analyse that photo. Try again.",
      },
      { status: 500 }
    );
  }
}