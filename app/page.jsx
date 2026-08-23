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

  if (!started) {
    return (
      <main style={styles.page}>
        <div style={styles.container}>

          <div style={styles.logo}>CAL AI</div>

          <h1 style={styles.title}>
            Let’s get started
          </h1>

          <p style={styles.subtitle}>
            Set your goal. We’ll do the rest.
          </p>

          <h3 style={styles.question}>
            What’s your goal?
          </h3>

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
                  background: goal === value ? "#111" : "#f6f6f6",
                  color: goal === value ? "#fff" : "#333",
                  transform:
                    goal === value ? "scale(1.02)" : "scale(1)",
                }}
              >
                {label}
              </button>
            ))}
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
            Start →
          </button>

        </div>
      </main>
    );
  }

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

      const response = await fetch("/api", {
        method: "POST",
        body: formData,
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error);
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

  return (
    <main style={styles.page}>
      <div style={styles.container}>

        <div style={styles.scannerHeader}>
          <div>
            <div style={styles.smallLogo}>CAL AI</div>
            <h1 style={styles.scannerTitle}>
              Scan your food
            </h1>
          </div>

          <div style={styles.profileCircle}>
            {goal === "lose" ? "🔥" : goal === "gain" ? "💪" : "⚖️"}
          </div>
        </div>

        <p style={styles.scannerSubtitle}>
          One photo. Instant nutrition.
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
            <div style={styles.cameraGlow}>
              <div style={styles.cameraIcon}>
                <div style={styles.cameraLens}></div>
              </div>
            </div>

            <div style={styles.cameraTitle}>
              Scan meal
            </div>

            <div style={styles.cameraSubtitle}>
              Tap to take a photo
            </div>
          </button>
        )}

        {preview && (
          <>
            <div style={styles.photoContainer}>
              <img
                src={preview}
                alt="Food"
                style={styles.preview}
              />

              <button
                onClick={openCamera}
                style={styles.retakeButton}
              >
                ↻
              </button>
            </div>

            {!loading && !result && (
              <button
                onClick={analyseFood}
                style={styles.analyseButton}
              >
                Analyse meal →
              </button>
            )}
          </>
        )}

        {loading && (
          <div style={styles.loadingCard}>
            <div style={styles.loadingIcon}>✦</div>

            <strong>Analysing your meal</strong>

            <span>
              Estimating calories & macros...
            </span>
          </div>
        )}

        {result && !result.error && (
          <div style={styles.result}>

            <div style={styles.resultTop}>
              <div>
                <span style={styles.resultLabel}>
                  YOUR MEAL
                </span>

                <h2 style={{ margin: "5px 0 0" }}>
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

            <div style={styles.itemsTitle}>
              FOOD
            </div>

            {result.items?.map((item, index) => (
              <div
                key={index}
                style={styles.item}
              >
                <span>{item.name}</span>
                <strong>{item.calories} kcal</strong>
              </div>
            ))}

            <button
              onClick={openCamera}
              style={styles.secondaryButton}
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

function Slider({
  title,
  value,
  min,
  max,
  unit,
  setValue,
}) {
  return (
    <div style={styles.sliderContainer}>

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

function Macro({ value, label }) {
  return (
    <div style={styles.macro}>
      <strong>{value}g</strong>
      <span>{label}</span>
    </div>
  );
}

const styles = {

  page: {
    minHeight: "100vh",
    background: "#f7f7f5",
    padding: "30px 20px",
    display: "flex",
    justifyContent: "center",
    fontFamily:
      "-apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif",
    color: "#111",
  },

  container: {
    width: "100%",
    maxWidth: "430px",
  },

  logo: {
    textAlign: "center",
    fontSize: "13px",
    fontWeight: "900",
    letterSpacing: "2px",
    marginBottom: "35px",
  },

  smallLogo: {
    fontSize: "11px",
    fontWeight: "900",
    letterSpacing: "2px",
    color: "#888",
    marginBottom: "5px",
  },

  title: {
    fontSize: "36px",
    lineHeight: "1.05",
    textAlign: "center",
    margin: "0 0 10px",
    letterSpacing: "-1.5px",
  },

  subtitle: {
    textAlign: "center",
    color: "#888",
    fontSize: "15px",
    marginBottom: "42px",
  },

  question: {
    marginBottom: "12px",
    fontSize: "16px",
  },

  goalGrid: {
    display: "grid",
    gridTemplateColumns: "repeat(3, 1fr)",
    gap: "8px",
    marginBottom: "32px",
  },

  goalButton: {
    padding: "15px 5px",
    borderRadius: "14px",
    border: "none",
    fontWeight: "700",
    cursor: "pointer",
    transition: "0.15s",
  },

  sliderContainer: {
    marginBottom: "25px",
  },

  sliderHeader: {
    display: "flex",
    justifyContent: "space-between",
    marginBottom: "9px",
    fontSize: "14px",
  },

  slider: {
    width: "100%",
    height: "5px",
    accentColor: "#111",
  },

  startButton: {
    width: "100%",
    padding: "18px",
    marginTop: "8px",
    borderRadius: "16px",
    border: "none",
    background: "#111",
    color: "#fff",
    fontSize: "17px",
    fontWeight: "800",
    cursor: "pointer",
  },

  scannerHeader: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
  },

  scannerTitle: {
    fontSize: "32px",
    lineHeight: "1",
    margin: 0,
    letterSpacing: "-1px",
  },

  profileCircle: {
    width: "45px",
    height: "45px",
    borderRadius: "50%",
    background: "#fff",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    boxShadow: "0 4px 20px rgba(0,0,0,0.06)",
    fontSize: "19px",
  },

  scannerSubtitle: {
    color: "#888",
    margin: "12px 0 25px",
  },

  cameraCard: {
    width: "100%",
    height: "390px",
    borderRadius: "30px",
    border: "none",
    background: "#111",
    color: "#fff",
    cursor: "pointer",
    position: "relative",
    overflow: "hidden",
  },

  cameraGlow: {
    width: "190px",
    height: "190px",
    borderRadius: "50%",
    margin: "0 auto 30px",
    background:
      "radial-gradient(circle, #ffffff 0%, #d9d9d9 45%, #444 100%)",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    boxShadow:
      "0 0 80px rgba(255,255,255,0.12)",
  },

  cameraIcon: {
    width: "86px",
    height: "64px",
    borderRadius: "18px",
    background: "#111",
    position: "relative",
  },

  cameraLens: {
    width: "31px",
    height: "31px",
    borderRadius: "50%",
    border: "5px solid #fff",
    position: "absolute",
    top: "16px",
    left: "27px",
  },

  cameraTitle: {
    fontSize: "24px",
    fontWeight: "800",
  },

  cameraSubtitle: {
    color: "#aaa",
    marginTop: "7px",
    fontSize: "14px",
  },

  photoContainer: {
    position: "relative",
  },

  preview: {
    width: "100%",
    maxHeight: "500px",
    objectFit: "cover",
    borderRadius: "25px",
    display: "block",
  },

  retakeButton: {
    position: "absolute",
    right: "15px",
    bottom: "15px",
    width: "45px",
    height: "45px",
    borderRadius: "50%",
    border: "none",
    background: "rgba(0,0,0,0.75)",
    color: "#fff",
    fontSize: "23px",
  },

  analyseButton: {
    width: "100%",
    padding: "18px",
    marginTop: "14px",
    borderRadius: "16px",
    border: "none",
    background: "#111",
    color: "#fff",
    fontSize: "17px",
    fontWeight: "800",
  },

  loadingCard: {
    marginTop: "18px",
    padding: "24px",
    borderRadius: "20px",
    background: "#fff",
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    gap: "7px",
  },

  loadingIcon: {
    fontSize: "28px",
    marginBottom: "5px",
  },

  result: {
    marginTop: "22px",
    padding: "23px",
    borderRadius: "24px",
    background: "#fff",
    boxShadow: "0 5px 30px rgba(0,0,0,0.05)",
  },

  resultTop: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
  },

  resultLabel: {
    fontSize: "10px",
    letterSpacing: "1.5px",
    fontWeight: "800",
    color: "#999",
  },

  check: {
    width: "35px",
    height: "35px",
    borderRadius: "50%",
    background: "#111",
    color: "#fff",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
  },

  calories: {
    fontSize: "42px",
    fontWeight: "900",
    letterSpacing: "-2px",
    margin: "22px 0",
  },

  macros: {
    display: "grid",
    gridTemplateColumns: "repeat(3, 1fr)",
    gap: "8px",
  },

  macro: {
    background: "#f7f7f5",
    borderRadius: "14px",
    padding: "13px 5px",
    textAlign: "center",
    display: "flex",
    flexDirection: "column",
    gap: "3px",
  },

  item: {
    display: "flex",
    justifyContent: "space-between",
    padding: "12px 0",
    borderBottom: "1px solid #eee",
    fontSize: "14px",
  },

  itemsTitle: {
    fontSize: "10px",
    letterSpacing: "1.5px",
    fontWeight: "800",
    color: "#999",
    marginTop: "25px",
  },

  secondaryButton: {
    width: "100%",
    padding: "15px",
    marginTop: "20px",
    borderRadius: "14px",
    border: "1px solid #ddd",
    background: "#fff",
    fontWeight: "700",
  },

  error: {
    marginTop: "20px",
    padding: "15px",
    borderRadius: "15px",
    background: "#fff0f0",
    textAlign: "center",
  },
};