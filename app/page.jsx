"use client";

import { useEffect, useMemo, useRef, useState } from "react";

const STORAGE_KEY = "food-copilot-v2";

const DEFAULT_PROFILE = {
  goal: "lose",
  currentWeight: 70,
  goalWeight: 65,
  height: 175,
};

function todayKey() {
  return new Date().toISOString().slice(0, 10);
}

function round(value) {
  const n = Number(value);
  return Number.isFinite(n) ? Math.round(n) : 0;
}

function clamp(value, min, max) {
  return Math.min(Math.max(value, min), max);
}

function calculateTargets(profile) {
  const weight = Number(profile.currentWeight) || 70;

  let calories = weight * 30;

  if (profile.goal === "lose") {
    calories -= 350;
  }

  if (profile.goal === "gain") {
    calories += 300;
  }

  calories = clamp(calories, 1400, 4000);

  const protein =
    profile.goal === "lose"
      ? weight * 1.8
      : weight * 1.6;

  return {
    calories: round(calories),
    protein: round(protein),
  };
}

function cleanMeal(data) {
  return {
    id: Date.now(),

    name:
      data.meal_name ||
      "Meal",

    calories:
      round(data.calories),

    protein_g:
      round(data.protein_g),

    carbs_g:
      round(data.carbs_g),

    fat_g:
      round(data.fat_g),

    confidence:
      data.confidence || "medium",

    assumptions:
      Array.isArray(data.assumptions)
        ? data.assumptions
        : [],

    items:
      Array.isArray(data.items)
        ? data.items
        : [],

    next_action:
      data.next_action || "",

    insight:
      data.insight || "",

    recommendations:
      Array.isArray(data.recommendations)
        ? data.recommendations
        : [],

    createdAt:
      new Date().toISOString(),
  };
}

