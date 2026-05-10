const express = require("express")
const axios = require("axios")
const router = express.Router()
const vader = require("vader-sentiment")

const summaryCache = new Map()

router.get("/search", async (req, res) => {
  const input = req.query.input;

  if (!input) {
    return res.status(400).json({ error: "Input is required" });
  }

  try {
    const response = await axios.post(
      "https://places.googleapis.com/v1/places:autocomplete",
      { input: input },
      {
        headers: {
          "Content-Type": "application/json",
          "X-Goog-Api-Key": process.env.GOOGLE_PLACES_KEY,
        },
      },
    );
    res.json(response.data);
  } catch (error) {
    res.status(500).json({ error: "Failed to fetch places" });
  }
});

router.get("/details", async (req, res) => {
  const placeId = req.query.placeId;

  if (!placeId) {
    return res.status(400).json({ error: "Place ID is required" });
  }

  try {
    const response = await axios.get(
      `https://places.googleapis.com/v1/places/${placeId}`,
      {
        headers: {
          "Content-Type": "application/json",
          "X-Goog-Api-Key": process.env.GOOGLE_PLACES_KEY,
          "X-Goog-FieldMask":
            "displayName,rating,reviews,formattedAddress,nationalPhoneNumber",
        },
      },
    );

    const data = response.data;

    if (data.reviews) {
      const scoredReviews = data.reviews.map((review) => {
        const text = review.text?.text || "";
        const scores = vader.SentimentIntensityAnalyzer.polarity_scores(text);
        const compound = scores.compound;

        let sentiment;
        if (compound >= 0.05) sentiment = "positive";
        else if (compound <= -0.05) sentiment = "negative";
        else sentiment = "neutral";

        return { ...review, sentiment, compound };
      });

      const sentimentScore = scoredReviews.reduce((sum, r) => sum + r.compound, 0) / scoredReviews.length;

      let summary = summaryCache.get(placeId) || null
      if (!summary) {
        try {
          const reviewTexts = scoredReviews
            .map((r, i) => `Review ${i + 1}: ${r.text?.text || ""}`)
            .join("\n")

          const result = await axios.post(
            "https://api.groq.com/openai/v1/chat/completions",
            {
              model: "llama-3.1-8b-instant",
              messages: [
                {
                  role: "user",
                  content: `You are a review analyst for small businesses. Analyze these customer reviews and write 2-3 sentences highlighting: the main things customers praise, any recurring complaints, and an overall sentiment verdict. Be specific. Write in plain prose only — no bullet points, no bold, no markdown, no asterisks, no headers.\n\nReviews:\n${reviewTexts}`
                }
              ],
              max_tokens: 300
            },
            {
              headers: {
                Authorization: `Bearer ${process.env.GROQ_API_KEY}`,
                "Content-Type": "application/json"
              }
            }
          )
          summary = result.data.choices[0].message.content
          summaryCache.set(placeId, summary)
        } catch (err) {
          console.error("Groq summary failed:", err.message)
          summary = null
        }
      }

      return res.json({ ...data, reviews: scoredReviews, summary, sentimentScore })
    }

    res.json(data);
  } catch (error) {
    res.status(500).json({ error: "Failed to fetch place" });
  }
});

module.exports = router;
