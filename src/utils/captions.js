import { client } from "./assembly_ai.js";

export async function generateCaptions({ voiceoverUrl }) {
  const config = {
    audio: voiceoverUrl,
  };

  try {
    const captions = await client.transcripts.transcribe(config);
    const { words } = captions;

    return words;
  } catch (error) {
    console.error("Error in audio caption:", error);
  }
}

export default generateCaptions;
