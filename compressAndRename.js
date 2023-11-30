import fs from "fs";
import heicConvert from "heic-convert";
import path from "path";
import sharp from "sharp";

const sourceFolder = "from_heics";
const destinationFolder = "to_jpeg";

// Function to check if a file is HEIC
function isHeic(filePath) {
  return path.extname(filePath).toLowerCase() === ".heic";
}

// Function to compress and rename HEIC images with reduced file size
async function compressAndRename(
  filePath,
  destinationPath,
  totalFiles,
  currentFile
) {
  return new Promise(async (resolve) => {
    if (isHeic(filePath)) {
      const heicBuffer = fs.readFileSync(filePath);

      try {
        const output = await heicConvert({
          buffer: heicBuffer,
          format: "JPEG",
          quality: 0.6,
        });

        if (output) {
          const fileName = path.parse(filePath).name;
          const destinationFile = path.join(
            destinationPath,
            `${fileName}.jpg`
          );

          await sharp(output).resize({ width: 1050 }).toFile(destinationFile);

          const percentDone = ((currentFile + 1) / totalFiles) * 100;
          console.log(
            `Processed ${
              currentFile + 1
            }/${totalFiles} files (${percentDone.toFixed(2)}% complete)`
          );
        } else {
          console.error("Error converting HEIC to JPEG: Output is undefined");
        }
      } catch (error) {
        console.error(`Error converting HEIC to JPEG: ${error.message}`);
      }
    } else {
      // If the file is not HEIC, copy it directly to the destination
      const destinationFile = path.join(
        destinationPath,
        path.basename(filePath)
      );
      fs.copyFileSync(filePath, destinationFile);
    }

    resolve();
  });
}

// Function to count files in a directory and its subdirectories
function countFiles(directory) {
  let count = 0;
  const files = fs.readdirSync(directory);

  for (const file of files) {
    const filePath = path.join(directory, file);

    if (fs.statSync(filePath).isDirectory()) {
      // Recursively count files in subdirectories
      count += countFiles(filePath);
    } else {
      // Only count regular files
      count++;
    }
  }

  return count;
}

// Function to process files in a directory and its subdirectories
async function processFiles(
  directory,
  destinationDirectory,
  totalFiles,
  currentFile
) {
  const files = fs.readdirSync(directory);

  for (const file of files) {
    const filePath = path.join(directory, file);
    const destinationPath = path.join(destinationDirectory, file);

    if (fs.statSync(filePath).isDirectory()) {
      // Recursively process subdirectories
      fs.mkdirSync(destinationPath, { recursive: true });
      currentFile = await processFiles(
        filePath,
        destinationPath,
        totalFiles,
        currentFile
      );
    } else {
      // Process files (both HEIC and others)
      await compressAndRename(
        filePath,
        destinationDirectory,
        totalFiles,
        currentFile
      );
      currentFile++;
    }
  }

  return currentFile; // Return the updated value for recursive calls
}

// Create destination folder if it doesn't exist
if (!fs.existsSync(destinationFolder)) {
  fs.mkdirSync(destinationFolder);
}

// Count total number of files for progress tracking
const totalFiles = countFiles(sourceFolder);
let currentFile = 0;

console.log("Total files found:", totalFiles);

// Start processing files
processFiles(sourceFolder, destinationFolder, totalFiles, currentFile).then(
  () => {
    console.log("Compression and renaming completed.");
  }
);
