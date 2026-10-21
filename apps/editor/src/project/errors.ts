export class FileSystemAccessUnsupportedError extends Error {
  constructor() {
    super('File System Access API is not supported in this browser.');

    this.name = 'FileSystemAccessUnsupportedError';
  }
}

export class ExistingProjectError extends Error {
  constructor() {
    super('The selected directory already contains book.json.');

    this.name = 'ExistingProjectError';
  }
}

export class InvalidProjectError extends Error {
  constructor(message = 'The selected directory is not a valid Active Book project.') {
    super(message);

    this.name = 'InvalidProjectError';
  }
}

export const isAbortError = (error: unknown): boolean => {
  return error instanceof DOMException && error.name === 'AbortError';
};
