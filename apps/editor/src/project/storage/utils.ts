import type { ProjectFileHandle } from '../@types/fileSystemAccess';

type Content = string | Blob;

export const writeProjectFile = async (handle: ProjectFileHandle, content: Content): Promise<void> => {
  const writable = await handle.createWritable();

  try {
    await writable.write(content);
    await writable.close();
  } catch (error) {
    try {
      await writable.abort?.();
    } catch {
      // Abort is best-effort cleanup and must not replace the original write/close error.
    }

    throw error;
  }
};
