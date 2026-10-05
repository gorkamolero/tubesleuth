import { AssemblyAI } from "assemblyai";
import processEnv from "./env.js";

const client = new AssemblyAI({
  apiKey: processEnv.ASSEMBLY_AI_API_KEY,
});

export { client };
