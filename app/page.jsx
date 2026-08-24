"use client";

import { useEffect, useMemo, useState } from "react";

const initialTargets = { calories: 2000, protein: 120, carbs: 220, fat: 70 };

export default function Home() {
  const [activeTab, setActiveTab] = useState("home");
  const [image, setImage] = useState(null);
  const [preview, setPreview] = useState("");
  const [result, setResult] = useState(null);
  const [meals, setMeals] = useState([]);
  const [targets, setTargets] = useState(initialTargets);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    try {
      setMeals(JSON.parse(localStorage.getItem("conn-meals") || "[]"));
      setTargets(JSON.parse(localStorage.getItem("conn-targets") || JSON.stringify(initialTargets)));
    } catch {}
  }, []);

  useEffect(() => {
    if (meals.length) localStorage.setItem("conn-meals", JSON.stringify(meals));
  }, [meals]);

  const todayMeals = meals.filter((meal) => meal.date === new Date().toISOString().slice(0, 10));
  const totals = todayMeals.reduce((sum, meal) => ({
    calories: sum.calories + Number(meal.calories || 0), protein: sum.protein + Number(meal.protein_g || 0), carbs: sum.carbs + Number(meal.carbs_g || 0), fat: sum.fat + Number(meal.fat_g || 0)
  }), { calories: 0, protein: 0, carbs: 0, fat: 0 });

  function handlePhoto(event) {
    const file = event.target.files?.[0];
    if (!file) return;
    setImage(file); setPreview(URL.createObjectURL(file)); setResult(null); setError("");
    analyse(file);
  }

  async function analyse(file = image) {
    if (!file) return;
    setLoading(true); setError("");
    try {
      const form = new FormData(); form.append("image", file);
      const response = await fetch("/api/analyze", { method: "POST", body: form });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || "I couldn't read that photo.");
      setResult(data);
    } catch (err) { setError(err.message); } finally { setLoading(false); }
  }

  function saveMeal() {
    if (!result) return;
    setMeals((current) => [{ ...result, id: crypto.randomUUID(), date: new Date().toISOString().slice(0, 10), image: preview }, ...current]);
    setResult(null); setImage(null); setPreview(""); setActiveTab("home");
  }

  return <main className="app-shell">
    <header className="topbar"><strong className="wordmark">CONN<span> AI</span></strong><span className="date-label">{new Date().toLocaleDateString("en-US", { weekday: "short", month: "short", day: "numeric" }).toUpperCase()}</span></header>
    {result || loading || error ? <Review image={preview} result={result} loading={loading} error={error} onSave={saveMeal} onRetake={() => { setResult(null); setPreview(""); setImage(null); }} onRetry={() => analyse()} /> : <>
      {activeTab === "home" && <HomeView totals={totals} targets={targets} meals={todayMeals} onPhoto={handlePhoto} />}
      {activeTab === "history" && <History meals={meals} />}
      {activeTab === "progress" && <Progress totals={totals} targets={targets} />}
      {activeTab === "profile" && <Profile targets={targets} setTargets={setTargets} />}
    </>}
    {!result && !loading && !error && <nav className="bottom-nav" aria-label="Main navigation">{[["home", "⌂", "Today"], ["history", "◷", "History"], ["progress", "↗", "Progress"], ["profile", "○", "Profile"]].map(([id, icon, label]) => <button key={id} className={activeTab === id ? "nav-item active" : "nav-item"} onClick={() => setActiveTab(id)}><span>{icon}</span>{label}</button>)}</nav>}
  </main>;
}

function HomeView({ totals, targets, meals, onPhoto }) {
  return <section className="screen home-screen"><div className="intro"><p className="kicker">YOUR FOOD, MADE SIMPLE</p><h1>What did<br />you eat?</h1><p className="lead">Take a photo. I’ll tell you what’s inside.</p></div><label className="photo-cta"><span className="camera-mark">+</span><span><strong>Photo your food</strong><small>Point, tap, done</small></span><input type="file" accept="image/*" capture="environment" onChange={onPhoto} hidden /></label><div className="today-card"><div className="card-heading"><span>Today</span><strong>{Math.round(totals.calories)} <small>/ {targets.calories} kcal</small></strong></div><div className="meter"><i style={{ width: `${Math.min(100, (totals.calories / targets.calories) * 100)}%` }} /></div><div className="mini-stats"><Stat value={`${Math.round(totals.protein)}g`} label="protein" /><Stat value={`${Math.round(totals.carbs)}g`} label="carbs" /><Stat value={`${Math.round(totals.fat)}g`} label="fat" /></div></div><div className="section-title"><h2>Today’s meals</h2><span>{meals.length ? `${meals.length} logged` : "Nothing yet"}</span></div>{meals.length ? meals.slice(0, 3).map((meal) => <MealRow key={meal.id} meal={meal} />) : <p className="empty-copy">Your first meal will appear here.</p>}</section>;
}

