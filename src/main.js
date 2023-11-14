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
    .setProject(process.env.APPWRITE_FUNCTION_PROJECT_ID)
    .setKey(process.env.APPWRITE_API_KEY)

  const storage = new Storage(client)

  if (req.method === "POST") {
    try {
      // Assuming the script is sent in the request body
      const script = req.payload.script

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
        process.env.APPWRITE_BUCKET_ID,
        uuidv4(), // Generating a unique ID for the file
        fs.createReadStream(tempFile)
      )

      // Clean up the temporary file
      fs.unlinkSync(tempFile)

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
