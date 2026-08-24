import OpenAI from "openai";

export const runtime = "nodejs";

export async function POST(request) {
  try {
    if (!process.env.OPENAI_API_KEY) {
      return Response.json({ error: "Conn AI needs its food-reading key connected." }, { status: 503 });
    }
    const formData = await request.formData();
    const image = formData.get("image");
    const note = String(formData.get("note") || "").slice(0, 500);
    if (!image || typeof image.arrayBuffer !== "function") {
      return Response.json({ error: "Please choose a photo of your food first." }, { status: 400 });
    }
    if (!image.type?.startsWith("image/")) {
      return Response.json({ error: "That file is not a photo. Please choose an image." }, { status: 400 });
    }
    if (image.size > 10 * 1024 * 1024) {
      return Response.json({ error: "That photo is too large. Please choose one under 10 MB." }, { status: 413 });
    }
    const base64 = Buffer.from(await image.arrayBuffer()).toString("base64");
    const response = await new OpenAI({ apiKey: process.env.OPENAI_API_KEY }).responses.create({
      model: "gpt-4.1-mini",
      input: [{ role: "user", content: [
        { type: "input_text", text: `You are Conn AI, a warm and careful nutrition assistant. Analyze this food photo and return ONLY valid JSON. Identify the meal, visible items, and one best estimate for calories and macros. Use numbers, not ranges. Include visible sauces, oils, and sensible portions. ${note ? `The person added: ${note}` : ""}
Format exactly: {"meal_name":"short name","calories":0,"protein_g":0,"carbs_g":0,"fat_g":0,"items":[{"name":"food item","calories":0}]}` },
        { type: "input_image", image_url: `data:${image.type || "image/jpeg"};base64,${base64}` }
      ] }]
    });
    const text = response.output_text.replace(/```json|```/g, "").trim();
    const result = JSON.parse(text);
    if (!result.meal_name || !Array.isArray(result.items)) throw new Error("Invalid analysis shape");
    return Response.json({ ...result, calories: Number(result.calories) || 0, protein_g: Number(result.protein_g) || 0, carbs_g: Number(result.carbs_g) || 0, fat_g: Number(result.fat_g) || 0 });
  } catch (error) {
    console.error("[v0] Food analysis failed:", error?.message || error);
    const status = error?.status === 429 ? 429 : 500;
    return Response.json({ error: status === 429 ? "The food reader is busy right now. Please try again." : "I couldn’t read that photo. Try a clearer photo." }, { status });
  }
}
