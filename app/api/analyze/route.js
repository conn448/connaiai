import OpenAI from "openai";

export const runtime = "nodejs";

export async function POST(request) {
  try {
    if (!process.env.OPENAI_API_KEY) {
      return Response.json(
        { error: "OpenAI API key isn't connected yet." },
        { status: 500 }
      );
    }

    const formData = await request.formData();
    const image = formData.get("image");

    if (!image) {
      return Response.json(
        { error: "No food photo received." },
        { status: 400 }
      );
    }

    const bytes = await image.arrayBuffer();
    const base64 = Buffer.from(bytes).toString("base64");
    const mimeType = image.type || "image/jpeg";

    const openai = new OpenAI({
      apiKey: process.env.OPENAI_API_KEY,
    });

    const response = await openai.responses.create({
      model: "gpt-4.1-mini",
      input: [
        {
          role: "user",
          content: [
            {
              type: "input_text",
              text: `
You are a nutrition analysis engine.

Analyse the food in this photograph.

Identify the meal and visible food items.

Estimate:
- total calories
- protein in grams
- carbohydrates in grams
- fat in grams

Give ONE best estimate rather than a range.

Infer sensible portion sizes from the image.
Account for visible sauces, oils and cooking methods.

Return ONLY valid JSON:

{
  "meal_name": "short meal name",
  "calories": 0,
  "protein_g": 0,
  "carbs_g": 0,
  "fat_g": 0,
  "items": [
    {
      "name": "food item",
      "calories": 0
    }
  ]
}
`,
            },
            {
              type: "input_image",
              image_url: `data:${mimeType};base64,${base64}`,
            },
          ],
        },
      ],
    });

    const text = response.output_text
      .replace(/```json/g, "")
      .replace(/```/g, "")
      .trim();

    const result = JSON.parse(text);

    return Response.json(result);

  } catch (error) {
    console.error("Nutrition API error:", error);

    return Response.json(
      {
        error: "Couldn't analyse that photo. Try again.",
      },
      { status: 500 }
    );
  }
}