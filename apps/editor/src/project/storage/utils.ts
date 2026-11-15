import type { ProjectFileHandle } from '../@types/fileSystemAccess';

export const writeProjectFile = async (handle: ProjectFileHandle, content: string | Blob): Promise<void> => {
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