export default function Home() {
  const fileInput =
    useRef(null);

  const [hydrated, setHydrated] =
    useState(false);

  const [profile, setProfile] =
    useState(DEFAULT_PROFILE);

  const [meals, setMeals] =
    useState([]);

  const [screen, setScreen] =
    useState("home");

  const [result, setResult] =
    useState(null);

  const [imagePreview, setImagePreview] =
    useState(null);

  const [error, setError] =
    useState("");

  const [loading, setLoading] =
    useState(false);

  const [editing, setEditing] =
    useState(false);

  const [showFoodSuggestions, setShowFoodSuggestions] =
    useState(false);

  const [showHistory, setShowHistory] =
    useState(false);

  const [showSettings, setShowSettings] =
    useState(false);

  const [recommendationChosen, setRecommendationChosen] =
    useState(null);

  /*
   * ----------------------------------------
   * LOAD
   * ----------------------------------------
   */

  useEffect(() => {
    try {
      const saved =
        localStorage.getItem(
          STORAGE_KEY
        );

      if (saved) {
        const parsed =
          JSON.parse(saved);

        if (parsed.profile) {
          setProfile(parsed.profile);
        }

        if (
          parsed.date === todayKey() &&
          Array.isArray(parsed.meals)
        ) {
          setMeals(parsed.meals);
        }

        setScreen("home");
      }
    } catch (error) {
      console.error(
        "Could not load local state:",
        error
      );
    }

    setHydrated(true);
  }, []);

  /*
   * ----------------------------------------
   * SAVE
   * ----------------------------------------
   */

  useEffect(() => {
    if (!hydrated) return;

    try {
      localStorage.setItem(
        STORAGE_KEY,
        JSON.stringify({
          profile,
          meals,
          date: todayKey(),
        })
      );
    } catch (error) {
      console.error(
        "Could not save local state:",
        error
      );
    }
  }, [
    profile,
    meals,
    hydrated,
  ]);

  /*
   * ----------------------------------------
   * TARGETS
   * ----------------------------------------
   */

  const targets = useMemo(
    () =>
      calculateTargets(
        profile
      ),
    [profile]
  );

  /*
   * ----------------------------------------
   * DAILY TOTALS
   * ----------------------------------------
   */

  const totals = useMemo(() => {
    return meals.reduce(
      (acc, meal) => ({
        calories:
          acc.calories +
          Number(
            meal.calories || 0
          ),

        protein:
          acc.protein +
          Number(
            meal.protein_g || 0
          ),

        carbs:
          acc.carbs +
          Number(
            meal.carbs_g || 0
          ),

        fat:
          acc.fat +
          Number(
            meal.fat_g || 0
          ),
      }),
      {
        calories: 0,
        protein: 0,
        carbs: 0,
        fat: 0,
      }
    );
  }, [meals]);

  const remainingCalories =
    targets.calories -
    totals.calories;

  const remainingProtein =
    targets.protein -
    totals.protein;

  const caloriePercentage =
    clamp(
      (totals.calories /
        targets.calories) *
        100,
      0,
      100
    );

  /*
   * ----------------------------------------
   * PROFILE
   * ----------------------------------------
   */

  function updateProfile(
    key,
    value
  ) {
    setProfile((old) => ({
      ...old,
      [key]: value,
    }));
  }

  /*
   * ----------------------------------------
   * CAMERA
   * ----------------------------------------
   */

  function openCamera() {
    setError("");

    fileInput.current?.click();
  }

  async function handlePhoto(
    event
  ) {
    const file =
      event.target.files?.[0];

    event.target.value = "";

    if (!file) return;

    if (
      !file.type.startsWith(
        "image/"
      )
    ) {
      setError(
        "Please choose a food photo."
      );
      return;
    }

    if (
      file.size >
      15 * 1024 * 1024
    ) {
      setError(
        "That photo is too large. Try another one."
      );
      return;
    }

    setError("");

    const preview =
      URL.createObjectURL(
        file
      );

    setImagePreview(
      preview
    );

    setScreen(
      "analysing"
    );

    await analysePhoto(file);
  }

  /*
   * ----------------------------------------
   * ANALYSE
   * ----------------------------------------
   */

  async function analysePhoto(
    file
  ) {
    setLoading(true);

    try {
      const formData =
        new FormData();

      formData.append(
        "image",
        file
      );

      formData.append(
        "profile",
        JSON.stringify(
          profile
        )
      );

      formData.append(
        "day",
        JSON.stringify({
          calories:
            totals.calories,

          protein_g:
            totals.protein,

          carbs_g:
            totals.carbs,

          fat_g:
            totals.fat,
        })
      );

      formData.append(
        "history",
        JSON.stringify(
          meals.slice(-8)
        )
      );

      const controller =
        new AbortController();

      const timeout =
        setTimeout(
          () =>
            controller.abort(),
          60000
        );

      let response;

      try {
        response =
          await fetch(
            "/api/analyse",
            {
              method: "POST",
              body: formData,
              signal:
                controller.signal,
            }
          );
      } finally {
        clearTimeout(
          timeout
        );
      }

      let data;

      try {
        data =
          await response.json();
      } catch {
        throw new Error(
          "The analysis server returned an invalid response."
        );
      }

      if (!response.ok) {
        throw new Error(
          data?.error ||
            "Analysis failed."
        );
      }

      if (
        data.food_detected ===
        false
      ) {
        throw new Error(
          data.insight ||
            "I couldn't identify food in that photo."
        );
      }

      const meal =
        cleanMeal(data);

      if (
        !meal.name ||
        meal.calories <= 0
      ) {
        throw new Error(
          "I couldn't confidently analyse that meal."
        );
      }

      setResult(meal);

      setRecommendationChosen(
        null
      );

      setScreen("result");
    } catch (error) {
      console.error(
        "Analysis error:",
        error
      );

      setError(
        error?.name ===
          "AbortError"
          ? "Analysis took too long. Try again."
          : error?.message ||
              "Couldn't analyse that photo. Try again."
      );

      setScreen("home");
    } finally {
      setLoading(false);
    }
  }

  /*
   * ----------------------------------------
   * ADD MEAL
   * ----------------------------------------
   */

  function addMeal() {
    if (!result) return;

    setMeals((old) => [
      ...old,
      {
        ...result,
        id: Date.now(),
      },
    ]);

    setResult(null);
    setImagePreview(null);
    setEditing(false);
    setShowFoodSuggestions(
      false
    );

    setScreen("home");
  }

  /*
   * ----------------------------------------
   * DELETE MEAL
   * ----------------------------------------
   */

  function deleteMeal(id) {
    setMeals((old) =>
      old.filter(
        (meal) =>
          meal.id !== id
      )
    );
  }

  /*
   * ----------------------------------------
   * EDIT RESULT
   * ----------------------------------------
   */

  function editResult(
    key,
    value
  ) {
    setResult((old) => ({
      ...old,
      [key]:
        key === "name"
          ? value
          : round(value),
    }));
  }

  /*
   * ----------------------------------------
   * NEW MEAL
   * ----------------------------------------
   */

  function newMeal() {
    setResult(null);
    setImagePreview(null);
    setError("");
    setEditing(false);
    setShowFoodSuggestions(
      false
    );
    setRecommendationChosen(
      null
    );

    setScreen("home");
  }

  /*
   * ----------------------------------------
   * RESET DAY
   * ----------------------------------------
   */

  function resetDay() {
    const confirmed =
      window.confirm(
        "Clear today's food log?"
      );

    if (!confirmed) return;

    setMeals([]);
  }

  /*
   * ----------------------------------------
   * ONBOARDING
   * ----------------------------------------
   */

  if (
    hydrated &&
    screen ===
      "onboarding"
  ) {
    return (
      <div className="app">
        <div className="app-inner">

          <div
            style={{
              minHeight:
                "calc(100vh - 40px)",
              display: "flex",
              flexDirection:
                "column",
              justifyContent:
                "space-between",
              padding:
                "20px 0",
            }}
          >

            <div>

              <div className="brand">
                FOOD COPILOT
              </div>

              <div
                style={{
                  marginTop: 70,
                }}
              >

                <div className="text-label">
                  ONE SETUP
                </div>

                <h1
                  style={{
                    marginTop: 10,
                  }}
                >
                  What are you
                  trying to do?
                </h1>

                <p
                  style={{
                    marginTop: 16,
                  }}
                >
                  Then just show me
                  your food.
                </p>

              </div>

              <div
                className="goal-selector"
                style={{
                  marginTop: 30,
                }}
              >

                <button
                  className={`goal-option ${
                    profile.goal ===
                    "lose"
                      ? "active"
                      : ""
                  }`}
                  onClick={() =>
                    updateProfile(
                      "goal",
                      "lose"
                    )
                  }
                >
                  Lose fat
                </button>

                <button
                  className={`goal-option ${
                    profile.goal ===
                    "maintain"
                      ? "active"
                      : ""
                  }`}
                  onClick={() =>
                    updateProfile(
                      "goal",
                      "maintain"
                    )
                  }
                >
                  Maintain
                </button>

                <button
                  className={`goal-option ${
                    profile.goal ===
                    "gain"
                      ? "active"
                      : ""
                  }`}
                  onClick={() =>
                    updateProfile(
                      "goal",
                      "gain"
                    )
                  }
                >
                  Gain weight
                </button>

              </div>

              <div
                className="stack-4"
                style={{
                  marginTop: 32,
                }}
              >

                <Slider
                  label="Current weight"
                  value={
                    profile.currentWeight
                  }
                  min={40}
                  max={150}
                  suffix="kg"
                  onChange={(value) =>
                    updateProfile(
                      "currentWeight",
                      value
                    )
                  }
                />

                <Slider
                  label="Goal weight"
                  value={
                    profile.goalWeight
                  }
                  min={40}
                  max={150}
                  suffix="kg"
                  onChange={(value) =>
                    updateProfile(
                      "goalWeight",
                      value
                    )
                  }
                />

                <Slider
                  label="Height"
                  value={
                    profile.height
                  }
                  min={140}
                  max={210}
                  suffix="cm"
                  onChange={(value) =>
                    updateProfile(
                      "height",
                      value
                    )
                  }
                />

              </div>

              <div
                className="next-action"
                style={{
                  marginTop: 25,
                }}
              >

                <div className="text-label">
                  STARTING TARGET
                </div>

                <div className="next-action-title">
                  {
                    targets.calories
                  }{" "}
                  kcal
                </div>

                <div className="next-action-copy">
                  About{" "}
                  {
                    targets.protein
                  }
                  g protein/day.
                </div>

              </div>

            </div>

            <button
              className="btn btn-primary"
              onClick={() =>
                setScreen("home")
              }
              style={{
                marginTop: 30,
              }}
            >
              Start
            </button>

          </div>
        </div>
      </div>
    );
  }

  /*
   * ----------------------------------------
   * ANALYSING
   * ----------------------------------------
   */

  if (
    screen ===
    "analysing"
  ) {
    return (
      <div className="app">
        <div className="app-inner">

          <Header
            onSettings={() =>
              setShowSettings(true)
            }
          />

          {imagePreview && (
            <div
              className="photo-preview"
              style={{
                marginTop: 22,
              }}
            >
              <img
                src={imagePreview}
                alt="Food"
              />

              <div className="photo-overlay" />
            </div>
          )}

          <div
            className="analysis-loading"
            style={{
              marginTop: 16,
            }}
          >

            <div className="analysis-orb" />

            <strong>
              Looking at your food
            </strong>

            <span>
              Identifying portions
              and nutrition...
            </span>

          </div>

        </div>
      </div>
    );
  }

  /*
   * ----------------------------------------
   * RESULT
   * ----------------------------------------
   */

  if (
    screen === "result" &&
    result
  ) {
    return (
      <div className="app">
        <div className="app-inner">

          <Header
            onSettings={() =>
              setShowSettings(true)
            }
          />

          {imagePreview && (
            <div
              className="photo-preview"
              style={{
                marginTop: 18,
                maxHeight: 230,
              }}
            >
              <img
                src={imagePreview}
                alt="Analysed food"
                style={{
                  maxHeight: 230,
                }}
              />
            </div>
          )}

          <section
            className="result-card"
            style={{
              marginTop: 12,
            }}
          >

            {!editing ? (
              <>

                <div className="result-header">

                  <div>

                    <div className="text-label">
                      I THINK THIS IS
                    </div>

                    <h2 className="result-name">
                      {result.name}
                    </h2>

                  </div>

                  <div className="result-check">
                    ✓
                  </div>

                </div>

                <div className="result-calories">
                  {result.calories}
                  <span>
                    kcal
                  </span>
                </div>

                <div className="macro-grid">

                  <Macro
                    value={
                      result.protein_g
                    }
                    label="Protein"
                  />

                  <Macro
                    value={
                      result.carbs_g
                    }
                    label="Carbs"
                  />

                  <Macro
                    value={
                      result.fat_g
                    }
                    label="Fat"
                  />

                </div>

                <button
                  className="btn btn-secondary"
                  style={{
                    width: "100%",
                    marginTop: 18,
                  }}
                  onClick={() =>
                    setEditing(true)
                  }
                >
                  Correct estimate
                </button>

              </>
            ) : (
              <>

                <div className="text-label">
                  EDIT ESTIMATE
                </div>

                <input
                  className="text-input"
                  value={
                    result.name
                  }
                  onChange={(e) =>
                    editResult(
                      "name",
                      e.target.value
                    )
                  }
                  style={{
                    marginTop: 12,
                  }}
                />

                <NumberInput
                  label="Calories"
                  value={
                    result.calories
                  }
                  onChange={(value) =>
                    editResult(
                      "calories",
                      value
                    )
                  }
                />

                <NumberInput
                  label="Protein"
                  value={
                    result.protein_g
                  }
                  onChange={(value) =>
                    editResult(
                      "protein_g",
                      value
                    )
                  }
                />

                <NumberInput
                  label="Carbs"
                  value={
                    result.carbs_g
                  }
                  onChange={(value) =>
                    editResult(
                      "carbs_g",
                      value
                    )
                  }
                />

                <NumberInput
                  label="Fat"
                  value={
                    result.fat_g
                  }
                  onChange={(value) =>
                    editResult(
                      "fat_g",
                      value
                    )
                  }
                />

                <button
                  className="btn btn-primary"
                  style={{
                    marginTop: 15,
                  }}
                  onClick={() =>
                    setEditing(false)
                  }
                >
                  Save correction
                </button>

              </>
            )}

          </section>

          {result.items?.length >
            0 && (
            <section
              className="result-card"
              style={{
                marginTop: 10,
              }}
            >

              <div className="text-label">
                WHAT I FOUND
              </div>

              <div
                className="food-list"
                style={{
                  marginTop: 8,
                }}
              >

                {result.items.map(
                  (
                    item,
                    index
                  ) => (
                    <div
                      className="food-row"
                      key={index}
                    >

                      <div>

                        <div className="food-name">
                          {
                            item.name
                          }
                        </div>

                        <div
                          style={{
                            fontSize: 11,
                            color:
                              "var(--text-muted)",
                            marginTop: 2,
                          }}
                        >
                          {
                            item.portion
                          }
                        </div>

                      </div>

                      <div className="food-amount">
                        {
                          round(
                            item.calories
                          )
                        }{" "}
                        kcal
                      </div>

                    </div>
                  )
                )}

              </div>

            </section>
          )}

          {result.assumptions?.length >
            0 && (
            <section
              className="next-action"
              style={{
                marginTop: 10,
              }}
            >

              <div className="text-label">
                ESTIMATE
              </div>

              <div className="next-action-copy">
                Based on the photo.
                {" "}
                {
                  result.assumptions[0]
                }
              </div>

            </section>
          )}

          <button
            className="btn btn-primary"
            onClick={addMeal}
            style={{
              marginTop: 10,
            }}
          >
            Add to today
          </button>

          <button
            className="btn btn-secondary"
            onClick={newMeal}
            style={{
              marginTop: 8,
              marginBottom: 20,
            }}
          >
            Take another photo
          </button>

        </div>
      </div>
    );
  }

  /*
   * ----------------------------------------
   * MAIN HOME
   * ----------------------------------------
   */

  return (
    <div className="app">

      <div className="app-inner">

        <input
          ref={fileInput}
          type="file"
          accept="image/*"
          capture="environment"
          onChange={handlePhoto}
          style={{
            display: "none",
          }}
        />

        <Header
          onSettings={() =>
            setShowSettings(true)
          }
        />

        <div
          style={{
            marginTop: 42,
          }}
        >

          <div className="text-label">
            {getGreeting()}
          </div>

          <h1
            style={{
              marginTop: 8,
            }}
          >
            What are we
            eating?
          </h1>

          <p
            style={{
              marginTop: 12,
            }}
          >
            Snap it. I'll work
            out the rest.
          </p>

        </div>

        {/* CAMERA */}

        <button
          className="camera-button"
          onClick={openCamera}
          disabled={loading}
          style={{
            marginTop: 25,
          }}
        >

          <div className="camera-icon">
            <div className="camera-lens" />
          </div>

          <div className="camera-title">
            Take a photo
          </div>

          <div className="camera-subtitle">
            Your food → nutrition
          </div>

        </button>

        {/* TODAY */}

        <section
          className="day-card"
          style={{
            marginTop: 10,
          }}
        >

          <div
            style={{
              display: "flex",
              justifyContent:
                "space-between",
              alignItems: "start",
            }}
          >

            <div>

              <div className="text-label">
                TODAY
              </div>

              <div className="day-number">
                {round(
                  totals.calories
                )}
                <span>
                  {" "}
                  /{" "}
                  {
                    targets.calories
                  }{" "}
                  kcal
                </span>
              </div>

            </div>

            <div
              style={{
                textAlign: "right",
              }}
            >

              <div className="text-label">
                LEFT
              </div>

              <div
                style={{
                  fontSize: 18,
                  fontWeight: 800,
                  marginTop: 4,
                }}
              >
                {Math.max(
                  0,
                  round(
                    remainingCalories
                  )
                )}
              </div>

            </div>

          </div>

          <div
            className="progress-track"
            style={{
              marginTop: 15,
            }}
          >
            <div
              className="progress-fill"
              style={{
                width:
                  `${caloriePercentage}%`,
              }}
            />
          </div>

          <div
            style={{
              display: "grid",
              gridTemplateColumns:
                "repeat(3, 1fr)",
              gap: 8,
              marginTop: 15,
            }}
          >

            <MiniStat
              value={
                `${round(
                  totals.protein
                )}g`
              }
              label="protein"
            />

            <MiniStat
              value={
                `${round(
                  totals.carbs
                )}g`
              }
              label="carbs"
            />

            <MiniStat
              value={
                `${round(
                  totals.fat
                )}g`
              }
              label="fat"
            />

          </div>

        </section>

        {/* NEXT MOVE */}

        <section
          className="next-action"
          style={{
            marginTop: 10,
          }}
        >

          <div className="text-label">
            NEXT MOVE
          </div>

          <div
            className="next-action-title"
          >
            {remainingProtein >
            30
              ? `Get roughly ${round(
                  remainingProtein
                )}g more protein.`
              : remainingCalories >
                500
              ? "You've got plenty of room left."
              : "You're getting close to target."}
          </div>

          <div className="next-action-copy">
            {remainingProtein >
            30
              ? "Make your next meal protein-heavy."
              : remainingCalories >
                500
              ? "Choose something satisfying that fits your remaining calories."
              : "Keep the rest of the day simple and satisfying."}
          </div>

        </section>

        {/* WHAT SHOULD I EAT */}

        <button
          className="btn btn-primary"
          style={{
            marginTop: 10,
          }}
          onClick={() =>
            setShowFoodSuggestions(
              (value) => !value
            )
          }
        >
          {showFoodSuggestions
            ? "Hide food ideas"
            : "What should I eat next?"}
        </button>

        {showFoodSuggestions && (
          <section
            className="recommendations"
            style={{
              marginTop: 8,
            }}
          >

            {result?.recommendations
              ?.length > 0
              ? result.recommendations.map(
                  (
                    recommendation,
                    index
                  ) => (
                    <Recommendation
                      key={index}
                      recommendation={
                        recommendation
                      }
                      selected={
                        recommendationChosen ===
                        index
                      }
                      onClick={() =>
                        setRecommendationChosen(
                          index
                        )
                      }
                    />
                  )
                )
              : (
                <>
                  <Recommendation
                    recommendation={{
                      name:
                        "Chicken & rice",
                      reason:
                        remainingProtein >
                        30
                          ? "High protein and easy to fit into the rest of your day."
                          : "A balanced, filling meal.",
                      calories: 550,
                      protein_g: 45,
                    }}
                    selected={
                      recommendationChosen ===
                      0
                    }
                    onClick={() =>
                      setRecommendationChosen(
                        0
                      )
                    }
                  />

                  <Recommendation
                    recommendation={{
                      name:
                        "Chicken wrap",
                      reason:
                        "Simple, filling and protein-rich.",
                      calories: 450,
                      protein_g: 35,
                    }}
                    selected={
                      recommendationChosen ===
                      1
                    }
                    onClick={() =>
                      setRecommendationChosen(
                        1
                      )
                    }
                  />

                  <Recommendation
                    recommendation={{
                      name:
                        "Greek yoghurt + fruit",
                      reason:
                        "Quick protein without a huge calorie hit.",
                      calories: 250,
                      protein_g: 18,
                    }}
                    selected={
                      recommendationChosen ===
                      2
                    }
                    onClick={() =>
                      setRecommendationChosen(
                        2
                      )
                    }
                  />
                </>
              )}

            {recommendationChosen !==
              null && (
              <div
                className="next-action"
                style={{
                  marginTop: 8,
                }}
              >
                <div className="text-label">
                  GOOD CHOICE
                </div>

                <div className="next-action-copy">
                  You've selected an
                  option. When you eat
                  it, just photograph it
                  and Food Copilot will
                  add it to your day.
                </div>
              </div>
            )}

          </section>
        )}

        {/* HISTORY */}

        {meals.length > 0 && (
          <button
            className="btn btn-secondary"
            style={{
              marginTop: 10,
            }}
            onClick={() =>
              setShowHistory(
                (value) => !value
              )
            }
          >
            {showHistory
              ? "Hide today's meals"
              : `Today's meals (${meals.length})`}
          </button>
        )}

        {showHistory && (
          <section
            className="result-card"
            style={{
              marginTop: 8,
              marginBottom: 20,
            }}
          >

            <div className="text-label">
              TODAY'S LOG
            </div>

            <div
              className="food-list"
              style={{
                marginTop: 7,
              }}
            >

              {meals
                .slice()
                .reverse()
                .map((meal) => (
                  <div
                    className="food-row"
                    key={meal.id}
                  >

                    <div>

                      <div className="food-name">
                        {meal.name}
                      </div>

                      <div
                        style={{
                          marginTop: 3,
                          fontSize: 11,
                          color:
                            "var(--text-muted)",
                        }}
                      >
                        {
                          formatTime(
                            meal.createdAt
                          )
                        }{" "}
                        ·{" "}
                        {
                          meal.protein_g
                        }g protein
                      </div>

                    </div>

                    <div
                      style={{
                        display: "flex",
                        alignItems:
                          "center",
                        gap: 8,
                      }}
                    >

                      <span className="food-amount">
                        {
                          meal.calories
                        }{" "}
                        kcal
                      </span>

                      <button
                        className="delete-button"
                        onClick={() =>
                          deleteMeal(
                            meal.id
                          )
                        }
                        aria-label="Delete meal"
                      >
                        ×
                      </button>

                    </div>

                  </div>
                ))}

            </div>

            <button
              className="btn btn-ghost"
              style={{
                width: "100%",
                marginTop: 15,
              }}
              onClick={resetDay}
            >
              Clear today's log
            </button>

          </section>
        )}

      </div>

      {/* SETTINGS */}

      {showSettings && (
        <div
          className="modal-backdrop"
          onClick={() =>
            setShowSettings(false)
          }
        >
          <div
            className="modal"
            onClick={(event) =>
              event.stopPropagation()
            }
          >

            <div
              style={{
                display: "flex",
                justifyContent:
                  "space-between",
                alignItems:
                  "center",
              }}
            >

              <h2>
                Your setup
              </h2>

              <button
                className="delete-button"
                onClick={() =>
                  setShowSettings(
                    false
                  )
                }
              >
                ×
              </button>

            </div>

            <div
              className="goal-selector"
              style={{
                marginTop: 20,
              }}
            >

              <button
                className={`goal-option ${
                  profile.goal ===
                  "lose"
                    ? "active"
                    : ""
                }`}
                onClick={() =>
                  updateProfile(
                    "goal",
                    "lose"
                  )
                }
              >
                Lose fat
              </button>

              <button
                className={`goal-option ${
                  profile.goal ===
                  "maintain"
                    ? "active"
                    : ""
                }`}
                onClick={() =>
                  updateProfile(
                    "goal",
                    "maintain"
                  )
                }
              >
                Maintain
              </button>

              <button
                className={`goal-option ${
                  profile.goal ===
                  "gain"
                    ? "active"
                    : ""
                }`}
                onClick={() =>
                  updateProfile(
                    "goal",
                    "gain"
                  )
                }
              >
                Gain
              </button>

            </div>

            <div
              className="stack-4"
              style={{
                marginTop: 25,
              }}
            >

              <Slider
                label="Current weight"
                value={
                  profile.currentWeight
                }
                min={40}
                max={150}
                suffix="kg"
                onChange={(value) =>
                  updateProfile(
                    "currentWeight",
                    value
                  )
                }
              />

              <Slider
                label="Goal weight"
                value={
                  profile.goalWeight
                }
                min={40}
                max={150}
                suffix="kg"
                onChange={(value) =>
                  updateProfile(
                    "goalWeight",
                    value
                  )
                }
              />

              <Slider
                label="Height"
                value={
                  profile.height
                }
                min={140}
                max={210}
                suffix="cm"
                onChange={(value) =>
                  updateProfile(
                    "height",
                    value
                  )
                }
              />

            </div>

            <div
              className="next-action"
              style={{
                marginTop: 20,
              }}
            >

              <div className="text-label">
                CURRENT TARGET
              </div>

              <div className="next-action-title">
                {
                  targets.calories
                }{" "}
                kcal
              </div>

              <div className="next-action-copy">
                {
                  targets.protein
                }
                g protein/day.
              </div>

            </div>

            <button
              className="btn btn-primary"
              style={{
                marginTop: 12,
              }}
              onClick={() =>
                setShowSettings(
                  false
                )
              }
            >
              Done
            </button>

          </div>
        </div>
      )}

    </div>
  );
}

