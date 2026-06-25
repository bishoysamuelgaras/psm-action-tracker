exports.handler = async function handler(event) {
  if (event.httpMethod !== "POST") {
    return {
      statusCode: 405,
      body: JSON.stringify({ error: "Method not allowed" })
    }
  }

  try {
    const body = JSON.parse(event.body || "{}")
    const text = typeof body.text === "string" ? body.text.trim() : ""

    if (!text) {
      return {
        statusCode: 400,
        body: JSON.stringify({ error: "Text is required." })
      }
    }

    const apiKey = process.env.GROQ_API_KEY
    const model = process.env.GROQ_REWRITE_MODEL || "llama-3.3-70b-versatile"

    if (!apiKey) {
      return {
        statusCode: 500,
        body: JSON.stringify({ error: "Missing GROQ_API_KEY." })
      }
    }

const systemPrompt = [
  "You are a professional PSM writing assistant.",
  "Rewrite the user's recommendation in clear, concise, professional PSM-style wording.",
  "Preserve the original intent, technical meaning, and action exactly.",
  "Do not add, remove, assume, or invent any facts.",
  "Do not change equipment names, tags, numbers, limits, or technical terms.",
  "Remove colloquial, repetitive, or informal wording.",
  "Improve clarity, grammar, and professionalism only.",
  "Keep the recommendation practical and implementation-focused.",
  "If the input contains one clear action, return one polished sentence only.",
  "If the input contains multiple distinct actions, conditions, or requirements, return short bullet points only.",
  "Keep the output brief without losing meaning.",
  "If the input is Arabic, return Arabic.",
  "If the input is English, return English.",
  "Return only the final rewritten text with no introduction, labels, or explanation."
].join(" ")


    const response = await fetch("https://api.groq.com/openai/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${apiKey}`
      },
      body: JSON.stringify({
        model,
        temperature: 0.2,
        max_tokens: 180,
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: text }
        ]
      })
    })

    const data = await response.json().catch(() => ({}))

    if (!response.ok) {
      return {
        statusCode: response.status,
        body: JSON.stringify({
          error: data?.error?.message || "Groq request failed.",
          provider: "groq"
        })
      }
    }

    const rewrittenText = data?.choices?.[0]?.message?.content?.trim()

    if (!rewrittenText) {
      return {
        statusCode: 422,
        body: JSON.stringify({
          error: "Groq returned an empty rewrite.",
          provider: "groq"
        })
      }
    }

    return {
      statusCode: 200,
      body: JSON.stringify({
        rewrittenText,
        provider: "groq",
        model
      })
    }
  } catch (error) {
    return {
      statusCode: 500,
      body: JSON.stringify({
        error: error instanceof Error ? error.message : "Unexpected error."
      })
    }
  }
}
