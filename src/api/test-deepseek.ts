import { deepseek } from "@/lib/deepseek";

export default async function handler(req: Request) {
  try {
    // Make a simple test request to the DeepSeek API
    const response = await deepseek.chat.completions.create({
      model: "deepseek-chat",
      messages: [
        { role: "system", content: "You are a helpful assistant." },
        {
          role: "user",
          content:
            "Hello, this is a test message to verify the API connection.",
        },
      ],
    });

    // Check if the response contains the expected structure
    if (response && response.choices && response.choices.length > 0) {
      return new Response(JSON.stringify({ success: true }), {
        status: 200,
        headers: { "Content-Type": "application/json" },
      });
    } else {
      throw new Error("Invalid response format from DeepSeek API");
    }
  } catch (error) {
    console.error("Error testing DeepSeek API:", error);
    return new Response(
      JSON.stringify({
        success: false,
        error:
          error instanceof Error ? error.message : "Unknown error occurred",
      }),
      {
        status: 500,
        headers: { "Content-Type": "application/json" },
      },
    );
  }
}
