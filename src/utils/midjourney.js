import { Midjourney } from "midjourney";

async function generateImage(description) {
  const client = new Midjourney({
    ServerId: process.env.SERVER_ID,
    ChannelId: process.env.CHANNEL_ID,
    SalaiToken: process.env.SALAI_TOKEN,
    Debug: true,
    Ws: true,
  });

  await client.init();

  const Imagine = await client.Imagine(description, (uri, progress) => {
    console.log("loading", uri, "progress", progress);
  });

  if (!Imagine) {
    console.log("no message");
    return;
  }

  const V1CustomID = Imagine.options?.find((o) => o.label === "V1")?.custom;
  if (!V1CustomID) {
    console.log("no V1");
    return;
  }

  const Variation = await client.Custom({
    msgId: Imagine.id,
    flags: Imagine.flags,
    customId: V1CustomID,
    content: description,
    loading: (uri, progress) => {
      console.log("loading", uri, "progress", progress);
    },
  });

  return Variation;
}

module.exports = generateImage;
