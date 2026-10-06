export type BookMark = {
  type: string;
  attrs?: Record<string, unknown>;
};

export type BookNode = {
  type: string;
  text?: string;
  marks?: BookMark[];
  attrs?: {
    level?: number;
    name?: string;
    [key: string]: unknown;
  };
  content?: BookNode[];
};

export type BookDocument = {
  type: string;
  content?: BookNode[];
};
