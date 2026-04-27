const fs = require("node:fs/promises");
const path = require("node:path");
const { AppError } = require("./appError");

const writeQueues = new Map();

const ensureDirectoryForFile = async (filePath) => 
{
  await fs.mkdir(path.dirname(filePath), { recursive: true });
};

const withWriteLock = async (filePath, operation) => 
{
  const previous = writeQueues.get(filePath) || Promise.resolve();
  const next = previous.then(operation, operation);
  writeQueues.set(filePath, next.catch(() => {}));
  return next;
};

const readJsonFile = async (filePath, fallbackFactory) => 
{
  await ensureDirectoryForFile(filePath);

  try 
  {
    const content = await fs.readFile(filePath, "utf8");
    if (!content.trim()) 
    {
      const fallback = fallbackFactory();
      await writeJsonFile(filePath, fallback);
      return fallback;
    }

    return JSON.parse(content);
  } 
  catch (error) 
  {
    if (error.code === "ENOENT") 
    {
      const fallback = fallbackFactory();
      await writeJsonFile(filePath, fallback);
      return fallback;
    }

    if (error.name === "SyntaxError") 
    {
      throw new AppError("Data file is corrupted and could not be parsed.", 500);
    }

    throw new AppError("Failed to read data file.", 500);
  }
};

const writeJsonFile = async (filePath, payload) => 
{
  await ensureDirectoryForFile(filePath);

  return withWriteLock(filePath, async () => 
  {
    const tempFilePath = `${filePath}.tmp`;
    const data = `${JSON.stringify(payload, null, 2)}\n`;

    try 
    {
      await fs.writeFile(tempFilePath, data, "utf8");
      await fs.rename(tempFilePath, filePath);
    } 
    catch (error) 
    {
      throw new AppError("Failed to write data file.", 500);
    }
  });
};

module.exports = { readJsonFile, writeJsonFile, };
