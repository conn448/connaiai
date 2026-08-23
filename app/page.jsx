"use client";

import { useState } from "react";

export default function Home() {
  const [started, setStarted] = useState(false);

  const [goal, setGoal] = useState("lose");
  const [weight, setWeight] = useState(75);
  const [goalWeight, setGoalWeight] = useState(70);
  const [height, setHeight] = useState(180);

  const [food, setFood] = useState("");
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);

  // -------------------------
  // SETUP SCREEN
  // -------------------------

  if (!started) {
    return (
      <main style={styles.page}>
        <div style={styles.container}>

          <h1 style={styles.title}>
            Let’s get started
          </h1>

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
  // SCANNER SCREEN
  // -------------------------

  async function analyseFood() {
    if (!food.trim()) return;

    setLoading(true);
    setResult(null);

    try {
      const response = await fetch("/api", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          food,
          goal,
          weight,
          goalWeight,
          height,
        }),
      });

      const data = await response.json();

      setResult(data);
    } catch (error) {
      console.error(error);
      setResult({
        error: "Something went wrong. Try again.",
      });
    }

    setLoading(false);
  }

  return (
    <main style={styles.page}>
      <div style={styles.container}>

        <h1 style={styles.title}>
          What did you eat?
        </h1>

        <p style={styles.subtitle}>
          Tell us what you ate and we’ll calculate it.
        </p>

        <textarea
          value={food}
          onChange={(e) => setFood(e.target.value)}
          placeholder="e.g. chicken sandwich and a banana"
          style={styles.textarea}
        />

        <button
          onClick={analyseFood}
          disabled={loading}
          style={styles.startButton}
        >
          {loading ? "Calculating..." : "Calculate"}
        </button>

        {result && (
          <div style={styles.result}>
            {result.error ? (
              <p>{result.error}</p>
            ) : (
              <>
                <h2>Nutrition</h2>

                <p>
                  Calories:{" "}
                  <strong>
                    {result.calories ?? "—"}
                  </strong>
                </p>

                <p>
                  Protein:{" "}
                  <strong>
                    {result.protein ?? "—"}g
                  </strong>
                </p>

                <p>
                  Carbs:{" "}
                  <strong>
                    {result.carbs ?? "—"}g
                  </strong>
                </p>

                <p>
                  Fat:{" "}
                  <strong>
                    {result.fat ?? "—"}g
                  </strong>
                </p>
              </>
            )}
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
    marginTop: "10px",
    borderRadius: "14px",
    border: "none",
    background: "#000",
    color: "#fff",
    fontSize: "18px",
    fontWeight: "700",
    cursor: "pointer",
  },

  textarea: {
    width: "100%",
    minHeight: "120px",
    padding: "16px",
    borderRadius: "14px",
    border: "1px solid #ddd",
    fontSize: "16px",
    boxSizing: "border-box",
    resize: "none",
  },

  result: {
    marginTop: "25px",
    padding: "20px",
    borderRadius: "16px",
    background: "#f5f5f5",
  },
};