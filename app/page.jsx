"use client";

import { useState } from "react";

export default function Home() {
  const [goal, setGoal] = useState("lose");
  const [weight, setWeight] = useState(75);
  const [goalWeight, setGoalWeight] = useState(70);
  const [height, setHeight] = useState(180);

  return (
    <main className="min-h-screen bg-white px-6 py-10 flex items-center justify-center">
      <div className="w-full max-w-md">

        <h1 className="text-4xl font-bold text-center mb-2">
          Let’s get started
        </h1>

        <p className="text-center text-gray-500 mb-10">
          Set your goal. We’ll do the rest.
        </p>

        {/* GOAL */}
        <div className="mb-8">
          <p className="font-semibold mb-3">What’s your goal?</p>

          <div className="grid grid-cols-3 gap-2">
            <button
              onClick={() => setGoal("lose")}
              className={`p-3 rounded-xl border ${
                goal === "lose"
                  ? "bg-black text-white"
                  : "bg-white text-black"
              }`}
            >
              Lose
            </button>

            <button
              onClick={() => setGoal("maintain")}
              className={`p-3 rounded-xl border ${
                goal === "maintain"
                  ? "bg-black text-white"
                  : "bg-white text-black"
              }`}
            >
              Maintain
            </button>

            <button
              onClick={() => setGoal("gain")}
              className={`p-3 rounded-xl border ${
                goal === "gain"
                  ? "bg-black text-white"
                  : "bg-white text-black"
              }`}
            >
              Gain
            </button>
          </div>
        </div>

        {/* CURRENT WEIGHT */}
        <Slider
          title="Current weight"
          value={weight}
          min={40}
          max={150}
          unit="kg"
          setValue={setWeight}
        />

        {/* GOAL WEIGHT */}
        <Slider
          title="Goal weight"
          value={goalWeight}
          min={40}
          max={150}
          unit="kg"
          setValue={setGoalWeight}
        />

        {/* HEIGHT */}
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
          className="w-full bg-black text-white py-4 rounded-2xl font-bold text-lg mt-8"
        >
          Start
        </button>

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
}: {
  title: string;
  value: number;
  min: number;
  max: number;
  unit: string;
  setValue: (value: number) => void;
}) {
  return (
    <div className="mb-7">
      <div className="flex justify-between mb-2">
        <span className="font-semibold">{title}</span>
        <span className="font-bold">
          {value} {unit}
        </span>
      </div>

      <input
        type="range"
        min={min}
        max={max}
        value={value}
        onChange={(e) => setValue(Number(e.target.value))}
        className="w-full"
      />
    </div>
  );
}