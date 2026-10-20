type TeamEntry = Omit<API.TeamData, 'title'> & {
  episodes: API.EpisodeData[];
};

const toTeam = (title: string, team: TeamEntry): API.TeamData => ({
  id: team.id,
  title,
  logo: team.logo,
  canonicalTitle: team.canonicalTitle,
  translationType: team.translationType,
});

/** A provider whose episodes are split by team, keyed by team title. */
export class ProviderTeamIFrame {
  readonly type = 'team-iframe';
  teams: Record<string, TeamEntry> = {};

  constructor(readonly lang = ProviderLanguage.UKRAINIAN) {}

  sortTeams() {
    this.teams = Object.fromEntries(
      Object.entries(this.teams).sort(([a], [b]) => a.localeCompare(b)),
    );
  }

  getTeam(title: string): API.TeamData {
    const team = this.teams[title];
    return team ? toTeam(title, team) : { title: '', logo: '' };
  }

  getTeams(): API.TeamData[] {
    return Object.entries(this.teams).map(([title, team]) =>
      toTeam(title, team),
    );
  }
}

/** A provider that plays every episode in a single player. */
export class ProviderIFrame {
  readonly type = 'iframe';
  episodes: API.EpisodeData[] = [];

  constructor(readonly lang = ProviderLanguage.UKRAINIAN) {}
}
