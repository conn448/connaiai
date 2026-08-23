"use client";

import { useRef, useState } from "react";

export default function Home() {
  const [started, setStarted] = useState(false);

  const [goal, setGoal] = useState("lose");
  const [weight, setWeight] = useState(75);
  const [goalWeight, setGoalWeight] = useState(70);
  const [height, setHeight] = useState(180);

  const [image, setImage] = useState(null);
  const [preview, setPreview] = useState(null);
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);

  const cameraInput = useRef(null);

  function openCamera() {
    cameraInput.current?.click();
  }

  function handlePhoto(event) {
    const file = event.target.files?.[0];

    if (!file) return;

    setImage(file);
    setPreview(URL.createObjectURL(file));
    setResult(null);
  }

  async function analyseFood() {
    if (!image) return;

    setLoading(true);
    setResult(null);

    try {
      const formData = new FormData();

      formData.append("image", image);

      const response = await fetch("/api/analyse", {
        method: "POST",
        body: formData,
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Analysis failed");
      }

      setResult(data);
    } catch (error) {
      console.error(error);

      setResult({
        error: "Couldn't analyse that photo. Try again.",
      });
    } finally {
      setLoading(false);
    }
  }

  // =========================
  // ONBOARDING
  // =========================

  if (!started) {
    return (
      <main style={styles.page}>
        <div style={styles.onboarding}>

          <div style={styles.brand}>CAL AI</div>

          <h1 style={styles.heroTitle}>
            Let’s get started.
          </h1>

          <p style={styles.heroSubtitle}>
            Tell us where you are going.
          </p>

          <div style={styles.section}>
            <div style={styles.label}>
              What’s your goal?
            </div>

            <div style={styles.goalGrid}>
              {[
                ["lose", "Lose"],
                ["maintain", "Maintain"],
                ["gain", "Gain"],
              ].map(([value, label]) => (
                <button
                  key={value}
                  onClick={() => setGoal(value)}
                  style={{
                    ...styles.goalButton,
                    ...(goal === value
                      ? styles.goalButtonActive
                      : {}),
                  }}
                >
                  {label}
                </button>
              ))}
            </div>
          </div>

          <Slider
            title="Current weight"
            value={weight}
            min={40}
            max={150}
            unit="kg"
            setValue={setWeight}
          />

          <Slider
            title="Goal weight"
            value={goalWeight}
            min={40}
            max={150}
            unit="kg"
            setValue={setGoalWeight}
          />

          <Slider
            title="Height"
            value={height}
            min={140}
            max={220}
            unit="cm"
            setValue={setHeight}
          />

          <button
            onClick={() => setStarted(true)}
            style={styles.startButton}
          >
            Start
            <span style={styles.arrow}>→</span>
          </button>

        </div>
      </main>
    );
  }

  // =========================
  // SCANNER
  // =========================

  return (
    <main style={styles.page}>
      <div style={styles.scanner}>

        <div style={styles.scannerTop}>
          <div>
            <div style={styles.brandSmall}>CAL AI</div>
            <h1 style={styles.scannerTitle}>
              Scan your food
            </h1>
          </div>

          <div style={styles.goalBadge}>
            {goal === "lose"
              ? "🔥"
              : goal === "gain"
              ? "💪"
              : "⚖️"}
          </div>
        </div>

        <p style={styles.scannerSubtitle}>
          Take a photo. We’ll do the thinking.
        </p>

        <input
          ref={cameraInput}
          type="file"
          accept="image/*"
          capture="environment"
          onChange={handlePhoto}
          style={{ display: "none" }}
        />

        {!preview && (
          <button
            onClick={openCamera}
            style={styles.cameraCard}
          >
            <div style={styles.cameraCircle}>
              <div style={styles.cameraBody}>
                <div style={styles.cameraLens} />
              </div>
            </div>

            <div style={styles.cameraHeading}>
              Scan meal
            </div>

            <div style={styles.cameraHint}>
              Tap to take a photo
            </div>
          </button>
        )}

        {preview && (
          <>
            <div style={styles.photoWrapper}>
              <img
                src={preview}
                alt="Food"
                style={styles.photo}
              />

              <button
                onClick={openCamera}
                style={styles.retake}
              >
                ↻
              </button>
            </div>

            {!loading && !result && (
              <button
                onClick={analyseFood}
                style={styles.analyse}
              >
                Analyse meal
                <span>→</span>
              </button>
            )}
          </>
        )}

        {loading && (
          <div style={styles.loading}>
            <div style={styles.loadingSymbol}>✦</div>

            <strong>Analysing your meal</strong>

            <span>
              Estimating calories and macros...
            </span>
          </div>
        )}

        {result && !result.error && (
          <div style={styles.result}>

            <div style={styles.resultHeader}>
              <div>
                <div style={styles.resultEyebrow}>
                  YOUR MEAL
                </div>

                <h2 style={styles.mealName}>
                  {result.meal_name}
                </h2>
              </div>

              <div style={styles.check}>
                ✓
              </div>
            </div>

            <div style={styles.calories}>
              {result.calories}
              <span> kcal</span>
            </div>

            <div style={styles.macros}>

              <Macro
                value={result.protein_g}
                label="Protein"
              />

              <Macro
                value={result.carbs_g}
                label="Carbs"
              />

              <Macro
                value={result.fat_g}
                label="Fat"
              />

            </div>

            {result.items?.length > 0 && (
              <>
                <div style={styles.itemsLabel}>
                  FOOD
                </div>

                {result.items.map((item, index) => (
                  <div
                    key={index}
                    style={styles.foodItem}
                  >
                    <span>{item.name}</span>
                    <strong>
                      {item.calories} kcal
                    </strong>
                  </div>
                ))}
              </>
            )}

            <button
              onClick={openCamera}
              style={styles.scanAgain}
            >
              Scan another meal
            </button>

          </div>
        )}

        {result?.error && (
          <div style={styles.error}>
            {result.error}
          </div>
        )}

      </div>
    </main>
  );
}


