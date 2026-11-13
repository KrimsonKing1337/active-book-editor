// У const-стрелки TypeScript требует явный тип переменной для сужения типов после вызова never.
export function fail(path: string, message: string): never {
  throw new Error(`${path}: ${message}`);
}
