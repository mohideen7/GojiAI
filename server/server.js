
const express = require("express");
const cors = require("cors");
require("dotenv").config();

const OpenAI = require("openai");
const multer = require("multer");
const { PDFParse } = require("pdf-parse");
const fs = require("fs");

const upload = multer({
  dest: "uploads/",
});

const app = express();

app.use(cors());
app.use(express.json({ limit: "10mb" }));

const ai = new OpenAI({
  apiKey: process.env.OPENROUTER_API_KEY,
  baseURL: "https://openrouter.ai/api/v1",
});

// Primary model and automatic backup.
const MODELS = [
  "google/gemma-4-26b-a4b-it:free",
  "google/gemma-4-31b-it:free",
];

const SYSTEM_PROMPT =
  "You are Goji AI, a helpful personal AI assistant. " +
  "Your name is Goji. Never identify yourself as another model " +
  "or provider. If PDF content is provided, use it to answer " +
  "questions about the document. If the answer isn't in the " +
  "document, say so honestly. If an image is provided, analyze " +
  "its actual contents and answer the user's question about it.";

app.get("/", (req, res) => {
  res.json({
    message: "Goji AI server is running 🤖",
  });
});

// PDF and image upload endpoint.
app.post("/upload", upload.single("file"), async (req, res) => {
  let parser;

  try {
    if (!req.file) {
      return res.status(400).json({
        error: "No file uploaded",
      });
    }

    console.log("Received file:", req.file.originalname);
    console.log("File type:", req.file.mimetype);

    if (req.file.mimetype === "application/pdf") {
      const pdfBuffer = fs.readFileSync(req.file.path);

      parser = new PDFParse({
        data: pdfBuffer,
      });

      const pdfData = await parser.getText();

      console.log(
        "PDF text extracted:",
        pdfData.text.length,
        "characters"
      );

      return res.json({
        message: "PDF understood successfully",
        filename: req.file.originalname,
        mimetype: req.file.mimetype,
        text: pdfData.text,
      });
    }

    return res.json({
      message: "Image uploaded successfully",
      filename: req.file.originalname,
      mimetype: req.file.mimetype,
    });
  } catch (error) {
    console.error("Upload error:", error);

    return res.status(500).json({
      error: "File processing failed",
    });
  } finally {
    if (parser) {
      try {
        await parser.destroy();
      } catch (error) {
        console.error("PDF cleanup error:", error.message);
      }
    }

    if (req.file?.path) {
      fs.promises.unlink(req.file.path).catch((error) => {
        console.error("Temporary file cleanup error:", error.message);
      });
    }
  }
});

// Chat endpoint with automatic model fallback.
app.post("/chat", async (req, res) => {
  try {
    const {
      message,
      pdfText,
      imageBase64,
      imageMimeType,
    } = req.body;

    if (typeof message !== "string" || !message.trim()) {
      return res.status(400).json({
        error: "Please enter a message.",
      });
    }

    console.log("Image received:", !!imageBase64);
    console.log("Image MIME type:", imageMimeType);
    console.log("Image Base64 length:", imageBase64?.length || 0);
    console.log("PDF context received:", !!pdfText);

    const userContent = [
      {
        type: "text",
        text: pdfText
          ? `Document content:\n${pdfText}\n\nUser question: ${message}`
          : message,
      },
    ];

    if (imageBase64) {
      userContent.push({
        type: "image_url",
        image_url: {
          url: `data:${
            imageMimeType || "image/jpeg"
          };base64,${imageBase64}`,
        },
      });
    }

    let response;
    let lastError;

    for (const model of MODELS) {
      try {
        console.log("Trying model:", model);

        response = await ai.chat.completions.create({
          model,
          messages: [
            {
              role: "system",
              content: SYSTEM_PROMPT,
            },
            {
              role: "user",
              content: userContent,
            },
          ],
        });

        const reply = response.choices?.[0]?.message?.content;

        if (typeof reply !== "string" || !reply.trim()) {
          throw new Error("Model returned an empty reply");
        }

        console.log("Model succeeded:", response.model || model);
        console.log("Raw AI reply:", JSON.stringify(reply));

        return res.json({
          reply,
        });
      } catch (error) {
        lastError = error;

        const status = error.status;

        console.error(
          `Model ${model} failed. Status: ${status || "unknown"}`,
          error.message
        );

        // Only switch models for errors that may be temporary
        // or indicate that the requested model is unavailable.
        const canFallback = [
          404,
          408,
          429,
          500,
          502,
          503,
          504,
        ].includes(status);

        if (!canFallback) {
          break;
        }

        console.log("Attempting the next model...");
      }
    }

    console.error(
      "All configured models failed:",
      lastError?.message || "No response"
    );

    // Keep provider-specific errors out of the public response.
    return res.status(503).json({
      error: "Goji couldn't complete that request.",
    });
  } catch (error) {
    console.error("Chat error:", error);

    return res.status(500).json({
      error: "Goji encountered an unexpected error.",
    });
  }
});

const PORT = process.env.PORT || 3000;

app.listen(PORT, () => {
  console.log(`Goji AI server running on port ${PORT}`);
});
