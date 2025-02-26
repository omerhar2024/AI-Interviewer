const DEEPSEEK_API_KEY = import.meta.env.VITE_DEEPSEEK_API_KEY;

type Message = {
  role: "user" | "assistant" | "system";
  content: string;
};

type CompletionResponse = {
  choices: Array<{
    message: {
      content: string;
    };
  }>;
};

export const deepseek = {
  chat: {
    completions: {
      create: async ({ messages }: { messages: Message[] }) => {
        const response = await fetch(
          "https://api.deepseek.com/v1/chat/completions",
          {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              Authorization: `Bearer ${DEEPSEEK_API_KEY}`,
            },
            body: JSON.stringify({
              model: "deepseek-chat",
              messages,
              max_tokens: 500,
              temperature: 0.7,
              stream: false,
            }),
          },
        );

        if (!response.ok) {
          throw new Error(`DeepSeek API error: ${response.statusText}`);
        }

        const data: CompletionResponse = await response.json();
        return data;
      },
    },
  },
};
