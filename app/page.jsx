"use client";

import { useState } from "react";

export default function Home() {
  const [goal, setGoal] = useState("lose");
  const [weight, setWeight] = useState(78);
  const [goalWeight, setGoalWeight] = useState(70);
  const [height, setHeight] = useState(180);

  const start = () => {
    // For now, just confirm the setup.
    // Later this will take the user into the food scanner.
    console.log({
      goal,
      weight,
      goalWeight,
      height,
    });

    alert("You're all set!");
  };

  return (
    <main className="min-h-screen bg-white flex items-center justify-center px-5">
      <div className="w-full max-w-md">

        <h1 className="text-3xl font-bold text-center mb-2">
          Let's get started
        </h1>

        <p className="text-gray-500 text-center mb-8">
          Set your goal. We'll do the rest.
        </p>

        {/* Goal */}
        <div className="mb-8">
          <h2 className="font-semibold mb-3">What’s your goal?</h2>

          <div className="grid grid-cols-3 gap-2">
            {[
              ["lose", "Lose"],
              ["maintain", "Maintain"],
              ["gain", "Gain"],
            ].map(([value, label]) => (
              <button
                key={value}
                onClick={() => setGoal(value)}
                className={`py-3 rounded-xl border font-medium transition ${
                  goal === value
                    ? "bg-black text-white border-black"
                    : "bg-white text-gray-700 border-gray-200"
                }`}
              >
                {label}
              </button>
            ))}
          </div>
        </div>

        {/* Current weight */}
        <Slider
          label="Current weight"
          value={weight}
          min={40}
          max={150}
          unit="kg"
          onChange={setWeight}
        />

        {/* Goal weight */}
        <Slider
          label="Goal weight"
          value={goalWeight}
          min={40}
          max={150}
          unit="kg"
          onChange={setGoalWeight}
        />

        {/* Height */}
        <Slider
          label="Height"
          value={height}
          min={140}
          max={220}
          unit="cm"
          onChange={setHeight}
        />

        {/* Start */}
        <button
          onClick={start}
          className="w-full bg-black text-white py-4 rounded-2xl font-bold text-lg mt-6"
        >
          Start
        </button>

      </div>
    </main>
  );
}

function Slider({
  label,
  value,
  min,
  max,
  unit,
  onChange,
}: {
  label: string;
  value: number;
  min: number;
  max: number;
  unit: string;
  onChange: (value: number) => void;
}) {
  return (
    <div className="mb-7">
      <div className="flex justify-between items-center mb-2">
        <span className="font-semibold">{label}</span>
        <span className="font-bold text-lg">
          {value} {unit}
        </span>
      </div>

      <input
        type="range"
        min={min}
        max={max}
        value={value}
        onChange={(e) => onChange(Number(e.target.value))}
        className="w-full accent-black"
      />
    </div>
  );
}