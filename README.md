# TubeSleuth

Short-video pipeline on the OpenAI Assistants API: a scriptwriter, an architect that maps the voiced script to timed shots, and a photographer that writes image prompts, around text to speech, Whisper timestamps, image generation, a Remotion render with word-by-word captions and mood-matched music, and YouTube API upload.

Run as a growth experiment from December 2023 to January 2024: 205 Shorts in 34 days at under $1 each, 145K views and 1,000 subscribers from the Shorts feed, then stopped.

## How it runs

`npm run create` opens a menu to create scripts, create videos or upload videos for a batch of ideas from a Notion database.

1. Scripts: the scriptwriter assistant (instructions in `src/config/`) writes each script.
2. Voiceover: `src/agents/1-voiceover.js`
3. Timestamps: `src/agents/2-scribe.js`
4. Images: the architect and photographer assistants plan the shots and prompts; `src/agents/3-painter.js` generates them.
5. Render: `src/agents/4-stitcher.js` and `src/remotion/`
6. Upload: `src/agents/5-uploader.js` (YouTube Data API)

## Notes

- Archived. Not maintained.
- No credentials are included. Bring your own API keys and Google OAuth client; `.gitignore` keeps them out of the repo.
- The commit history between December 15, 2023 and the final version is not included.
