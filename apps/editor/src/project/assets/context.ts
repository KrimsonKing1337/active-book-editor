import { createContext } from 'react';

import type { createProjectAssetUrls } from './utils';

export const ProjectAssetsContext = createContext<ReturnType<typeof createProjectAssetUrls> | null>(null);
