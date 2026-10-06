const express = require("express");
const cors = require("cors");
require("dotenv").config();

const OpenAI = require("openai");

const app = express();

app.use(cors());
app.use(express.json());

const ai = new OpenAI({
  apiKey: process.env.OPENROUTER_API_KEY,
  baseURL: "https://openrouter.ai/api/v1",
});

app.get("/", (req, res) => {
  res.json({ message: "Goji AI server is running 🤖" });
});

app.post("/chat", async (req, res) => {
  try {
    const { message } = req.body;

    let response;

for (let attempt = 0; attempt < 2; attempt++) {
  try {
  response = await ai.chat.completions.create({
    model: "openrouter/free",
   
     messages: [
  {
    role: "system",
    content: "You are Goji AI, a helpful personal AI assistant. Your name is Goji. Never identify yourself as Kimi, Moonshot AI, Gemini, OpenRouter, or any other model or provider. Always respond as Goji AI.",
  },
  {
    role: "user",
    content: message,
  },
],
  });

    break;
  } catch (error) {
    const status = error.status;

    if (status !== 429 && status !== 503) {
      throw error;
    }

    if (attempt === 1) {
      throw error;
    }

    await new Promise(resolve => setTimeout(resolve, 45000));
  }
}
    res.json({
  reply: response.choices[0].message.content,
});
  } catch (error) {
    console.error(error);
    res.status(500).json({
    error: "AI request failed",
    });
  }
});

const PORT = process.env.PORT || 3000;

app.listen(PORT, () => {
  console.log(`Goji AI server running on port ${PORT}`);
});