const express = require("express");
const cors = require("cors");
require("dotenv").config();

const { GoogleGenAI } = require("@google/genai");

const app = express();

app.use(cors());
app.use(express.json());

const ai = new GoogleGenAI({
  apiKey: process.env.GEMINI_API_KEY,
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
    response = await ai.models.generateContent({
      model: "gemini-3.8-flash",
      contents: message,
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
      reply: response.text,
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({
      error: "Gemini request failed",
    });
  }
});

const PORT = process.env.PORT || 3000;

app.listen(PORT, () => {
  console.log(`Goji AI server running on port ${PORT}`);
});