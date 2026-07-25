class ProviderBase {
  type!: API.ProviderType;
  lang!: ProviderLanguage;
}

export class ProviderTeamIFrame extends ProviderBase {
  teams: {
    [key: string]: {
      id?: string;
      logo: string;
      canonicalTitle?: string;
      translationType?: 'dub' | 'sub' | 'unknown';
      episodes: API.EpisodeDataIFrame[];
    };
  };

  constructor(lang = ProviderLanguage.UKRAINIAN) {
    super();

    this.type = 'team-iframe';
    this.lang = lang;
    this.teams = {};
  }

  sortTeams() {
    this.teams = Object.fromEntries(
      Object.entries(this.teams).sort(([a], [b]) => a.localeCompare(b)),
    );
  }

  getTeam(team_name: string) {
    if (!this.teams[team_name])
      return {
        title: '',
        logo: '',
      };

    const team: API.TeamData = {
      id: this.teams[team_name].id,
      title: team_name,
      logo: this.teams[team_name].logo,
      canonicalTitle: this.teams[team_name].canonicalTitle,
      translationType: this.teams[team_name].translationType,
    };

    return team;
  }

  getTeams() {
    return Object.entries(this.teams).map(([name, team]) => ({
      id: team.id,
      title: name,
      logo: team.logo,
      canonicalTitle: team.canonicalTitle,
      translationType: team.translationType,
    }));
  }

  isEmpty() {
    return Object.keys(this.teams).length === 0;
  }
}

export class ProviderIFrame extends ProviderBase {
  episodes: API.EpisodeDataIFrame[];

  constructor(lang = ProviderLanguage.UKRAINIAN) {
    super();

    this.type = 'iframe';
    this.lang = lang;
    this.episodes = [];
  }

  isEmpty() {
    return this.episodes.length === 0;
  }
}
