import OpenAI from "openai";

const openai = new OpenAI({
  apiKey: import.meta.env.VITE_OPENAI_API_KEY,
});

export async function POST(request: Request) {
  try {
    const { audioUrl } = await request.json();

    // Download the audio file
    const audioResponse = await fetch(audioUrl);
    const audioBlob = await audioResponse.blob();

    // Convert blob to file
    const file = new File([audioBlob], "audio.webm", { type: "audio/webm" });

    // Transcribe using Whisper API
    const transcription = await openai.audio.transcriptions.create({
      file,
      model: "whisper-1",
    });

    return new Response(JSON.stringify({ text: transcription.text }));
  } catch (error) {
    console.error("Transcription error:", error);
    return new Response(
      JSON.stringify({ error: "Failed to transcribe audio" }),
      { status: 500 },
    );
  }
}
