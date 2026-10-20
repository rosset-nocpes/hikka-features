import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

import { convexApi } from '@/utils/convex-api';
import { convex } from '@/utils/convex-client';

import SwitchOption from '../_base/switch-option';

const QUERY_KEY = ['activity-settings'];

/** Kept in the account, so it holds on every device the user signs in on. */
const ActivitySettings = () => {
  const queryClient = useQueryClient();
  const { data } = useQuery({
    queryKey: QUERY_KEY,
    queryFn: () => convex.accountQuery(convexApi.activity.settings, {}),
  });
  const { mutate } = useMutation({
    mutationFn: (shareActivity: boolean) =>
      convex.accountMutation(convexApi.activity.setSharing, { shareActivity }),
    onMutate: (shareActivity) =>
      queryClient.setQueryData(QUERY_KEY, { shareActivity }),
    onSettled: () => queryClient.invalidateQueries({ queryKey: QUERY_KEY }),
  });

  return (
    <SwitchOption
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
