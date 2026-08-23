import OpenAI from "openai";

export const runtime = "nodejs";

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

export async function POST(request) {
  try {
    if (!process.env.OPENAI_API_KEY) {
      return Response.json(
        { error: "OPENAI_API_KEY is missing." },
        { status: 500 }
      );
    }

    const formData = await request.formData();

    const image = formData.get("image");

    /*
      Optional user information.

      The frontend can start sending these immediately,
      but the API also works if they aren't supplied yet.
    */

    const profileRaw = formData.get("profile");
    const dayRaw = formData.get("day");

    let profile = {};
    let day = {
      calories_eaten: 0,
      protein_eaten: 0,
      carbs_eaten: 0,
      fat_eaten: 0,
      meals: [],
    };

    try {
      if (profileRaw) {
        profile = JSON.parse(profileRaw);
      }
    } catch {}

    try {
      if (dayRaw) {
        day = JSON.parse(dayRaw);
      }
    } catch {}

    if (!image) {
      return Response.json(
        { error: "No food photo received." },
        { status: 400 }
      );
    }

    const bytes = await image.arrayBuffer();
    const base64 = Buffer.from(bytes).toString("base64");
    const mimeType = image.type || "image/jpeg";

    /*
      --------------------------------------------------
      STEP 1
      Calculate a sensible starting nutrition target.
      This is deliberately an estimate, not medical advice.
      --------------------------------------------------
    */

    const currentWeight = Number(profile.current_weight) || null;
    const goalWeight = Number(profile.goal_weight) || null;
    const height = Number(profile.height) || null;

    const goal = profile.goal || "maintain";

    /*
      We don't pretend a photo can give laboratory precision.
      The AI is instructed to expose uncertainty internally
      and produce a useful estimate.
    */

    const prompt = `
You are the core intelligence engine of a consumer nutrition app.

Your job is NOT merely to count calories.

Your job is to understand this person's meal, their current day,
their goal, and what action would be most useful next.

USER PROFILE
Goal: ${goal}
Current weight: ${currentWeight ?? "unknown"} kg
Goal weight: ${goalWeight ?? "unknown"} kg
Height: ${height ?? "unknown"} cm

TODAY SO FAR
Calories eaten: ${day.calories_eaten || 0}
Protein eaten: ${day.protein_eaten || 0} g
Carbs eaten: ${day.carbs_eaten || 0} g
Fat eaten: ${day.fat_eaten || 0} g

MEALS ALREADY LOGGED
${JSON.stringify(day.meals || [])}

TASK

Analyse the photograph.

Identify:
1. The meal
2. Individual visible foods
3. Approximate portions
4. Calories
5. Protein
6. Carbohydrates
7. Fat

Be particularly careful about:
- oils
- sauces
- dressings
- cheese
- fried food
- cooking methods
- portion size
- mixed dishes

Do NOT claim impossible precision.

Then determine what this meal means for the person's day.

Determine:
- updated daily calories
- updated protein
- updated carbs
- updated fat
- estimated remaining calories
- estimated remaining protein
- the single most useful next food recommendation

The recommendation should be practical and specific.

Examples:

BAD:
"Eat more protein."

GOOD:
"Greek yoghurt + berries — ~250 kcal, ~20g protein."

BAD:
"Have a healthy dinner."

GOOD:
"Chicken fajitas with peppers and rice — ~650 kcal, ~50g protein."

The product should feel like someone has a brilliant nutrition coach
quietly making decisions for them.

Do not lecture.
Do not overwhelm.
Do not produce generic wellness advice.

Return ONLY JSON.
`;

    const response = await openai.responses.create({
      model: "gpt-5.6-luna",
      input: [
        {
          role: "user",
          content: [
            {
              type: "input_text",
              text: prompt,
            },
            {
              type: "input_image",
              image_url: `data:${mimeType};base64,${base64}`,
            },
          ],
        },
      ],
    });

    let text = response.output_text
      .replace(/```json/g, "")
      .replace(/```/g, "")
      .trim();

    const aiResult = JSON.parse(text);

    /*
      --------------------------------------------------
      NORMALISE RESPONSE
      --------------------------------------------------
    */

    const calories = Number(aiResult.calories) || 0;
    const protein = Number(aiResult.protein_g) || 0;
    const carbs = Number(aiResult.carbs_g) || 0;
    const fat = Number(aiResult.fat_g) || 0;

    const caloriesEaten =
      Number(day.calories_eaten || 0) + calories;

    const proteinEaten =
      Number(day.protein_eaten || 0) + protein;

    const carbsEaten =
      Number(day.carbs_eaten || 0) + carbs;

    const fatEaten =
      Number(day.fat_eaten || 0) + fat;

    /*
      --------------------------------------------------
      INITIAL TARGETS
      --------------------------------------------------

      These are intentionally approximate until we have
      proper user profile/account infrastructure.
    */

    let calorieTarget = 2000;

    if (goal === "lose") {
      calorieTarget = 2000;
    }

    if (goal === "maintain") {
      calorieTarget = 2400;
    }

    if (goal === "gain") {
      calorieTarget = 2800;
    }

    const proteinTarget = currentWeight
      ? Math.round(currentWeight * 1.8)
      : 130;

    const remainingCalories = Math.max(
      0,
      calorieTarget - caloriesEaten
    );

    const remainingProtein = Math.max(
      0,
      proteinTarget - proteinEaten
    );

    /*
      --------------------------------------------------
      RETURN A PRODUCT-READY OBJECT
      --------------------------------------------------
    */

    return Response.json({
      success: true,

      meal: {
        name: aiResult.meal_name || "Meal",
        calories,
        protein_g: protein,
        carbs_g: carbs,
        fat_g: fat,
        items: aiResult.items || [],
      },

      day: {
        calories_eaten: caloriesEaten,
        calorie_target: calorieTarget,
        calories_remaining: remainingCalories,

        protein_eaten: proteinEaten,
        protein_target: proteinTarget,
        protein_remaining: remainingProtein,

        carbs_eaten: carbsEaten,
        fat_eaten: fatEaten,
      },

      recommendation: {
        title:
          aiResult.next_food?.title ||
          "Plan your next meal",

        description:
          aiResult.next_food?.description ||
          "Choose a meal that helps you stay on target.",

        calories:
          Number(aiResult.next_food?.calories) ||
          Math.min(remainingCalories, 500),

        protein_g:
          Number(aiResult.next_food?.protein_g) ||
          Math.min(remainingProtein, 30),
      },

      intelligence: {
        goal,
        current_weight: currentWeight,
        goal_weight: goalWeight,

        message:
          aiResult.coaching_message ||
          "You're making progress. Keep going.",

        next_best_action:
          aiResult.next_best_action ||
          "Log your next meal.",
      },
    });

  } catch (error) {
    console.error("NUTRITION ENGINE ERROR:", error);

    return Response.json(
      {
        success: false,
        error:
          error?.message ||
          "Nutrition analysis failed.",
      },
      { status: 500 }
    );
  }
}