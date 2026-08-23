export async function POST(request) {
  console.log("ANALYSE ROUTE HIT");

  return Response.json({
    meal_name: "Test meal",
    calories: 500,
    protein_g: 30,
    carbs_g: 50,
    fat_g: 20,
    items: [
      {
        name: "Test food",
        calories: 500
      }
    ]
  });
}