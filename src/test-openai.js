import OpenAI from "openai";
import dotenv from "dotenv";
dotenv.config();

const openai = new OpenAI({
  apiKey: process.env.VITE_OPENAI_API_KEY,
});

async function testOpenAI() {
  try {
    const completion = await openai.chat.completions.create({
      messages: [{ role: "user", content: "Say hello" }],
      model: "gpt-3.5-turbo",
    });
    console.log("OpenAI API test successful:", completion.choices[0].message);
    return true;
  } catch (error) {
    console.error("OpenAI API test failed:", error.message);
    return false;
  }
}

testOpenAI();