/*
 * ------------------------------------------
 * COMPONENTS
 * ------------------------------------------
 */

function Header({
  onSettings,
}) {
  return (
    <div
      style={{
        display: "flex",
        justifyContent:
          "space-between",
        alignItems:
          "center",
      }}
    >

      <div className="brand">
        FOOD COPILOT
      </div>

      <button
        className="settings-button"
        onClick={onSettings}
        aria-label="Settings"
      >
        ⚙
      </button>

    </div>
  );
}

function Slider({
  label,
  value,
  min,
  max,
  suffix,
  onChange,
}) {
  return (
    <div className="slider-group">

      <div className="slider-header">

        <span className="slider-label">
          {label}
        </span>

        <span className="slider-value">
          {value} {suffix}
        </span>

      </div>

      <input
        type="range"
        min={min}
        max={max}
        value={value}
        onChange={(event) =>
          onChange(
            Number(
              event.target.value
            )
          )
        }
      />

    </div>
  );
}

function Macro({
  value,
  label,
}) {
  return (
    <div className="macro-card">

      <span className="macro-value">
        {value}g
      </span>

      <span className="macro-label">
        {label}
      </span>

    </div>
  );
}

function MiniStat({
  value,
  label,
}) {
  return (
    <div>

      <div
        style={{
          fontSize: 14,
          fontWeight: 800,
        }}
      >
        {value}
      </div>

      <div
        style={{
          fontSize: 10,
          marginTop: 2,
          color:
            "rgba(255,255,255,.45)",
        }}
      >
        {label}
      </div>

    </div>
  );
}

function NumberInput({
  label,
  value,
  onChange,
}) {
  return (
    <div
      style={{
        marginTop: 10,
      }}
    >

      <label
        className="text-small"
        style={{
          fontWeight: 750,
        }}
      >
        {label}
      </label>

      <input
        className="text-input"
        type="number"
        value={value}
        onChange={(event) =>
          onChange(
            event.target.value
          )
        }
      />

    </div>
  );
}

function Recommendation({
  recommendation,
  selected,
  onClick,
}) {
  return (
    <button
      className={`recommendation ${
        selected
          ? "selected"
          : ""
      }`}
      onClick={onClick}
    >

      <div
        className="recommendation-main"
      >

        <div className="recommendation-name">
          {
            recommendation.name
          }
        </div>

        <div className="recommendation-reason">
          {
            recommendation.reason
          }
        </div>

      </div>

      <div className="recommendation-stats">

        <div className="recommendation-calories">
          {
            round(
              recommendation.calories
            )
          }{" "}
          kcal
        </div>

        <div className="recommendation-protein">
          {
            round(
              recommendation.protein_g
            )
          }g protein
        </div>

      </div>

    </button>
  );
}