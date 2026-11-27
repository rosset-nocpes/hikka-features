// Generated from features-backend's validators by its
// `scripts/extension-api.ts` (`bun run api:generate` here). Don't edit.
import { makeFunctionReference } from 'convex/server';

export const convexApi = {
  activity: {
    clear: makeFunctionReference<'mutation', Record<string, never>, null>(
      'activity:clear',
    ),
    clearReading: makeFunctionReference<
      'mutation',
      Record<string, never>,
      null
    >('activity:clearReading'),
    friends: makeFunctionReference<
      'query',
      Record<string, never>,
      Array<
        | {
            episode: number;
            playing: boolean;
            updatedAt: number;
            contentType: 'anime';
            friend: {
              username?: string;
              avatar?: string;
              id: string;
            };
            slug: string;
            room?: {
              memberCount: number;
              code?: string;
            };
          }
        | {
            contentType: 'manga' | 'novel';
            slug: string;
            chapter: number;
            volume?: number;
            updatedAt: number;
            friend: {
              username?: string;
              avatar?: string;
              id: string;
            };
          }
      >
    >('activity:friends'),
    report: makeFunctionReference<
      'mutation',
      {
        animeSlug: string;
        episode: number;
        playing: boolean;
        roomCode?: string;
      },
      {
        shared: boolean;
      }
    >('activity:report'),
    reportReading: makeFunctionReference<
      'mutation',
      {
        contentType: 'manga' | 'novel';
        slug: string;
        chapter: number;
        volume?: number;
      },
      {
        shared: boolean;
      }
    >('activity:reportReading'),
    setSharing: makeFunctionReference<
      'mutation',
      {
        shareActivity: boolean;
      },
      null
    >('activity:setSharing'),
    settings: makeFunctionReference<
      'query',
      Record<string, never>,
      {
        shareActivity: boolean;
      }
    >('activity:settings'),
  },
  catalog: {
    get: makeFunctionReference<
      'query',
      {
        slug: string;
      },
      {
        poster?: string;
      } | null
    >('catalog:get'),
  },
  compatibility: {
    get: makeFunctionReference<
      'query',
      {
        extensionVersion: string;
        protocol: number;
      },
      {
        status: 'current' | 'update_available' | 'unsupported';
        latestVersion: string;
        minimumVersion: string;
        protocolSupported: boolean;
      }
    >('compatibility:get'),
  },
  editor: {
    suggest: makeFunctionReference<
      'action',
      {
        type: 'characters' | 'people';
        slug: string;
      },
      {
        suggestion: {
          name_ua?: string;
          name_en?: string;
          name_ja?: string;
          name_native?: string;
        };
      }
    >('editor:suggest'),
  },
  fandub: {
    forAnime: makeFunctionReference<
      'query',
      {
        slug: string;
      },
      {
        episodesTotal?: number;
        teams: {
          team: {
            id: string;
            title: string;
            logo?: string;
            slug?: string;
          };
          releases: {
            source: 'catalog' | 'player';
            translationType: 'dub' | 'sub' | 'unknown';
            episodes?: number;
            episodesTotal?: number;
            status?:
              | 'announced'
              | 'ongoing'
              | 'finished'
              | 'paused'
              | 'dropped';
            url?: string;
            updatedAt: number;
            sources: Array<'catalog' | 'player'>;
          }[];
        }[];
      }
    >('fandub:forAnime'),
    team: makeFunctionReference<
      'query',
      {
        slug: string;
      },
      null | {
        team: {
          id: string;
          title: string;
          logo?: string;
          slug?: string;
          description?: string;
          kinds: string[];
          activity?: string;
          stats?: {
            anime: number;
            dub: number;
            sub: number;
            lastReleaseAt?: number;
          };
          links: {
            kind:
              | 'telegram'
              | 'youtube'
              | 'instagram'
              | 'tiktok'
              | 'website'
              | 'donate'
              | 'anitube';
            url: string;
          }[];
        };
        releases: {
          anime: {
            image?: string;
            mediaType?: 'tv' | 'movie' | 'ona' | 'unknown';
            year?: number;
            episodesTotal?: number;
            slug: string;
            title?: string;
          };
          releases: {
            translationType: 'dub' | 'sub' | 'unknown';
            episodes?: number;
            episodesTotal?: number;
            status?:
              | 'announced'
              | 'ongoing'
              | 'finished'
              | 'paused'
              | 'dropped';
          }[];
          updatedAt: number;
        }[];
        releaseTimes: number[];
      }
    >('fandub:team'),
    teams: makeFunctionReference<
      'query',
      Record<string, never>,
      {
        id: string;
        title: string;
        logo?: string;
        slug: string;
        description?: string;
        kinds: string[];
        activity?: string;
        stats?: {
          anime: number;
          dub: number;
          sub: number;
          lastReleaseAt?: number;
        };
        covers: string[];
      }[]
    >('fandub:teams'),
  },
  favorites: {
    list: makeFunctionReference<
      'query',
      Record<string, never>,
      {
        teamId?: string;
        teamTitle: string;
        translationType: 'dub' | 'sub' | 'unknown';
        notificationsEnabled: boolean;
        baselineEpisode: number;
        updatedAt: number;
        animeSlug: string;
        teamKey: string;
      }[]
    >('favorites:list'),
    remove: makeFunctionReference<
      'mutation',
      {
        animeSlug: string;
      },
      null
    >('favorites:remove'),
    set: makeFunctionReference<
      'mutation',
      {
        favorite: {
          teamId?: string;
          teamTitle: string;
          translationType: 'dub' | 'sub' | 'unknown';
          notificationsEnabled: boolean;
          animeSlug: string;
        };
      },
      {
        teamId?: string;
        teamTitle: string;
        translationType: 'dub' | 'sub' | 'unknown';
        notificationsEnabled: boolean;
        baselineEpisode: number;
        updatedAt: number;
        animeSlug: string;
        teamKey: string;
      }
    >('favorites:set'),
  },
  friends: {
    refresh: makeFunctionReference<'action', Record<string, never>, null>(
      'friends:refresh',
    ),
  },
  musicFavorites: {
    add: makeFunctionReference<
      'mutation',
      {
        song: {
          animeSlug: string;
          ostType: 'opening' | 'ending';
          index: number;
          title: string;
          author?: string;
          animeTitle?: string;
          poster?: string;
          audio?: string;
        };
      },
      null
    >('musicFavorites:add'),
    list: makeFunctionReference<
      'query',
      {
        hikkaId: string;
      },
      {
        animeSlug: string;
        ostType: 'opening' | 'ending';
        index: number;
        title: string;
        author?: string;
        animeTitle?: string;
        poster?: string;
        audio?: string;
        addedAt: number;
        release?: {
          cover: string;
          album?: string;
          released?: string;
          link?: string;
          artist?: string;
        };
      }[]
    >('musicFavorites:list'),
    remove: makeFunctionReference<
      'mutation',
      {
        animeSlug: string;
        ostType: 'opening' | 'ending';
        index: number;
      },
      null
    >('musicFavorites:remove'),
    setAudio: makeFunctionReference<
      'mutation',
      {
        animeSlug: string;
        ostType: 'opening' | 'ending';
        index: number;
        audio: string;
      },
      null
    >('musicFavorites:setAudio'),
  },
  notifications: {
    markAllSeen: makeFunctionReference<'mutation', Record<string, never>, null>(
      'notifications:markAllSeen',
    ),
    markSeen: makeFunctionReference<
      'mutation',
      {
        id: string;
      },
      null
    >('notifications:markSeen'),
    menu: makeFunctionReference<
      'query',
      {
        limit?: number;
      },
      {
        notifications: {
          id: string;
          animeSlug: string;
          animeTitle?: string;
          animeImage?: string;
          teamTitle: string;
          translationType: 'dub' | 'sub' | 'unknown';
          episodeNumber: number;
          episodeTitle?: string;
          createdAt: number;
          seen: boolean;
        }[];
        unseenCount: number;
      }
    >('notifications:menu'),
  },
  skip: {
    queue: makeFunctionReference<
      'query',
      {
        token: string;
      },
      {
        playing: number | null;
        ahead: number | null;
      }
    >('skip:queue'),
    request: makeFunctionReference<
      'mutation',
      {
        slug: string;
        teamKey: string;
        episode: number;
        source: string;
        duration?: number;
        ahead?: boolean;
      },
      {
        jobId: string;
        full: boolean;
      } | null
    >('skip:request'),
    segments: makeFunctionReference<
      'query',
      {
        slug: string;
        teamKey: string;
        episode: number;
      },
      {
        results: {
          provider: string;
          source: string;
          duration: number;
          segments: {
            type: 'opening' | 'ending';
            start: number;
            end: number;
          }[];
          incomplete: boolean;
          analyzedAt: number;
        }[];
        jobs: {
          id: string;
          source: string;
          state: 'pending' | 'failed';
        }[];
      }
    >('skip:segments'),
  },
  songInfo: {
    forAnime: makeFunctionReference<
      'query',
      {
        animeSlug: string;
      },
      {
        songs: {
          ostType: 'opening' | 'ending';
          index: number;
          cover: string;
          album?: string;
          released?: string;
          link?: string;
          artist?: string;
        }[];
        state: 'unknown' | 'queued' | 'done';
        refreshAt?: number;
      }
    >('songInfo:forAnime'),
    request: makeFunctionReference<
      'mutation',
      {
        animeSlug: string;
      },
      null
    >('songInfo:request'),
  },
  teamPriority: {
    get: makeFunctionReference<
      'query',
      Record<string, never>,
      {
        teams: {
          id: string;
          title: string;
          logo?: string;
        }[];
        translationType: 'dub' | 'sub';
        updatedAt: number;
      } | null
    >('teamPriority:get'),
    set: makeFunctionReference<
      'mutation',
      {
        teamIds: string[];
        translationType?: 'dub' | 'sub';
      },
      {
        teams: {
          id: string;
          title: string;
          logo?: string;
        }[];
        translationType: 'dub' | 'sub';
        updatedAt: number;
      }
    >('teamPriority:set'),
  },
  teams: {
    list: makeFunctionReference<
      'query',
      Record<string, never>,
      {
        id: string;
        title: string;
        logo?: string;
      }[]
    >('teams:list'),
  },
  watch: {
    resolve: makeFunctionReference<
      'action',
      {
        slug: string;
      },
      {
        anime: {
          slug: string;
          mediaType: 'tv' | 'movie' | 'ona' | 'unknown';
        };
        providers: {
          id: string;
          language: 'uk' | 'en' | 'multi';
        }[];
        teams: {
          key: string;
          team: {
            id?: string;
            slug?: string;
            title: string;
            logo?: string;
          };
          unnamed?: true;
          translationType: 'dub' | 'sub' | 'unknown';
          episodes: {
            number: number;
            sources: {
              provider: string;
              url: string;
              releasedAt?: number;
            }[];
          }[];
        }[];
        episodes: {
          number: number;
          title?: {
            ua?: string;
            en?: string;
            ja?: string;
          };
          type?: 'canon' | 'filler' | 'mixed' | 'recap';
        }[];
        warnings: {
          provider: string;
          code: string;
        }[];
        refreshedAt: number;
      }
    >('watch:resolve'),
  },
  watchRooms: {
    control: makeFunctionReference<
      'mutation',
      {
        code: string;
        action:
          | {
              type: 'play' | 'pause' | 'seek';
              position: number;
            }
          | {
              type: 'rate';
              position: number;
              rate: number;
            }
          | {
              type: 'select';
              from: {
                provider: string;
                team: string;
                episode: number;
              };
              to: {
                provider: string;
                team: string;
                episode: number;
              };
              rate?: number;
            }
          | {
              type: 'enqueue';
              items: {
                provider: string;
                team: string;
                episode: number;
                animeSlug: string;
              }[];
            }
          | {
              type: 'dequeue';
              items: {
                animeSlug: string;
                episode: number;
              }[];
            }
          | {
              type: 'requeue';
              item: {
                animeSlug: string;
                episode: number;
              };
              index: number;
            }
          | {
              type: 'advance';
              from: {
                provider: string;
                team: string;
                episode: number;
                animeSlug: string;
              };
              item?: {
                animeSlug: string;
                episode: number;
              };
              next?: {
                provider: string;
                team: string;
                episode: number;
              };
            }
          | {
              type: 'propose';
              proposal:
                | {
                    type: 'skip';
                    from: {
                      provider: string;
                      team: string;
                      episode: number;
                      animeSlug: string;
                    };
                    segment: 'opening' | 'ending' | 'recap';
                    to: number;
                  }
                | {
                    type: 'advance';
                    from: {
                      provider: string;
                      team: string;
                      episode: number;
                      animeSlug: string;
                    };
                    item?: {
                      animeSlug: string;
                      episode: number;
                    };
                    next?: {
                      provider: string;
                      team: string;
                      episode: number;
                    };
                  }
                | {
                    type: 'select';
                    from: {
                      provider: string;
                      team: string;
                      episode: number;
                    };
                    to: {
                      provider: string;
                      team: string;
                      episode: number;
                    };
                    rate?: number;
                  };
            }
          | {
              type: 'vote';
              id: string;
              yes: boolean;
            };
        tab?: string;
      },
      null
    >('watchRooms:control'),
    create: makeFunctionReference<
      'mutation',
      {
        animeSlug: string;
        provider: string;
        team: string;
        episode: number;
        playing: boolean;
        position: number;
        rate: number;
        tab?: string;
        votes?: boolean;
      },
      {
        code: string;
      }
    >('watchRooms:create'),
    decline: makeFunctionReference<
      'mutation',
      {
        id: string;
      },
      null
    >('watchRooms:decline'),
    friends: makeFunctionReference<
      'query',
      {
        code: string;
      },
      {
        username?: string;
        avatar?: string;
        id: string;
        status: 'member' | 'invited' | 'none';
      }[]
    >('watchRooms:friends'),
    get: makeFunctionReference<
      'query',
      {
        code: string;
        tab?: string;
      },
      {
        code: string;
        animeSlug: string;
        provider: string;
        team: string;
        episode: number;
        playing: boolean;
        position: number;
        rate: number;
        updatedAt: number;
        updatedBy: string;
        ownerId: string;
        friendsCanJoin: boolean;
        queue: {
          provider: string;
          team: string;
          episode: number;
          animeSlug: string;
        }[];
        voting: boolean;
        voters: number;
        vote?: {
          id: string;
          animeSlug: string;
          proposal:
            | {
                type: 'skip';
                from: {
                  provider: string;
                  team: string;
                  episode: number;
                  animeSlug: string;
                };
                segment: 'opening' | 'ending' | 'recap';
                to: number;
              }
            | {
                type: 'advance';
                from: {
                  provider: string;
                  team: string;
                  episode: number;
                  animeSlug: string;
                };
                item?: {
                  animeSlug: string;
                  episode: number;
                };
                next?: {
                  provider: string;
                  team: string;
                  episode: number;
                };
              }
            | {
                type: 'select';
                from: {
                  provider: string;
                  team: string;
                  episode: number;
                };
                to: {
                  provider: string;
                  team: string;
                  episode: number;
                };
                rate?: number;
              };
          by: string;
          yes: string[];
          no: string[];
          expiresAt: number;
          result?: 'passed' | 'rejected' | 'failed' | 'expired' | 'cancelled';
          needed: number;
        };
        members: {
          username?: string;
          avatar?: string;
          id: string;
          self: boolean;
        }[];
        joinedElsewhere: boolean;
      } | null
    >('watchRooms:get'),
    heartbeat: makeFunctionReference<
      'mutation',
      {
        code: string;
        tab?: string;
        join?: {
          animeSlug: string;
        };
        followsAnime?: boolean;
        votes?: boolean;
      },
      {
        now: number;
      } | null
    >('watchRooms:heartbeat'),
    inbox: makeFunctionReference<
      'query',
      Record<string, never>,
      {
        invites: {
          code: string;
          animeSlug: string;
          episode: number;
          memberCount: number;
          animeTitle?: string;
          animeImage?: string;
          friend: {
            username?: string;
            avatar?: string;
            id: string;
          };
          id: string;
        }[];
        rooms: {
          code: string;
          animeSlug: string;
          episode: number;
          memberCount: number;
          animeTitle?: string;
          animeImage?: string;
          friend: {
            username?: string;
            avatar?: string;
            id: string;
          };
        }[];
      }
    >('watchRooms:inbox'),
    invite: makeFunctionReference<
      'mutation',
      {
        code: string;
        userId: string;
      },
      null
    >('watchRooms:invite'),
    leave: makeFunctionReference<
      'mutation',
      {
        code: string;
        tab?: string;
      },
      null
    >('watchRooms:leave'),
    setVoting: makeFunctionReference<
      'mutation',
      {
        code: string;
        voting: boolean;
      },
      null
    >('watchRooms:setVoting'),
    share: makeFunctionReference<
      'mutation',
      {
        code: string;
        friendsCanJoin: boolean;
      },
      null
    >('watchRooms:share'),
  },
};
