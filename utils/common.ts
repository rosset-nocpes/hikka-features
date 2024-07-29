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

export {};

declare global {
  type MediaType = "anime" | "manga" | "novel";

  type InfoType = "character" | "person";

  type SourcesType =
    | "mal"
    | "anilist"
    | "anidb"
    | "ann"
    | "wiki"
    | "amanogawa"
    | "mu";
  // | "dengeki"

  type PlayerSource = "moon" | "ashdi";
}

export const StudioLogos: Record<string, string> = {
  amanogawa: AmanogawaLogo,
  fanvoxua: FanVoxUaLogo,
  fanwoxua: FanVoxUaLogo,
  inaridub: InariDubLogo,
  "4ua": FourUaLogo,
  "10gu": TenguLogo,
  glassmoon: GlassMoonLogo,
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
};

export const StudiosCorrectedNames: Record<string, string> = {
  "двоголосий закадровий | AniUA": "AniUA",
};
