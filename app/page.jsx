"use client";

import { useState } from "react";

export default function Home() {
  const [image, setImage] = useState(null);
  const [preview, setPreview] = useState("");
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  function handlePhoto(e) {
    const file = e.target.files?.[0];
    if (!file) return;

    setImage(file);
    setPreview(URL.createObjectURL(file));
    setResult(null);
    setError("");
  }

  async function analyse() {
    if (!image) return;

    setLoading(true);
    setError("");

    try {
      const form = new FormData();
      form.append("image", image);

      const response = await fetch("/api/analyze", {
        method: "POST",
        body: form
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Something went wrong");
      }

      setResult(data);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <main style={styles.page}>
      <div style={styles.container}>

        <div style={styles.header}>
          <strong style={styles.logo}>CONN<span> AI</span></strong>
          <span style={styles.today}>TODAY</span>
        </div>

        {!result ? (
          <section style={styles.hero}>

            <div style={styles.eyebrow}>AI NUTRITION</div>

            <h1 style={styles.title}>
              Know what<br />
              you’re eating.
            </h1>

            <p style={styles.subtitle}>
              Take a photo. Get your nutrition in seconds.
            </p>

            {preview && (
              <img
                src={preview}
                alt="Food"
                style={styles.preview}
              />
            )}

            {!preview && (
              <label style={styles.button}>
                📷 &nbsp; Scan my food
                <input
                  type="file"
                  accept="image/*"
                  capture="environment"
                  onChange={handlePhoto}
                  hidden
                />
              </label>
            )}

            {preview && !loading && (
              <button
                onClick={analyse}
                style={styles.button}
              >
                Analyse my food
              </button>
            )}

            {loading && (
              <div style={styles.loading}>
                Looking at your food…
              </div>
            )}

            {error && (
              <div style={styles.error}>
                {error}
              </div>
            )}

          </section>
        ) : (

          <section style={styles.result}>

            <img
              src={preview}
              alt="Your meal"
              style={styles.resultImage}
            />

            <div style={styles.eyebrow}>
              YOUR MEAL
            </div>

            <h2 style={styles.mealName}>
              {result.meal_name}
            </h2>

            <div style={styles.calories}>
              {Math.round(result.calories)}
              <span> kcal</span>
            </div>

            <div style={styles.macros}>

              <Macro
                value={result.protein_g}
                label="PROTEIN"
              />

              <Macro
                value={result.carbs_g}
                label="CARBS"
              />

              <Macro
                value={result.fat_g}
                label="FAT"
              />

            </div>

            <div style={styles.items}>
              {result.items?.map((item, index) => (
                <div
                  key={index}
                  style={styles.item}
                >
                  <span>{item.name}</span>
                  <strong>{Math.round(item.calories)} kcal</strong>
                </div>
              ))}
            </div>

            <button style={styles.button}>
              + &nbsp; Log meal
            </button>

            <div style={styles.future}>

              <div style={styles.futureTitle}>
                COMING NEXT
              </div>

              <div style={styles.futureOption}>
                🍽️ &nbsp; What should I eat next?
              </div>

              <div style={styles.futureOption}>
                🛒 &nbsp; Build my shopping list
              </div>

              <div style={styles.futureOption}>
                🎯 &nbsp; Help me hit my goal
              </div>

            </div>

          </section>

        )}

      </div>
    </main>
  );
}

function Macro({ value, label }) {
  return (
    <div style={styles.macro}>
      <strong>{Math.round(value)}g</strong>
      <span>{label}</span>
    </div>
  );
}

const styles = {
  page: {
    minHeight: "100vh",
    background: "#f6f6f3",
    color: "#111",
    fontFamily:
      "-apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif"
  },

  container: {
    maxWidth: "520px",
    margin: "0 auto",
    padding: "22px 20px 50px"
  },

  header: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center"
  },

  logo: {
    fontSize: "20px",
    letterSpacing: "-1px"
  },

  today: {
    fontSize: "10px",
    letterSpacing: "2px",
    color: "#888",
    fontWeight: "700"
  },

  hero: {
    paddingTop: "75px"
  },

  eyebrow: {
    fontSize: "10px",
    letterSpacing: "2px",
    color: "#888",
    fontWeight: "800",
    marginBottom: "15px"
  },

  title: {
    fontSize: "50px",
    lineHeight: "0.95",
    letterSpacing: "-3px",
    margin: "0 0 20px"
  },

  subtitle: {
    fontSize: "18px",
    lineHeight: "1.4",
    color: "#666",
    marginBottom: "32px"
  },

  preview: {
    width: "100%",
    aspectRatio: "1",
    objectFit: "cover",
    borderRadius: "24px",
    marginBottom: "16px"
  },

  button: {
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    width: "100%",
    minHeight: "60px",
    border: "none",
    borderRadius: "18px",
    background: "#111",
    color: "white",
    fontSize: "16px",
    fontWeight: "800",
    cursor: "pointer"
  },

  loading: {
    textAlign: "center",
    marginTop: "20px",
    color: "#666",
    fontWeight: "600"
  },

  error: {
    marginTop: "15px",
    padding: "14px",
    borderRadius: "14px",
    background: "#ffe8e8",
    color: "#a00000"
  },

  result: {
    paddingTop: "30px"
  },

  resultImage: {
    width: "100%",
    height: "250px",
    objectFit: "cover",
    borderRadius: "24px",
    marginBottom: "30px"
  },

  mealName: {
    fontSize: "32px",
    letterSpacing: "-1.5px",
    margin: "0 0 15px"
  },

  calories: {
    fontSize: "64px",
    fontWeight: "900",
    letterSpacing: "-4px"
  },

  macros: {
    display: "grid",
    gridTemplateColumns: "repeat(3, 1fr)",
    gap: "10px",
    margin: "28px 0"
  },

  macro: {
    background: "white",
    borderRadius: "16px",
    padding: "16px"
  },

  macro: {
    background: "white",
    borderRadius: "16px",
    padding: "16px"
  },

  item: {
    display: "flex",
    justifyContent: "space-between",
    padding: "15px 0",
    borderBottom: "1px solid #ddd",
    fontSize: "14px"
  },

  items: {
    marginBottom: "20px"
  },

  future: {
    marginTop: "35px"
  },

  futureTitle: {
    fontSize: "10px",
    letterSpacing: "1.5px",
    color: "#888",
    fontWeight: "800",
    marginBottom: "10px"
  },

  futureOption: {
    background: "white",
    borderRadius: "14px",
    padding: "16px",
    marginTop: "8px",
    fontWeight: "700"
  }
};