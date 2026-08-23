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

  // -------------------------
  // ONBOARDING
  // -------------------------

  if (!started) {
    return (
      <main style={styles.page}>
        <div style={styles.container}>

          <h1 style={styles.title}>Let’s get started</h1>

          <p style={styles.subtitle}>
            Set your goal. We’ll do the rest.
          </p>

          <h3>What’s your goal?</h3>

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
                  background: goal === value ? "#000" : "#fff",
                  color: goal === value ? "#fff" : "#000",
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
            Start
          </button>

        </div>
      </main>
    );
  }

  // -------------------------
  // CAMERA
  // -------------------------

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

        <h1 style={styles.title}>Scan your food</h1>

        <p style={styles.subtitle}>
          Take a photo. We'll work out the nutrition.
        </p>

        {/* Hidden camera input */}
        <input
          ref={cameraInput}
          type="file"
          accept="image/*"
          capture="environment"
          onChange={handlePhoto}
          style={{ display: "none" }}
        />

        {/* CAMERA */}
        {!preview && (
          <button
            onClick={openCamera}
            style={styles.cameraButton}
          >
            <div style={styles.cameraIcon}>📷</div>
            <div>Scan food</div>
          </button>
        )}

        {/* PHOTO PREVIEW */}
        {preview && (
          <>
            <img
              src={preview}
              alt="Food"
              style={styles.preview}
            />

            {!loading && !result && (
              <button
                onClick={analyseFood}
                style={styles.startButton}
              >
                Analyse
              </button>
            )}
          </>
        )}

        {loading && (
          <div style={styles.loading}>
            <div style={{ fontSize: "30px" }}>◌</div>
            Analysing your food...
          </div>
        )}

        {/* RESULT */}
        {result && !result.error && (
          <div style={styles.result}>

            <h2>{result.meal_name}</h2>

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

            <h3>Items</h3>

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
              Scan another
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


// -------------------------
// SLIDER
// -------------------------

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
        <strong>{title}</strong>

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


// -------------------------
// MACRO
// -------------------------

function Macro({ value, label }) {
  return (
    <div style={styles.macro}>
      <strong>{value}g</strong>
      <span>{label}</span>
    </div>
  );
}


// -------------------------
// STYLES
// -------------------------

const styles = {

  page: {
    minHeight: "100vh",
    background: "#fff",
    padding: "40px 24px",
    display: "flex",
    justifyContent: "center",
    fontFamily: "Arial, sans-serif",
  },

  container: {
    width: "100%",
    maxWidth: "420px",
  },

  title: {
    fontSize: "36px",
    textAlign: "center",
    marginBottom: "8px",
  },

  subtitle: {
    textAlign: "center",
    color: "#777",
    marginBottom: "40px",
  },

  goalGrid: {
    display: "grid",
    gridTemplateColumns: "repeat(3, 1fr)",
    gap: "8px",
    marginBottom: "32px",
  },

  goalButton: {
    padding: "14px 5px",
    borderRadius: "12px",
    border: "1px solid #ddd",
    fontWeight: "600",
  },

  sliderContainer: {
    marginBottom: "28px",
  },

  sliderHeader: {
    display: "flex",
    justifyContent: "space-between",
    marginBottom: "8px",
  },

  slider: {
    width: "100%",
  },

  startButton: {
    width: "100%",
    padding: "17px",
    marginTop: "16px",
    borderRadius: "14px",
    border: "none",
    background: "#000",
    color: "#fff",
    fontSize: "18px",
    fontWeight: "700",
  },

  cameraButton: {
    width: "100%",
    height: "260px",
    borderRadius: "24px",
    border: "2px dashed #ccc",
    background: "#fafafa",
    fontSize: "20px",
    fontWeight: "700",
  },

  cameraIcon: {
    fontSize: "60px",
    marginBottom: "15px",
  },

  preview: {
    width: "100%",
    maxHeight: "450px",
    objectFit: "cover",
    borderRadius: "20px",
  },

  loading: {
    textAlign: "center",
    marginTop: "30px",
    color: "#666",
  },

  result: {
    marginTop: "25px",
    padding: "22px",
    borderRadius: "20px",
    background: "#f5f5f5",
  },

  calories: {
    fontSize: "38px",
    fontWeight: "800",
    margin: "15px 0 25px",
  },

  macros: {
    display: "grid",
    gridTemplateColumns: "repeat(3, 1fr)",
    gap: "10px",
    marginBottom: "25px",
  },

  macro: {
    textAlign: "center",
    padding: "12px 5px",
    background: "#fff",
    borderRadius: "12px",
  },

  item: {
    display: "flex",
    justifyContent: "space-between",
    padding: "11px 0",
    borderBottom: "1px solid #ddd",
  },

  secondaryButton: {
    width: "100%",
    padding: "14px",
    marginTop: "20px",
    borderRadius: "12px",
    border: "1px solid #ddd",
    background: "#fff",
    fontWeight: "700",
  },

  error: {
    marginTop: "20px",
    padding: "15px",
    borderRadius: "12px",
    background: "#fee",
    textAlign: "center",
  },
};