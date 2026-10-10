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
app.use(express.json());

const ai = new OpenAI({
  apiKey: process.env.OPENROUTER_API_KEY,
  baseURL: "https://openrouter.ai/api/v1",
});

app.get("/", (req, res) => {
  res.json({
    message: "Goji AI server is running 🤖",
  });
});

app.post("/upload", upload.single("file"), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({
        error: "No file uploaded",
      });
    }

    console.log("Received file:", req.file);

    // PDF understanding
    if (req.file.mimetype === "application/pdf") {
      const pdfBuffer = fs.readFileSync(req.file.path);

      const parser = new PDFParse({
        data: pdfBuffer,
      });

      const pdfData = await parser.getText();

      await parser.destroy();

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

    // Images for now
    res.json({
      message: "Image uploaded successfully",
      filename: req.file.originalname,
      mimetype: req.file.mimetype,
    });
  } catch (error) {
    console.error("Upload error:", error);

    res.status(500).json({
      error: "File processing failed",
    });
  }
});


app.post("/chat", async (req, res) => {
  try {
    const { message, pdfText, imageBase64, imageMimeType } = req.body;

    console.log("Image received:", !!imageBase64);
    console.log("Image MIME type:", imageMimeType);
    console.log("Image Base64 length:", imageBase64?.length || 0);

    let response;

    for (let attempt = 0; attempt < 2; attempt++) {
      try {
        const userContent = [];

        userContent.push({
          type: "text",
          text: pdfText
            ? `Document content:\n${pdfText}\n\nUser question: ${message}`
            : message,
        });

        if (imageBase64) {
          userContent.push({
            type: "image_url",
            image_url: {
              url: `data:${imageMimeType || "image/jpeg"};base64,${imageBase64}`,
            },
          });
        }

        response = await ai.chat.completions.create({
          model: "openrouter/free",
          messages: [
            {
              role: "system",
              content:
                "You are Goji AI, a helpful personal AI assistant. Your name is Goji. Never identify yourself as another model or provider. If PDF content is provided, use it to answer questions about the document. If the answer isn't in the document, say so honestly. If an image is provided, analyze its actual contents and answer the user's question about it.",
            },
            {
              role: "user",
              content: userContent,
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

        await new Promise((resolve) => setTimeout(resolve, 45000));
      }
    }

    res.json({ reply: response.choices[0].message.content });
  } catch (error) {
    console.error("Chat error:", error);
    res.status(500).json({ error: "AI request failed" });
  }
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

        await new Promise((resolve) =>
          setTimeout(resolve, 45000)
        );
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