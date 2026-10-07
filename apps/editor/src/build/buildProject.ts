import type {
  ProjectBuildFile,
  ProjectStorage,
} from '@editor/project/@types';

type BuildSessionResponse = {
  ok: true;
  sessionId: string;
};

type BuildCompleteResponse = {
  ok: true;
  outDir: string;
};

const BUILD_ENDPOINT = '/__active-book/build';

const getErrorMessage = async (response: Response): Promise<string> => {
  const body = await response.text();

  if (body) {
    return body;
  }

  return `Build request failed with status ${response.status}`;
};

const createBuildSession = async (): Promise<string> => {
  const response = await fetch(`${BUILD_ENDPOINT}/session`, {
    method: 'POST',
  });

  if (!response.ok) {
    throw new Error(await getErrorMessage(response));
  }

  const result = await response.json() as BuildSessionResponse;

  return result.sessionId;
};

const uploadBuildFile = async (
  sessionId: string,
  buildFile: ProjectBuildFile,
): Promise<void> => {
  const query = new URLSearchParams({
    sessionId,
    path: buildFile.path,
  });

  const response = await fetch(`${BUILD_ENDPOINT}/file?${query}`, {
    method: 'PUT',
    body: buildFile.data,
  });

  if (!response.ok) {
    throw new Error(await getErrorMessage(response));
  }
};

const completeBuildSession = async (
  sessionId: string,
): Promise<BuildCompleteResponse> => {
  const query = new URLSearchParams({
    sessionId,
  });

  const response = await fetch(`${BUILD_ENDPOINT}/complete?${query}`, {
    method: 'POST',
  });

  if (!response.ok) {
    throw new Error(await getErrorMessage(response));
  }

  return response.json() as Promise<BuildCompleteResponse>;
};

const discardBuildSession = async (
  sessionId: string,
): Promise<void> => {
  const query = new URLSearchParams({
    sessionId,
  });

  try {
    await fetch(`${BUILD_ENDPOINT}/session?${query}`, {
      method: 'DELETE',
    });
  } catch (error) {
    console.warn('[book-builder] Could not discard build session.', error);
  }
};

export const buildProject = async (
  storage: ProjectStorage,
): Promise<BuildCompleteResponse> => {
  const sessionId = await createBuildSession();

  try {
    for await (const buildFile of storage.getBuildFiles()) {
      await uploadBuildFile(sessionId, buildFile);
    }

    return await completeBuildSession(sessionId);
  } catch (error) {
    await discardBuildSession(sessionId);

    throw error;
  }
};
