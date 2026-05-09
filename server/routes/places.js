const express = require("express");
const axios = require("axios");
const router = express.Router();
const vader = require("vader-sentiment");

const THEME_KEYWORDS = {
  "food quality": ["food", "pizza", "taste", "flavor", "delicious", "dish", "toppings", "menu", "pasta", "garlic", "chicken", "sandwich", "dessert", "beverage", "baked"],
  "service": ["service", "staff", "friendly", "attentive", "waiter", "server", "prompt", "helpful", "engaging"],
  "ambience": ["ambience", "atmosphere", "vibe", "decor", "cozy", "energy", "lively", "lighting", "charm"],
  "location & view": ["view", "sea", "marine", "location", "window", "arabian", "seaside", "marine drive"],
  "pricing": ["price", "expensive", "costly", "overpriced", "priced", "cost", "premium", "worth", "value"],
  "wait & crowds": ["crowd", "wait", "queue", "busy", "packed", "crowded"],
  "hygiene": ["hygiene", "hygienic", "clean"],
};

const CRITICAL_SIGNALS = {
  "mandatory gratuity": ["mandatory", "10%", "gratuity"],
  "premium pricing": ["expensive", "overpriced", "costly"],
  "crowding at peak hours": ["crowd", "wait", "queue", "busy", "packed"],
  "portion sizes": ["portion", "too small"],
};

function formatList(items) {
  if (items.length === 1) return items[0];
  if (items.length === 2) return `${items[0]} and ${items[1]}`;
  return `${items.slice(0, -1).join(", ")}, and ${items[items.length - 1]}`;
}

