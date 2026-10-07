export type ProjectPermissionState =
  | 'granted'
  | 'denied'
  | 'prompt';

export type ProjectPermissionDescriptor = {
  mode?: 'read' | 'readwrite';
};

export type FileHandleOptions = {
  create?: boolean;
};

export interface ProjectWritableFileStream {
  write(data: string): Promise<void>;
  close(): Promise<void>;
  abort?(): Promise<void>;
}

export interface ProjectFileHandle {
  readonly kind: 'file';
  readonly name: string;

  getFile(): Promise<File>;
  createWritable(): Promise<ProjectWritableFileStream>;
}

export type ProjectFileSystemHandle =
  | ProjectFileHandle
  | ProjectDirectoryHandle;

export interface ProjectDirectoryHandle {
  readonly kind: 'directory';
  readonly name: string;

  getFileHandle(name: string, options?: FileHandleOptions): Promise<ProjectFileHandle>;
  getDirectoryHandle(name: string, options?: FileHandleOptions): Promise<ProjectDirectoryHandle>;
  values(): AsyncIterableIterator<ProjectFileSystemHandle>;
  queryPermission?(descriptor?: ProjectPermissionDescriptor): Promise<ProjectPermissionState>;
  requestPermission?(descriptor?: ProjectPermissionDescriptor): Promise<ProjectPermissionState>;
}

export type DirectoryPickerOptions = {
  id?: string;
  mode?: 'read' | 'readwrite';
};

export type DirectoryPickerWindow = Window & {
  showDirectoryPicker(options?: DirectoryPickerOptions): Promise<ProjectDirectoryHandle>;
};
