"use client";

import { useState } from "react";

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

  // -------------------------
  // SETUP
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
                  background:
                    goal === value ? "#000" : "#fff",
                  color:
                    goal === value ? "#fff" : "#000",
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
  // SCANNER
  // -------------------------

  function handleImage(event) {
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

  return (
    <main style={styles.page}>
      <div style={styles.container}>

        <h1 style={styles.title}>What did you eat?</h1>

        <p style={styles.subtitle}>
          Take a photo and we’ll work it out.
        </p>

        <label style={styles.uploadButton}>
          📸 Choose food photo
          <input
            type="file"
            accept="image/*"
            capture="environment"
            onChange={handleImage}
            style={{ display: "none" }}
          />
        </label>

        {preview && (
          <img
            src={preview}
            alt="Food"
            style={styles.preview}
          />
        )}

        {image && !loading && (
          <button
            onClick={analyseFood}
            style={styles.startButton}
          >
            Calculate
          </button>
        )}

        {loading && (
          <p style={styles.loading}>
            Analysing your food...
          </p>
        )}

        {result && !result.error && (
          <div style={styles.result}>

            <h2>{result.meal_name}</h2>

            <div style={styles.bigNumber}>
              {result.calories} kcal
            </div>

            <div style={styles.macros}>

              <div>
                <strong>{result.protein_g}g</strong>
                <span>Protein</span>
              </div>

              <div>
                <strong>{result.carbs_g}g</strong>
                <span>Carbs</span>
              </div>

              <div>
                <strong>{result.fat_g}g</strong>
                <span>Fat</span>
              </div>

            </div>

            <h3>Food</h3>

            {result.items?.map((item, index) => (
              <div
                key={index}
                style={styles.item}
              >
                <span>{item.name}</span>
                <strong>{item.calories} kcal</strong>
              </div>
            ))}

          </div>
        )}

        {result?.error && (
          <p style={styles.error}>
            {result.error}
          </p>
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
    cursor: "pointer",
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
    cursor: "pointer",
  },

  uploadButton: {
    display: "block",
    textAlign: "center",
    padding: "18px",
    borderRadius: "14px",
    border: "1px solid #ddd",
    fontWeight: "700",
    cursor: "pointer",
  },

  preview: {
    width: "100%",
    marginTop: "20px",
    borderRadius: "16px",
    maxHeight: "400px",
    objectFit: "cover",
  },

  loading: {
    textAlign: "center",
    marginTop: "24px",
  },

  result: {
    marginTop: "28px",
    padding: "22px",
    borderRadius: "18px",
    background: "#f5f5f5",
  },

  bigNumber: {
    fontSize: "32px",
    fontWeight: "800",
    margin: "15px 0 25px",
  },

  macros: {
    display: "grid",
    gridTemplateColumns: "repeat(3, 1fr)",
    textAlign: "center",
    marginBottom: "25px",
  },

  item: {
    display: "flex",
    justifyContent: "space-between",
    padding: "10px 0",
    borderBottom: "1px solid #ddd",
  },

  error: {
    marginTop: "20px",
    color: "red",
    textAlign: "center",
  },

};