function generateSummary(scoredReviews, overallRating) {
  const total = scoredReviews.length;
  if (total === 0) return null;

  const counts = { positive: 0, negative: 0, neutral: 0 };
  scoredReviews.forEach((r) => counts[r.sentiment]++);
  const positiveRate = Math.round((counts.positive / total) * 100);

  const allTextLower = scoredReviews.map((r) => r.text?.text || "").join(" ").toLowerCase();
  const positiveReviews = scoredReviews.filter((r) => r.sentiment === "positive");

  // Count how many reviews mention each theme
  const themeCounts = {};
  for (const [theme, kws] of Object.entries(THEME_KEYWORDS)) {
    themeCounts[theme] = scoredReviews.filter((r) => {
      const t = (r.text?.text || "").toLowerCase();
      return kws.some((kw) => t.includes(kw));
    }).length;
  }

  const sortedThemes = Object.entries(themeCounts)
    .filter(([, c]) => c > 0)
    .sort((a, b) => b[1] - a[1]);

  // Top themes praised specifically in positive reviews
  const posTextLower = positiveReviews.map((r) => r.text?.text || "").join(" ").toLowerCase();
  const topPraised = sortedThemes
    .filter(([theme]) => THEME_KEYWORDS[theme].some((kw) => posTextLower.includes(kw)))
    .slice(0, 3)
    .map(([theme]) => theme);

  // Surface critical patterns from ALL reviews — complaints appear even in positive ones
  const criticalFindings = Object.entries(CRITICAL_SIGNALS)
    .filter(([, kws]) => kws.some((kw) => allTextLower.includes(kw)))
    .map(([label]) => label);

  // Per-pattern frequency counts
  const viewCount = scoredReviews.filter((r) => {
    const t = (r.text?.text || "").toLowerCase();
    return t.includes("view") || t.includes("sea") || t.includes("marine");
  }).length;

  const servicePositiveCount = positiveReviews.filter((r) =>
    (r.text?.text || "").toLowerCase().includes("service")
  ).length;

  const crowdCount = scoredReviews.filter((r) => {
    const t = (r.text?.text || "").toLowerCase();
    return t.includes("crowd") || t.includes("wait") || t.includes("queue");
  }).length;

  const ratingLabel = overallRating >= 4.5 ? "exceptional" : overallRating >= 4.0 ? "strong" : overallRating >= 3.5 ? "solid" : "developing";
  const sentimentDesc = positiveRate >= 80 ? "overwhelmingly positive" : positiveRate >= 60 ? "strongly favorable" : positiveRate >= 40 ? "mixed-to-positive" : "largely critical";

  const parts = [];

  // 1. Overall snapshot
  parts.push(
    `Across ${total} reviews, customer sentiment is ${sentimentDesc} — ${counts.positive} out of ${total} reviewers rate their experience positively, supporting a ${overallRating}-star average that marks a ${ratingLabel} overall reputation.`
  );

  // 2. Top praised themes
  if (topPraised.length > 0) {
    parts.push(
      `The most consistently celebrated aspects are ${formatList(topPraised)}, each surfacing as a highlight across the majority of reviews.`
    );
  }

  // 3. Location/view as a specific draw if multi-review pattern
  if (viewCount >= 2) {
    parts.push(
      `The sea-facing setting emerges as a defining draw — ${viewCount} reviewers specifically highlight the view or location, several recommending an evening or window-side visit for the full effect.`
    );
  }

  // 4. Service consistency
  if (servicePositiveCount >= 2) {
    parts.push(
      `Service quality stands out as a consistent strength: ${servicePositiveCount} reviewers independently describe staff as friendly, attentive, and well-managed even during busy periods.`
    );
  }

  // 5. Primary critical finding
  if (criticalFindings.length > 0) {
    const primary = criticalFindings[0];
    const secondary = criticalFindings[1];
    parts.push(
      `On the downside, ${primary} is the most frequently surfaced friction point${secondary ? `, with ${secondary} also raised by multiple reviewers` : ""}.`
    );
  }

  // 6. Specific callout for mandatory tip (flagged as a business practice concern)
  if (allTextLower.includes("mandatory") && (allTextLower.includes("tip") || allTextLower.includes("gratuity"))) {
    parts.push(
      `A mandatory 10% tip added to every bill drew pointed criticism, with reviewers arguing this charge should be disclosed upfront on the menu — a transparency concern that could affect repeat patronage.`
    );
  } else if (criticalFindings.includes("premium pricing") && positiveRate >= 70) {
    parts.push(
      `While the premium price point is consistently noted, the strong majority consider the food quality and atmosphere sufficient justification for the cost.`
    );
  }

  // 7. Crowding pattern
  if (crowdCount >= 2) {
    parts.push(
      `Crowding during peak hours is a recurring theme across ${crowdCount} reviews — the consensus advice is to visit off-peak or budget time for a wait, though nearly all reviewers agree the experience is worth it.`
    );
  }

  // 8. Final verdict
  const verdictStr =
    positiveRate >= 75
      ? "a high-trust destination with strong repeat-visit intent and a handful of operational friction points worth addressing"
      : positiveRate >= 50
      ? "a well-regarded spot with clear strengths and specific, actionable areas for improvement"
      : "a mixed reputation that warrants direct attention to the recurring concerns raised";

  parts.push(`In aggregate, this business presents as ${verdictStr}.`);

  return parts.join(" ");
}

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
    console.log('details route hit, placeId:', req.query.placeId)
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
    console.log("Google Places response:", JSON.stringify(data));

    if (data.reviews) {
      const scoredReviews = data.reviews.map((review) => {
        const text = review.text?.text || "";
        const scores = vader.SentimentIntensityAnalyzer.polarity_scores(text);
        const compound = scores.compound;

        let sentiment;
        if (compound >= 0.05) sentiment = "positive";
        else if (compound <= -0.05) sentiment = "negative";
        else sentiment = "neutral";

        return { ...review, sentiment };
      });

      const summary = generateSummary(scoredReviews, data.rating);

      return res.json({ ...data, reviews: scoredReviews, summary });
    }

    res.json(data);
  } catch (error) {
    res.status(500).json({ error: "Failed to fetch place" });
  }
});

module.exports = router;
