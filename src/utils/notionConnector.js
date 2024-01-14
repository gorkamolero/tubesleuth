// Importing the Notion SDK using ES6 syntax
import { Client } from "@notionhq/client";
import processEnv from "./env.js";
import parseJson from "parse-json";

// Initializing a new Notion client with an integration token using environment variable
const notion = new Client({ auth: processEnv.NOTION_API_SECRET });
const tubesleuth = processEnv.NOTION_PAGE_ID;

const readDatabase = async ({ empty, action, limit, priority = false }) => {
  const emptyFilter = {
    and: [
      ...(action === "createScripts"
        ? [
            {
              property: "script",
              rich_text: {
                is_empty: true,
              },
            },
          ]
        : []),
      ...(action === "createVideos"
        ? [
            {
              property: "script",
              rich_text: {
                is_not_empty: true,
              },
            },
          ]
        : []),
      ...(action == "uploadVideos"
        ? [
            {
              property: "uploaded",
              checkbox: {
                equals: false,
              },
            },
            {
              property: "dontupload",
              checkbox: {
                equals: false,
              },
            },
          ]
        : [
            {
              property: "done",
              checkbox: {
                equals: false,
              },
            },
          ]),
      {
        property: "skip",
        checkbox: {
          equals: false,
        },
      },
      {
        property: "input",
        rich_text: {
          is_not_empty: true,
        },
      },
      {
        property: "channel",
        select: {
          does_not_equal: "TBD",
        },
      },
    ],
  };

  try {
    const filter = empty ? emptyFilter : {};
    // make it descending
    const response = await notion.databases.query({
      database_id: tubesleuth,
      filter,
      sorts: [
        {
          direction: "ascending",
          timestamp: "created_time",
        },
      ],
      ...(limit !== Infinity && { page_size: limit }),
    });
    if (response.length === 0) {
      console.log("❗️ No entries found.");
      return [];
    }

    let results = response.results;

    if (priority) {
      // if there are things with priority true, put them at the front
      const priority = response.results
        .filter((entry) => {
          return entry.properties.priority?.checkbox;
        })
        .reverse();

      const notPriority = response.results
        .filter((entry) => {
          return !entry.properties.priority?.checkbox;
        })
        .reverse();

      results = [...priority, ...notPriority];
    }

    if (action === "createScripts") {
      // sort by refineScript not empty first, and reverse the results in both cases
      results = results.sort((a, b) => {
        return (
          b.properties.refineScript.rich_text.length -
          a.properties.refineScript.rich_text.length
        );
      });

      // if refineScript is empty, keep only the ones where script is empty

      // results = results.filter((entry) => {
      //   if (entry.properties.refineScript.rich_text.length === 0) {
      //     return entry.properties.script.rich_text.length === 0;
      //   }
      // });
    }

    return results;
  } catch (error) {
    console.error(`Error reading database: ${error}`);
    throw error;
  }
};

const loadConfig = async () => {
  const configId = processEnv.NOTION_CONFIG_ID;

  // load all children of the db
  const db = await notion.databases.query({
    database_id: configId,
  });

  const configArray = db.results.map((entry) => {
    const channel = entry.properties.Channel.title[0].plain_text;
    const cta = entry.properties.cta.rich_text.length
      ? entry.properties.cta.rich_text[0].plain_text
      : "";
    const styleInstructions = entry.properties.styleInstructions.rich_text
      .length
      ? entry.properties.styleInstructions.rich_text[0].plain_text
      : "";
    const voiceModel = entry.properties.voiceModel.rich_text.length
      ? entry.properties.voiceModel.rich_text[0].plain_text
      : "";
    const imageStyle = entry.properties.imageStyle.rich_text.length
      ? entry.properties.imageStyle.rich_text[0].plain_text
      : "";

    return {
      channel,
      cta,
      styleInstructions,
      voiceModel,
      imageStyle,
    };
  });
  // convert to object with channel name as key
  const config = configArray.reduce((acc, curr) => {
    acc[curr.channel] = curr;
    return acc;
  }, {});

  return config;
};

const getEntry = async (title) => {
  try {
    const response = await notion.search({
      query: title,
    });
    return response.results[0];
  } catch (error) {
    console.error(`Error getting entry: ${error}`);
    throw error;
  }
};

const createEntry = async (title) => {
  // TODO: fix this
  try {
    const response = await notion.pages.create({
      parent: { database_id: tubesleuth },
      properties: {
        title: {
          title: [
            {
              text: {
                content: title,
              },
            },
          ],
        },
      },
    });
    return response.pageId;
  } catch (error) {
    console.error(`Error creating entry: ${error}`);
    throw error;
  }
};

const updateTitle = async ({ id, title }) => {
  try {
    const response = await notion.pages.update({
      page_id: id,
      properties: {
        title: {
          title: [
            {
              text: {
                content: title,
              },
            },
          ],
        },
      },
    });
    return response;
  } catch (error) {
    console.error(`Error updating title: ${error}`);
    throw error;
  }
};

const updateRichText = async ({ id, property, richTextContent }) => {
  try {
    const response = await notion.pages.update({
      page_id: id,
      properties: {
        [property]: {
          rich_text: [
            {
              text: { content: richTextContent },
            },
          ],
        },
      },
    });
    return response;
  } catch (error) {
    console.error(`Error updating Rich Text field: ${error}`);
    throw error;
  }
};

