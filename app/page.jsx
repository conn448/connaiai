"use client";

import { useState } from "react";

export default function Home() {
  const [goal, setGoal] = useState("lose");
  const [weight, setWeight] = useState(75);
  const [goalWeight, setGoalWeight] = useState(70);
  const [height, setHeight] = useState(180);

  return (
    <main
      style={{
        minHeight: "100vh",
        background: "#ffffff",
        padding: "40px 24px",
        display: "flex",
        justifyContent: "center",
        alignItems: "center",
        fontFamily: "Arial, sans-serif",
      }}
    >
      <div style={{ width: "100%", maxWidth: "420px" }}>

        <h1
          style={{
            fontSize: "36px",
            textAlign: "center",
            marginBottom: "8px",
          }}
        >
          Let’s get started
        </h1>

        <p
          style={{
            textAlign: "center",
            color: "#777",
            marginBottom: "40px",
          }}
        >
          Set your goal. We’ll do the rest.
        </p>

        <h3>What’s your goal?</h3>

        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(3, 1fr)",
            gap: "8px",
            marginBottom: "32px",
          }}
        >
          {[
            ["lose", "Lose"],
            ["maintain", "Maintain"],
            ["gain", "Gain"],
          ].map(([value, label]) => (
            <button
              key={value}
              onClick={() => setGoal(value)}
              style={{
                padding: "14px 5px",
                borderRadius: "12px",
                border: "1px solid #ddd",
                background: goal === value ? "#000" : "#fff",
                color: goal === value ? "#fff" : "#000",
                fontWeight: "600",
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
          onClick={() => alert("Setup complete")}
          style={{
            width: "100%",
            padding: "17px",
            marginTop: "10px",
            borderRadius: "14px",
            border: "none",
            background: "#000",
            color: "#fff",
            fontSize: "18px",
            fontWeight: "700",
          }}
        >
          Start
        </button>

      </div>
    </main>
  );
}

function Slider({ title, value, min, max, unit, setValue }) {
  return (
    <div style={{ marginBottom: "28px" }}>
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          marginBottom: "8px",
        }}
      >
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
        onChange={(e) => setValue(Number(e.target.value))}
        style={{ width: "100%" }}
      />
    </div>
  );
}