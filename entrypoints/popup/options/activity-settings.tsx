import type { FC } from 'react';

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

import { convexApi } from '@/utils/convex-api';
import { accountMutation, accountQuery } from '@/utils/convex-client';

import SwitchOption from '../_base/switch-option';

const QUERY_KEY = ['activity-settings'];

interface Props {
  grouped?: boolean;
}

/** Kept in the account, so it holds on every device the user signs in on. */
const ActivitySettings: FC<Props> = ({ grouped }) => {
  const queryClient = useQueryClient();
  const { data } = useQuery({
    queryKey: QUERY_KEY,
    queryFn: () => accountQuery(convexApi.activity.settings, {}),
  });
  const { mutate } = useMutation({
    mutationFn: (shareActivity: boolean) =>
      accountMutation(convexApi.activity.setSharing, { shareActivity }),
    onMutate: (shareActivity) =>
      queryClient.setQueryData(QUERY_KEY, { shareActivity }),
    onSettled: () => queryClient.invalidateQueries({ queryKey: QUERY_KEY }),
  });

  return (
    <SwitchOption
      grouped={grouped}
      checked={data?.shareActivity ?? false}
      label="Ділитися активністю"
      description="Друзі, з якими ви взаємно підписані, бачать, що ви дивитеся у програвачі"
      onClick={() => {
        if (data) mutate(!data.shareActivity);
      }}
    />
  );
};

export default ActivitySettings;