const updateURLField = async ({ id, property, url }) => {
  try {
    const response = await notion.pages.update({
      page_id: id,
      properties: {
        [property]: {
          url,
        },
      },
    });
    return response;
  } catch (error) {
    console.error(`Error updating URL field: ${error}`);
    throw error;
  }
};

const updateTagsField = async ({ id, property = "tags", tags }) => {
  try {
    const response = await notion.pages.update({
      page_id: id,
      properties: {
        [property]: {
          multi_select: tags.map((tag) => ({ name: tag })),
        },
      },
    });
    return response;
  } catch (error) {
    console.error(`Error updating tags field: ${error}`);
    throw error;
  }
};

const updateImageField = async ({ id, property, urls }) => {
  try {
    const response = await notion.pages.update({
      page_id: id,
      properties: {
        [property]: {
          files: urls.map((url) => ({
            type: "external",
            name: "Image",
            external: { url },
          })),
        },
      },
    });
    return response;
  } catch (error) {
    console.error(`Error updating image field: ${error}`);
    throw error;
  }
};

const updateFileField = async ({ id, property, fileUrl }) => {
  try {
    const response = await notion.pages.update({
      page_id: id,
      properties: {
        [property]: {
          files: [
            {
              type: "external",
              name: "voiceover", // Or any descriptive name you prefer
              external: { url: fileUrl },
            },
          ],
        },
      },
    });
    return response;
  } catch (error) {
    console.error(`Error updating file field: ${error}`);
    throw error;
  }
};

const updateCheckboxField = async ({ id, property, checked }) => {
  try {
    const response = await notion.pages.update({
      page_id: id,
      properties: {
        [property]: {
          checkbox: checked,
        },
      },
    });
    return response;
  } catch (error) {
    console.error(`Error updating checkbox field: ${error}`);
    throw error;
  }
};

const getRichTextFieldContent = ({ entry, property }) => {
  if (!entry.properties[property]) {
    return "";
  }
  const richTextArray = entry.properties[property].rich_text;
  // Concatenating all text elements into a single string
  return richTextArray.map((richText) => richText.plain_text).join("");
};

const joinRichText = (richTextArray) => {
  if (!richTextArray.length) {
    return "";
  }
  return richTextArray.map((richText) => richText.plain_text).join("\n");
};

const readProperty = ({ entry, property }) => {
  return entry.properties[property];
};

const readSelect = ({ entry, property }) => {
  return entry.properties[property].select.name;
};

const updateDateField = async ({ id, property, date }) => {
  try {
    const response = await notion.pages.update({
      page_id: id,
      properties: {
        [property]: {
          date: {
            start: date,
          },
        },
      },
    });
    return response;
  } catch (error) {
    console.error(`Error updating date field: ${error}`);
    throw error;
  }
};

const uploadJsonToNotion = async ({ entry, property, json }) => {
  // Convert JSON to string
  const jsonString = JSON.stringify(json, null, 2); // 2 is for pretty print

  // Use updateRichText function to upload JSON string
  const response = await updateRichText({
    id: entry.id,
    property: property,
    richTextContent: jsonString,
  });

  return response;
};

const uploadJsonToNotionAsFile = async ({ entry, property, json }) => {
  // Convert JSON to string
  const jsonString = JSON.stringify(json, null, 2);
  const jsonFile = new File([jsonString], "jsonFile.json", {
    type: "application/json",
  });

  // Use updateRichText function to upload JSON string
  const response = await updateFileField({
    id: entry.id,
    property: property,
    fileUrl: jsonFile,
  });

  return response;
};

const readJsonFromNotion = ({ entry, property }) => {
  const jsonString = getRichTextFieldContent({ entry, property });
  if (!jsonString || jsonString.length === 0) return "";
  const jsonData = parseJson(jsonString);
  return jsonData;
};

const readImages = ({ entry, property }) => {
  if (entry.properties[property] && entry.properties[property].files) {
    return entry.properties[property].files.map((file) => file.external.url);
  }
  return [];
};

const readSingleFile = ({ entry, property }) => {
  const exists = entry.properties[property];
  const files = exists ? entry.properties[property].files : [];
  if (files.length > 0) {
    return entry.properties[property].files[0].external.url;
  }
  return null;
};

const loadEntry = async (pageId) => {
  try {
    const response = await notion.pages.retrieve({ page_id: pageId });
    return response;
  } catch (error) {
    console.error(`Error loading entry: ${error}`);
    throw error;
  }
};

const init = async () => {
  const db = await readDatabase();

  const { id: entryId } = await createEntry();
  const response2 = await updateRichText({
    id: entryId,
    property: "input",
    richTextContent: `testtexto`,
  });
  console.log(response2);
};

// init();

export {
  init,
  readDatabase,
  loadConfig,
  getEntry,
  createEntry,
  updateTitle,
  updateRichText,
  updateTagsField,
  updateImageField,
  updateFileField,
  updateCheckboxField,
  getRichTextFieldContent,
  joinRichText,
  updateURLField,
  readProperty,
  updateDateField,
  uploadJsonToNotion,
  uploadJsonToNotionAsFile,
  readJsonFromNotion,
  loadEntry,
  readImages,
  readSingleFile,
  readSelect,
};
