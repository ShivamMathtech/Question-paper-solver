const express = require("express");
const multer = require("multer");
const fs = require("fs");
const path = require("path");
const { openai, default: OpenAI } = require("openai");
const { Document, Packer, Paragraph, TextRun } = require("docx");

const app = express();
const upload = multer({ dest: "uploads/" });

// Serve static files
const op = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});
app.use(express.static(path.join(__dirname, "public")));

// File upload route
app.post("/upload", upload.single("questionFile"), async (req, res) => {
  try {
    const filePath = req.file.path;
    const questions = fs.readFileSync(filePath, "utf-8");

    // Solve the questions using OpenAI
    const solvedQuestions = await solveQuestions(questions);

    // Generate a Word document with solved questions
    const filename = await createWordDoc(solvedQuestions);

    res.json({ filename });
  } catch (error) {
    res.status(500).send("Error processing the file.");
  }
});

// Solve the questions using OpenAI API
async function solveQuestions(questions) {
  const questionLines = questions.split("\n");
  let solvedContent = "";

  for (let question of questionLines) {
    // Assuming the format is: "Q1: [Marks] Question text"
    const match = question.match(/\[(\d+) marks\]/);
    const marks = match ? parseInt(match[1]) : 0;

    if (marks > 0) {
      const prompt = `Solve this question in detail for ${marks} marks: ${question}`;
      const response = await openai.createCompletion({
        model: "text-davinci-003",
        prompt: prompt,
        max_tokens: marks * 30,
      });

      solvedContent += `${question}\nAnswer: ${response.data.choices[0].text.trim()}\n\n`;
    }
  }

  return solvedContent;
}

// Generate Word document with solved questions
async function createWordDoc(content) {
  const doc = new Document();
  doc.addSection({
    children: [
      new Paragraph({
        children: [new TextRun(content)],
      }),
    ],
  });

  const filename = `solved_${Date.now()}.docx`;
  const buffer = await Packer.toBuffer(doc);
  fs.writeFileSync(path.join(__dirname, "downloads", filename), buffer);

  return filename;
}

// Download route for the solved document
app.get("/download/:filename", (req, res) => {
  const filename = req.params.filename;
  res.download(path.join(__dirname, "downloads", filename));
});

// Start the server
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});
