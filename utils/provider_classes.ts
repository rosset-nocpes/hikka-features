class ProviderBase {
  type!: API.ProviderType;
}

export class ProviderTeamIFrame extends ProviderBase {
  teams: {
    [key: string]: {
      logo: string;
      episodes: API.EpisodeDataIFrame[];
    };
  };

  constructor() {
    super();

    this.type = 'team-iframe';
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
      title: team_name,
      logo: this.teams[team_name].logo,
    };

    return team;
  }

  getTeams() {
    return Object.entries(this.teams).map(([name, team]) => ({
      title: name,
      logo: team.logo,
    }));
  }

  isEmpty() {
    return Object.keys(this.teams).length === 0;
  }
}

export class ProviderIFrame extends ProviderBase {
  episodes: API.EpisodeDataIFrame[];

  constructor() {
    super();

    this.type = 'iframe';
    this.episodes = [];
  }

  isEmpty() {
    return this.episodes.length === 0;
  }
}
