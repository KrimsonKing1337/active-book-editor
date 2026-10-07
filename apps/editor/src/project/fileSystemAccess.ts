export type ProjectPermissionState =
  | 'granted'
  | 'denied'
  | 'prompt';

export type ProjectPermissionDescriptor = {
  mode?: 'read' | 'readwrite';
};

export interface ProjectWritableFileStream {
  write(data: string): Promise<void>;
  close(): Promise<void>;
  abort?(): Promise<void>;
}

export interface ProjectFileHandle {
  getFile(): Promise<File>;
  createWritable(): Promise<ProjectWritableFileStream>;
}

export interface ProjectDirectoryHandle {
  readonly name: string;

  getFileHandle(
    name: string,
    options?: { create?: boolean },
  ): Promise<ProjectFileHandle>;

  getDirectoryHandle(
    name: string,
    options?: { create?: boolean },
  ): Promise<ProjectDirectoryHandle>;

  queryPermission?(
    descriptor?: ProjectPermissionDescriptor,
  ): Promise<ProjectPermissionState>;

  requestPermission?(
    descriptor?: ProjectPermissionDescriptor,
  ): Promise<ProjectPermissionState>;
}

export type DirectoryPickerOptions = {
  id?: string;
  mode?: 'read' | 'readwrite';
};

export type DirectoryPickerWindow = Window & {
  showDirectoryPicker(
    options?: DirectoryPickerOptions,
  ): Promise<ProjectDirectoryHandle>;
};
