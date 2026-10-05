export const remapTranscript = (transcript) => {
  return {
    duration: transcript.duration,
    language: transcript.language,
    text: transcript.text,
    segments: transcript.segments.map((segment) => ({
      id: segment.id,
      start: segment.start,
      end: segment.end,
      text: segment.text,
    })),
  }
}

export default remapTranscript
