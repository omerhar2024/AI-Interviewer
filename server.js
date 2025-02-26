const express = require("express");
const OpenAI = require("openai");
const cors = require("cors");
require("dotenv").config();

const app = express();

// Configure CORS to allow requests from your frontend
app.use(
  cors({
    origin: [
      "http://localhost:5173",
      "https://recursing-heisenberg3-mfy7n.dev.tempolabs.ai",
    ],
    methods: ["GET", "POST"],
    credentials: true,
  }),
);

app.use(express.json());

const openai = new OpenAI({
  apiKey: process.env.VITE_OPENAI_API_KEY,
});

app.post("/analyze", async (req, res) => {
  try {
    const { transcript } = req.body;

    if (!transcript) {
      return res.status(400).json({ error: "No transcript provided" });
    }

    const completion = await openai.chat.completions.create({
      model: "gpt-4",
      messages: [
        {
          role: "system",
          content:
            "You are an expert at analyzing behavioral interview responses using the STAR methodology. Analyze the following response and provide a score out of 10 for each component (Situation, Task, Action, Result) and overall feedback.",
        },
        {
          role: "user",
          content: transcript,
        },
      ],
    });

    res.json({ analysis: completion.choices[0].message.content });
  } catch (error) {
    console.error("Analysis error:", error);
    res
      .status(500)
      .json({ error: error.message || "Failed to analyze response" });
  }
});

app.listen(3000, () => {
  console.log("Server running on port 3000");
});
