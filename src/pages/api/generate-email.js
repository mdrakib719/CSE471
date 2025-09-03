import { CohereClientV2 } from "cohere-ai";

const cohere = new CohereClientV2({
  token: "WXLRaDQGGcSLekKzhkd3S653Iwo4PX6LfU3wUeAF",
});

export default async function handler(req, res) {
  if (req.method !== "POST") return res.status(405).end();

  const { prompt } = req.body;
  if (!prompt) return res.status(400).json({ error: "Prompt required" });

  try {
    console.log("Prompt received:", prompt);
    const response = await cohere.chat({
      model: "command-a-03-2025",
      messages: [
        {
          role: "user",
          content: `Write a professional email for this scenario: ${prompt}`,
        },
      ],
    });
    console.log("Cohere response:", response);
    res.status(200).json({
      email:
        response.text ||
        response.generations?.[0]?.text ||
        "No email generated.",
    });
  } catch (e) {
    console.error("Cohere error:", e);
    res.status(500).json({ error: "Failed to generate email" });
  }
}
