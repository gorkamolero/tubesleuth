import { Client, Storage } from "node-appwrite"
import { v4 as uuidv4 } from "uuid"
import OpenAI from "openai"
import fs from "fs"
import path from "path"

// Initialize OpenAI client
const openai = new OpenAI()

export default async ({ req, res, log, error }) => {
  // Initialize Appwrite Client
  const client = new Client()
    .setEndpoint("https://cloud.appwrite.io/v1") // Replace with your Appwrite endpoint
    .setProject("6553848ab09a8a1f0930")
    .setKey(
      "26e2aba252d41a0186caac24392804dc71781cd4d82e56619dfa75bea73f95611ab0e5403c084912e31fe3f5f353e8459d745d34783a42c480f77b5595fdcf0d6f01d7b7ce8680fe31e3994f4cb2f765694d0217095aae49458df14ba8e2c0a82298ae241027836a8acacf1483af814f56930a7b983701d0810a2c8d11606241"
    )

  const storage = new Storage(client)

  if (req.method === "POST") {
    try {
      log("Request received")
      // Assuming the script is sent in the request body
      const script = req.payload.script
      log("Script:", script)

      // Perform text-to-speech conversion
      const mp3Response = await openai.audio.speech.create({
        model: "tts-1",
        voice: "onyx",
        input: script,
      })

      // Temporary file to store the MP3
      const tempFile = path.resolve("/tmp/" + uuidv4() + ".mp3")
      const buffer = Buffer.from(await mp3Response.arrayBuffer())
      await fs.promises.writeFile(tempFile, buffer)

      // Create a file in Appwrite storage
      const result = await storage.createFile(
        "gorkagi",
        uuidv4(), // Generating a unique ID for the file
        fs.createReadStream(tempFile)
      )

      console.log("hello")

      // Clean up the temporary file
      fs.unlinkSync(tempFile)

      log("File uploaded:", result.$url)

      // Return the response with file ID or URL, with status
      return res.json({
        status: "success",
        file: result.$id,
        url: result.$url,
      })
    } catch (error) {
      error("Error in text-to-speech conversion or file upload:", error)
      return res.json({ error: error.message })
    }
  }

  // Default response for non-POST requests
  return res.send("Please use POST request with a script.")
}
