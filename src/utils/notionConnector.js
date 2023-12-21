// Importing the Notion SDK using ES6 syntax
import { Client } from "@notionhq/client";
import processEnv from "./env.js";

// Initializing a new Notion client with an integration token using environment variable
const notion = new Client({ auth: processEnv.NOTION_API_SECRET });
const tubesleuth = processEnv.NOTION_PAGE_ID;

const readDatabase = async ({ empty, id }) => {
  const emptyFilter = {
    and: [
      {
        property: "done",
        checkbox: {
          equals: false,
        },
      },
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
    ],
  };
  try {
    const filter = empty ? emptyFilter : {};
    // make it descending
    const response = await notion.databases.query({
      database_id: tubesleuth,
      filter,
    });
    return response.results.reverse();
  } catch (error) {
    console.error(`Error reading database: ${error}`);
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

const updateRichText = async ({ id, fieldName, richTextContent }) => {
  try {
    const response = await notion.pages.update({
      page_id: id,
      properties: {
        [fieldName]: {
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

const updateURLField = async ({ id, fieldName, url }) => {
  try {
    const response = await notion.pages.update({
      page_id: id,
      properties: {
        [fieldName]: {
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

const updateTagsField = async ({ id, fieldName = "tags", tags }) => {
  try {
    const response = await notion.pages.update({
      page_id: id,
      properties: {
        [fieldName]: {
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

const updateImageField = async ({ id, fieldName, urls }) => {
  try {
    const response = await notion.pages.update({
      page_id: id,
      properties: {
        [fieldName]: {
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

const updateFileField = async ({ id, fieldName, fileUrl }) => {
  try {
    const response = await notion.pages.update({
      page_id: id,
      properties: {
        [fieldName]: {
          files: [
            {
              type: "external",
              name: "Voiceover", // Or any descriptive name you prefer
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

const updateCheckboxField = async ({ id, fieldName, checked }) => {
  try {
    const response = await notion.pages.update({
      page_id: id,
      properties: {
        [fieldName]: {
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

const getRichTextFieldContent = async ({ id, fieldName }) => {
  try {
    const response = await notion.pages.retrieve({ page_id: pageId });

    if (
      response.properties[fieldName] &&
      response.properties[fieldName].rich_text
    ) {
      const richTextArray = response.properties[fieldName].rich_text;
      // Concatenating all text elements into a single string
      return richTextArray.map((richText) => richText.plain_text).join("");
    } else {
      throw new Error(
        `Field "${fieldName}" not found or is not a Rich Text field.`,
      );
    }
  } catch (error) {
    console.error(`Error retrieving Rich Text field content: ${error}`);
    throw error;
  }
};

const joinRichText = (richTextArray) => {
  return richTextArray.map((richText) => richText.plain_text).join("\n");
};

const init = async () => {
  const db = await readDatabase();

  const { id: entryId } = await createEntry();
  const response2 = await updateRichText({
    id: entryId,
    fieldName: "input",
    richTextContent: `testtexto`,
  });
  console.log(response2);
};

const readProperty = ({ entry, property }) => {
  return entry.properties[property];
};

// init();

export {
  init,
  readDatabase,
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
};
