import OpenAI from "openai";

export const openai = new OpenAI({
  apiKey: "sk-dummy-key-for-development",
  dangerouslyAllowBrowser: true,
});
