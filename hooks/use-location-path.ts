import { useSyncExternalStore } from 'react';

import { onHikkaNavigation } from '@/utils/hikka-router';

/** hikka.io's current path, following its in-place navigation. */
const useLocationPath = () =>
  useSyncExternalStore(onHikkaNavigation, () => location.pathname);

export default useLocationPath;