// =========================
// SLIDER
// =========================

function Slider({
  title,
  value,
  min,
  max,
  unit,
  setValue,
}) {
  return (
    <div style={styles.sliderBlock}>

      <div style={styles.sliderHeader}>
        <span>{title}</span>

        <strong>
          {value} {unit}
        </strong>
      </div>

      <input
        type="range"
        min={min}
        max={max}
        value={value}
        onChange={(e) =>
          setValue(Number(e.target.value))
        }
        style={styles.slider}
      />

    </div>
  );
}


// =========================
// MACRO
// =========================

function Macro({ value, label }) {
  return (
    <div style={styles.macro}>
      <strong>{value}g</strong>
      <span>{label}</span>
    </div>
  );
}


// =========================
// STYLES
// =========================

const styles = {
  page: {
    minHeight: "100vh",
    background: "#f7f7f5",
    padding: "28px 20px",
    fontFamily:
      "-apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif",
    color: "#111",
    boxSizing: "border-box",
  },

  onboarding: {
    width: "100%",
    maxWidth: "430px",
    margin: "0 auto",
    paddingTop: "20px",
  },

  scanner: {
    width: "100%",
    maxWidth: "430px",
    margin: "0 auto",
  },

  brand: {
    textAlign: "center",
    fontSize: "12px",
    fontWeight: "900",
    letterSpacing: "3px",
    marginBottom: "55px",
  },

  brandSmall: {
    fontSize: "11px",
    fontWeight: "900",
    letterSpacing: "2px",
    color: "#999",
    marginBottom: "7px",
  },

  heroTitle: {
    fontSize: "39px",
    lineHeight: "1",
    letterSpacing: "-2px",
    textAlign: "center",
    margin: 0,
  },

  heroSubtitle: {
    textAlign: "center",
    color: "#888",
    fontSize: "15px",
    marginTop: "12px",
    marginBottom: "48px",
  },

  section: {
    marginBottom: "28px",
  },

  label: {
    fontSize: "15px",
    fontWeight: "700",
    marginBottom: "11px",
  },

  goalGrid: {
    display: "grid",
    gridTemplateColumns: "repeat(3, 1fr)",
    gap: "8px",
  },

  goalButton: {
    border: "none",
    borderRadius: "14px",
    padding: "16px 5px",
    background: "#ededeb",
    color: "#333",
    fontSize: "14px",
    fontWeight: "700",
    cursor: "pointer",
  },

  goalButtonActive: {
    background: "#111",
    color: "#fff",
  },

  sliderBlock: {
    marginBottom: "27px",
  },

  sliderHeader: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: "9px",
    fontSize: "14px",
  },

  slider: {
    width: "100%",
    height: "5px",
    accentColor: "#111",
    cursor: "pointer",
  },

  startButton: {
    width: "100%",
    border: "none",
    borderRadius: "16px",
    background: "#111",
    color: "#fff",
    padding: "18px",
    marginTop: "7px",
    fontSize: "17px",
    fontWeight: "800",
    cursor: "pointer",
  },

  arrow: {
    marginLeft: "8px",
    fontSize: "20px",
  },

  scannerTop: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
  },

  scannerTitle: {
    margin: 0,
    fontSize: "32px",
    lineHeight: "1",
    letterSpacing: "-1.5px",
  },

  goalBadge: {
    width: "46px",
    height: "46px",
    borderRadius: "50%",
    background: "#fff",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    fontSize: "19px",
    boxShadow: "0 4px 20px rgba(0,0,0,0.06)",
  },

  scannerSubtitle: {
    color: "#888",
    fontSize: "15px",
    marginTop: "11px",
    marginBottom: "25px",
  },

  cameraCard: {
    width: "100%",
    height: "410px",
    border: "none",
    borderRadius: "30px",
    background:
      "linear-gradient(145deg, #171717, #050505)",
    color: "#fff",
    cursor: "pointer",
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    justifyContent: "center",
    boxShadow: "0 20px 50px rgba(0,0,0,0.12)",
  },

  cameraCircle: {
    width: "185px",
    height: "185px",
    borderRadius: "50%",
    background:
      "radial-gradient(circle at 35% 30%, #fff, #d9d9d9 45%, #777)",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    boxShadow:
      "0 0 70px rgba(255,255,255,0.12)",
    marginBottom: "28px",
  },

  cameraBody: {
    width: "88px",
    height: "65px",
    borderRadius: "17px",
    background: "#111",
    position: "relative",
  },

  cameraLens: {
    position: "absolute",
    width: "31px",
    height: "31px",
    borderRadius: "50%",
    border: "5px solid #fff",
    left: "23px",
    top: "12px",
    boxSizing: "border-box",
  },

  cameraHeading: {
    fontSize: "24px",
    fontWeight: "850",
  },

  cameraHint: {
    marginTop: "8px",
    fontSize: "14px",
    color: "#999",
  },

  photoWrapper: {
    position: "relative",
  },

  photo: {
    width: "100%",
    maxHeight: "520px",
    objectFit: "cover",
    borderRadius: "25px",
    display: "block",
  },

  retake: {
    position: "absolute",
    right: "14px",
    bottom: "14px",
    width: "46px",
    height: "46px",
    borderRadius: "50%",
    border: "none",
    background: "rgba(0,0,0,0.75)",
    color: "#fff",
    fontSize: "23px",
    cursor: "pointer",
  },

  analyse: {
    width: "100%",
    marginTop: "14px",
    padding: "18px",
    borderRadius: "16px",
    border: "none",
    background: "#111",
    color: "#fff",
    fontSize: "17px",
    fontWeight: "800",
    display: "flex",
    justifyContent: "center",
    gap: "10px",
    cursor: "pointer",
  },

  loading: {
    marginTop: "18px",
    padding: "25px",
    borderRadius: "20px",
    background: "#fff",
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    gap: "6px",
    boxShadow: "0 5px 25px rgba(0,0,0,0.04)",
  },

  loadingSymbol: {
    fontSize: "27px",
    marginBottom: "5px",
  },

  result: {
    marginTop: "20px",
    padding: "23px",
    borderRadius: "24px",
    background: "#fff",
    boxShadow: "0 8px 35px rgba(0,0,0,0.05)",
  },

  resultHeader: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
  },

  resultEyebrow: {
    fontSize: "10px",
    fontWeight: "900",
    letterSpacing: "1.5px",
    color: "#999",
  },

  mealName: {
    fontSize: "21px",
    margin: "5px 0 0",
  },

  check: {
    width: "36px",
    height: "36px",
    borderRadius: "50%",
    background: "#111",
    color: "#fff",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    fontWeight: "800",
  },

  calories: {
    fontSize: "43px",
    fontWeight: "900",
    letterSpacing: "-2px",
    margin: "22px 0",
  },

  caloriesUnit: {
    fontSize: "17px",
  },

  macros: {
    display: "grid",
    gridTemplateColumns: "repeat(3, 1fr)",
    gap: "8px",
  },

  macro: {
    background: "#f7f7f5",
    borderRadius: "14px",
    padding: "14px 5px",
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    gap: "3px",
  },

  itemsLabel: {
    fontSize: "10px",
    fontWeight: "900",
    letterSpacing: "1.5px",
    color: "#999",
    marginTop: "25px",
    marginBottom: "3px",
  },

  foodItem: {
    display: "flex",
    justifyContent: "space-between",
    padding: "12px 0",
    borderBottom: "1px solid #eee",
    fontSize: "14px",
  },

  scanAgain: {
    width: "100%",
    padding: "15px",
    marginTop: "20px",
    borderRadius: "14px",
    border: "1px solid #ddd",
    background: "#fff",
    fontWeight: "700",
    cursor: "pointer",
  },

  error: {
    marginTop: "20px",
    padding: "15px",
    borderRadius: "15px",
    background: "#fff0f0",
    color: "#b00020",
    textAlign: "center",
  },
};