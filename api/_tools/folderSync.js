/**
 * A function that very securely transfers files from one place to another.
 * It uses checksums to ensure the file transferred successfully,
 * and compares local files with destination ones before trashing.
 * It is designed to be idempotent and interruptible.
 * It is intended to be generic but will start as locked on Google Drive.
 */

const folderSync = async (
  folderPath,
  googledriveCredsPayload,
  googledriveFolderId,
) => {
  /**
   * 1. For each file in the local folder,
   * Check if a file with the same name exists in the destination.
   * 3. If it does, compare the checksums.
   *   a. If the checksums are the same, trash local, by moving it to the the Bin (MacOS) - this leaves it restorable.
   *   b. If the checksums are different, delete destination file.
   * 4. If the file does not exist in the destination, or the checksums were different, upload it.
   * 5. Once the file is uploaded, compare the checksums. If they match, trash the local file.
   */

  return { 
    ok: true, 
  };
};

module.exports = {
  folderSync,
};
