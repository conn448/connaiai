SCAN YOUR FOOD TEST
console.log("NEW VERSION 123");
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

    const text = await response.text();

    console.log("STATUS:", response.status);
    console.log("RESPONSE:", text);

    if (!response.ok) {
      setResult({
        error: `API error ${response.status}: ${text}`,
      });
      return;
    }

    const data = JSON.parse(text);

    setResult(data);

  } catch (error) {
    console.error("FETCH ERROR:", error);

    setResult({
      error: `Connection error: ${error.message}`,
    });

  } finally {
    setLoading(false);
  }
}