function Review({ image, result, loading, error, onSave, onRetake, onRetry }) {
  return <section className="screen review-screen"><button className="back-button" onClick={onRetake}>← Take another photo</button>{image && <img className="meal-photo" src={image} alt="Your uploaded meal" />} {loading && <div className="analysis-state"><div className="loader" /><p><strong>Looking at your food...</strong><span>This usually takes a few seconds.</span></p></div>}{error && <div className="error-box"><strong>I couldn’t read that photo.</strong><span>{error}</span><button onClick={onRetry}>Try again</button></div>}{result && <><div className="result-heading"><p className="kicker">I FOUND THIS</p><h1>{result.meal_name}</h1><p className="confidence">Good estimate · You can edit anything below</p></div><div className="calorie-card"><span>Estimated energy</span><strong>{Math.round(result.calories)} <small>kcal</small></strong><div className="macro-grid"><Stat value={`${Math.round(result.protein_g)}g`} label="protein" /><Stat value={`${Math.round(result.carbs_g)}g`} label="carbs" /><Stat value={`${Math.round(result.fat_g)}g`} label="fat" /></div></div><div className="food-list"><div className="section-title"><h2>In your photo</h2><button>Add food</button></div>{result.items?.map((item, index) => <div className="food-row" key={`${item.name}-${index}`}><span className="food-dot" /><span>{item.name}</span><strong>{Math.round(item.calories)} kcal</strong></div>)}</div><button className="primary-button" onClick={onSave}>Save this meal</button></>}</section>;
}

function History({ meals }) { return <section className="screen"><div className="page-heading"><p className="kicker">YOUR LOG</p><h1>History</h1><p>Every meal you save, all in one place.</p></div>{meals.length ? meals.map((meal) => <MealRow key={meal.id} meal={meal} />) : <div className="empty-panel"><strong>No meals yet</strong><span>Photo your first meal to start your log.</span></div>}</section>; }
function Progress({ totals, targets }) { return <section className="screen"><div className="page-heading"><p className="kicker">YOUR NUMBERS</p><h1>Progress</h1><p>A calm look at today’s nutrition.</p></div><div className="progress-card"><Stat value={`${Math.round(totals.calories)}`} label="calories eaten" /><Stat value={`${Math.max(0, Math.round(targets.calories - totals.calories))}`} label="calories left" /><Stat value={`${Math.round(totals.protein)}g`} label="protein" /></div><div className="goal-list">{[["Calories", totals.calories, targets.calories], ["Protein", totals.protein, targets.protein], ["Carbs", totals.carbs, targets.carbs], ["Fat", totals.fat, targets.fat]].map(([label, value, target]) => <div className="goal" key={label}><div><span>{label}</span><strong>{Math.round(value)} / {target}{label === "Calories" ? " kcal" : "g"}</strong></div><div className="meter"><i style={{ width: `${Math.min(100, value / target * 100)}%` }} /></div></div>)}</div></section>; }
function Profile({ targets, setTargets }) { return <section className="screen"><div className="page-heading"><p className="kicker">YOUR SETTINGS</p><h1>Profile</h1><p>Set simple daily targets. Change them anytime.</p></div><div className="settings-card">{Object.entries(targets).map(([key, value]) => <label key={key}><span>{key.replace("_", " ")}</span><input type="number" value={value} onChange={(e) => { const next = { ...targets, [key]: Number(e.target.value) }; setTargets(next); localStorage.setItem("conn-targets", JSON.stringify(next)); }} /><small>{key === "calories" ? "kcal" : "grams"}</small></label>)}</div></section>; }
function MealRow({ meal }) { return <div className="meal-row">{meal.image ? <img src={meal.image} alt="" /> : <div className="meal-thumb" />}<div><strong>{meal.meal_name}</strong><span>{Math.round(meal.calories)} kcal · {Math.round(meal.protein_g)}g protein</span></div><span className="row-arrow">›</span></div>; }
function Stat({ value, label }) { return <div className="stat"><strong>{value}</strong><span>{label}</span></div>; }
