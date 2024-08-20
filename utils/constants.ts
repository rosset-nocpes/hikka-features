import GlassMoonLogo from "@/assets/glass_moon_logo.jpg";
import AmanogawaLogo from "@/assets/amanogawa_logo.jpg";
import FanVoxUaLogo from "@/assets/fanvoxua_logo.jpg";
import InariDubLogo from "@/assets/inaridub_logo.jpg";
import FourUaLogo from "@/assets/4ua_logo.jpg";
import TenguLogo from "@/assets/tengu_logo.jpg";
import DzuskiLogo from "@/assets/dzuski_logo.jpg";
import EspadaStudioLogo from "@/assets/espada_studio_logo.jpg";
import FlameStudioLogo from "@/assets/flame_studio_logo.jpg";
import HatoshiLogo from "@/assets/hatoshi_logo.jpg";
import LifecycleLogo from "@/assets/lifecycle_logo.jpg";
import UKutochkuLogo from "@/assets/u_kutochku_logo.jpg";
import UnimayLogo from "@/assets/unimay_logo.png";
import QTVLogo from "@/assets/qtv_logo.webp";
import AniUaLogo from "@/assets/aniua_logo.webp";
import ClanKaizokuLogo from "@/assets/clan_kaizoku_logo.jpg";
import DidkoStudioLogo from "@/assets/didko_studio_logo.jpg";

export const STUDIO_LOGOS: Record<string, string> = {
  amanogawa: AmanogawaLogo,
  fanvoxua: FanVoxUaLogo,
  fanwoxua: FanVoxUaLogo,
  inaridub: InariDubLogo,
  "4ua": FourUaLogo,
  "10gu": TenguLogo,
  glassmoon: GlassMoonLogo,
  субтитриgm: GlassMoonLogo,
  "gwean&maslinka": GlassMoonLogo,
  dzuski: DzuskiLogo,
  espadastudio: EspadaStudioLogo,
  flamestudio: FlameStudioLogo,
  hatoshi: HatoshiLogo,
  lifecycle: LifecycleLogo,
  укуточкувтаверні: UKutochkuLogo,
  unimay: UnimayLogo,
  qtv: QTVLogo,
  aniua: AniUaLogo,
  clankaizoku: ClanKaizokuLogo,
  субтитриclankaizoku: ClanKaizokuLogo,
  didkostudio: DidkoStudioLogo,
};

export const STUDIO_CORRECTED_NAMES: Record<string, string> = {
  "двоголосий закадровий | AniUA": "AniUA",
  "Glass Moon (Gwean & Maslinka)": "Glass Moon",
  "Gwean & Maslinka": "Glass Moon",
  "Клан Кайзоку": "Clan Kaizoku",
};

export const BACKEND_BRANCHES: Record<BackendBranches, string> = {
  stable: "https://api.hikka-features.pp.ua",
  beta: "https://beta.hikka-features.pp.ua",
};

export const CLIENT_REFERENCE: string = "a327508d-64e2-4a09-8ae2-c1e313bde39a";

export const NEEDED_SCOPES: string[] = ["watchlist", "read:user-details"];
