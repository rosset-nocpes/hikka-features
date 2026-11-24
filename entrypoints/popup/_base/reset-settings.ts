/**
 * Sets every feature back to its defaults, except developer options and what
 * the user has made rather than switched: favourite teams, the team priority
 * (which the account keeps as well) and where the friends' activity block
 * was put on the homepage (it shows there again, though).
 */
export const resetPreferences = () => {
  const { features } = useSettings.getState();
  const defaults = useSettings.getInitialState().features;
  const { favoriteTeams, teamPriority, teamPriorityTranslation } =
    features.player;
  useSettings.setState({
    features: {
      ...defaults,
      player: {
        ...defaults.player,
        favoriteTeams,
        teamPriority,
        teamPriorityTranslation,
      },
      friendsActivity: {
        ...features.friendsActivity,
        hidden: defaults.friendsActivity.hidden,
      },
      devOptions: features.devOptions,
    },
  });
};

/**
 * Resets every feature's settings, except developer options. The team
 * priority syncs as if for the first time, which keeps the account's order
 * rather than pushing the empty default over it.
 */
export const resetSettings = () => {
  const { features } = useSettings.getState();
  useSettings.setState({
    teamPrioritySyncedAt: 0,
    features: {
      ...useSettings.getInitialState().features,
      devOptions: features.devOptions,
    },
  });
};
