import { renderVideo } from "../agents/4-stitcher.js";
import { generateCaptions } from "./captions.js";
import cleanFiles from "./cleanFiles.js";
import {
  loadConfig,
  loadEntry,
  readImages,
  readJsonFromNotion,
  uploadJsonToNotionAsFile,
} from "./notionConnector.js";

const firebasePath = `https://firebasestorage.googleapis.com/v0/b/tubesleuth.appspot.com/o/assets`;
const firebaseURL = (id, imageId) =>
  `${firebasePath}%2Fvideo-${id}%2Fvideo-${id}-${imageId}.png?alt=media`;

const video = "7678448e-c1ce-4840-a42c-91d960ecf1c4";
export const imageMap = [
  {
    id: 0,
    start: 0,
    end: 6.36,
    description:
      "Vintage illustration of a mystical figure resembling Hermes Trismegistus amidst ancient symbols",
    effect: "ZoomIn",
    url: firebaseURL(video, 1),
  },
  {
    id: 1,
    start: 6.36,
    end: 13,
    description:
      "Silhouettes whispering in a dark, candlelit corridor with alchemical symbols on the walls",
    effect: "PanLeft",
    url: firebaseURL(video, 2),
  },
  {
    id: 2,
    start: 13,
    end: 18.96,
    description:
      "An array of secret codes and cryptic texts laid out on a table with a flickering lantern",
    effect: "ZoomOut",
    url: firebaseURL(video, 3),
  },
  {
    id: 3,
    start: 18.96,
    end: 27.84,
    description:
      "A seeker at the crossroads of multiple realms, a faint figure of Hermes visible in the sky above",
    effect: "PanUp",
    url: firebaseURL(video, 4),
  },
  {
    id: 4,
    start: 27.84,
    end: 32.72,
    description:
      "Close-up of an ancient scroll being unrolled, revealing astrological charts and alchemical symbols",
    effect: "PanRight",
    url: firebaseURL(video, 5),
  },
  {
    id: 5,
    start: 32.72,
    end: 39.92,
    description:
      "A mysterious hand laying out tarot cards on a stone table, with the Wheel of Fortune card prominent",
    effect: "PanDown",
    url: firebaseURL(video, 6),
  },
  {
    id: 6,
    start: 39.92,
    end: 46.36,
    description:
      "An open book with the emblem of Hermes, surrounded by light rays, suggesting the revelation of secrets",
    effect: "ZoomIn",
    url: firebaseURL(video, 7),
  },
];

const transcription = {
  duration: 45.55,
  language: "english",
  text: "Ever wonder where modern mysticism got its roots? Three words, Hermes, Trismegistus. This ancient figure's teachings, whispered through the corridors of time, echo in today's occult and New Age movements. But what if everything you believed was rooted in secrets, codes hidden in plain sight, leading those who seek to a different reality? Followers of Hermes, the thrice great, seek the truth behind the veil, as above, so below. This knowledge, shrouded in mystery, paved the way for alchemy, astrology, and even the enigmatic tarot. It's time to question what's been told. What if what you've been told is all a lie? Follow to discover the truth, and perhaps you, too, will uncover the secrets of Hermes' legacy.",
  segments: [
    {
      id: 0,
      start: 0,
      end: 3.12,
      text: " Ever wonder where modern mysticism got its roots?",
    },
    {
      id: 1,
      start: 3.12,
      end: 6.36,
      text: " Three words, Hermes, Trismegistus.",
    },
    {
      id: 2,
      start: 6.36,
      end: 8.28,
      text: " This ancient figure's teachings, whispered",
    },
    {
      id: 3,
      start: 8.28,
      end: 11.4,
      text: " through the corridors of time, echo in today's occult",
    },
    {
      id: 4,
      start: 11.4,
      end: 13,
      text: " and New Age movements.",
    },
    {
      id: 5,
      start: 13,
      end: 15.48,
      text: " But what if everything you believed",
    },
    {
      id: 6,
      start: 15.48,
      end: 18.96,
      text: " was rooted in secrets, codes hidden in plain sight,",
    },
    {
      id: 7,
      start: 18.96,
      end: 21.32,
      text: " leading those who seek to a different reality?",
    },
    {
      id: 8,
      start: 21.32,
      end: 23.8,
      text: " Followers of Hermes, the thrice great,",
    },
    {
      id: 9,
      start: 23.8,
      end: 27.84,
      text: " seek the truth behind the veil, as above, so below.",
    },
    {
      id: 10,
      start: 27.84,
      end: 29.84,
      text: " This knowledge, shrouded in mystery,",
    },
    {
      id: 11,
      start: 29.84,
      end: 32.72,
      text: " paved the way for alchemy, astrology, and even",
    },
    {
      id: 12,
      start: 32.72,
      end: 34.76,
      text: " the enigmatic tarot.",
    },
    {
      id: 13,
      start: 34.76,
      end: 37.68,
      text: " It's time to question what's been told.",
    },
    {
      id: 14,
      start: 37.68,
      end: 39.92,
      text: " What if what you've been told is all a lie?",
    },
    {
      id: 15,
      start: 39.92,
      end: 42.88,
      text: " Follow to discover the truth, and perhaps you, too,",
    },
    {
      id: 16,
      start: 42.88,
      end: 46.36,
      text: " will uncover the secrets of Hermes' legacy.",
    },
  ],
};

const script = {
  title: "The Lost Library Beneath the Pyramids",
  description:
    "Dive deep into the sands of time to uncover the hidden library beneath the Pyramids that may hold the world's ancient secrets.",
  script:
    "Have you ever heard the WHISPERS of the wind... speaking of SECRETS buried deep under the Egyptian Pyramids? What if I told you... there's a lost LIBRARY down there—rumored to RIVAL the Library of Alexandria... Imagine scrolls of papyrus, etched with LOST knowledge... awaiting DISCOVERY... beneath the very stones that have boggled minds for MILLENNIA...\n...Could it be true? Or is it just a MYTH? Hold on... What if what you've been told is all a LIE? FOLLOW to uncover the TRUTH... As we peel back the layers of HISTORY, keep asking YOURSELF... What ANCIENT secrets could be hidden in the dark CORNERS of this lost LIBRARY? Now let's circle back to the whispers... Could the WIND have been right?... Join the journey to decipher the untold tales! And remember—sometimes, the greatest stories are buried just BENEATH our feet.",
  tags: [
    "#shorts",
    "#mystery",
    "#ancientsecrets",
    "#egypt",
    "#pyramids",
    "#hiddenlibrary",
    "#lostknowledge",
    "#archaeology",
    "#mythoryth",
    "#secretsofhistory",
  ],
  mood: "mysterious",
};

const text = `Have you ever heard the WHISPER of the wild under a full moon? Imagine you're walking through an ancient forest... your heartbeat SYnchronizing with the thrum of the night... That's when they emerge: the werewolves of Indian-American descent, guardians of a MYSTERIOUS LEGACY that's been passed down through generations...

With eyes gleaming like amber coals, they are the embodiment of two worlds COLLIDING – the spiritual mysticism from the East and the wild lore of the West. But here's a fact that'll send SHIVERS down your spine: historical records suggest these were NOT just tales... some were tribal protectors, revered and feared...

...what if the stories that CHILLED you to the bone were more REALITY than fable? What if what you've been told is all a LIE? This is just the beginning... FOLLOW to discover the TRUTH as we peel back layers of this enigmatic history.`;

const init = async () => {
  try {
    console.log("🎥 Stitching video...", captions);
  } catch (error) {
    console.log(error);
  }
};

init();
