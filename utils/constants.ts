import GlassMoonLogo from "@/assets/glass_moon_logo.webp";
import AmanogawaLogo from "@/assets/amanogawa_logo.webp";
import FanVoxUaLogo from "@/assets/fanvoxua_logo.webp";
import InariDubLogo from "@/assets/inaridub_logo.webp";
import FourUaLogo from "@/assets/4ua_logo.webp";
import TenguLogo from "@/assets/tengu_logo.webp";
import DzuskiLogo from "@/assets/dzuski_logo.webp";
import EspadaStudioLogo from "@/assets/espada_studio_logo.webp";
import FlameStudioLogo from "@/assets/flame_studio_logo.webp";
import HatoshiLogo from "@/assets/hatoshi_logo.webp";
import LifecycleLogo from "@/assets/lifecycle_logo.webp";
import UKutochkuLogo from "@/assets/u_kutochku_logo.webp";
import UnimayLogo from "@/assets/unimay_logo.webp";
import QTVLogo from "@/assets/qtv_logo.webp";
import AniUaLogo from "@/assets/aniua_logo.webp";
import ClanKaizokuLogo from "@/assets/clan_kaizoku_logo.webp";
import DidkoStudioLogo from "@/assets/didko_studio_logo.webp";
import VRDubLogo from "@/assets/vrdub_logo.webp";
import AniMriyaLogo from "@/assets/animriya_logo.webp";
import UaMaxLogo from "@/assets/uamax_logo.webp";
import MelvoiceLogo from "@/assets/melvoice_logo.webp";
import KiotoLogo from "@/assets/kioto_logo.webp";
import TogarashiLogo from "@/assets/togarashi_logo.webp";
import RobotaHolosomLogo from "@/assets/robota_holosom_logo.webp";
import InariOkamiLogo from "@/assets/inariokami_logo.webp";
import LegatLogo from "@/assets/legat_logo.webp";
import OtakoiStudioLogo from "@/assets/otakoi_studio_logo.webp";
import UfdubLogo from "@/assets/ufdub_logo.webp";
import StarfallLogo from "@/assets/starfall_logo.webp";
import SKOLogo from "@/assets/sko_logo.webp";
import YuigenLogo from "@/assets/yuigen_logo.webp";

export const STUDIO_LOGOS: Record<string, string> = {
  amanogawa: AmanogawaLogo,
  fanvoxua: FanVoxUaLogo,
  inaridub: InariDubLogo,
  "4ua": FourUaLogo,
  "10gu": TenguLogo,
  glassmoon: GlassMoonLogo,
  субтитриgm: GlassMoonLogo,
  dzuski: DzuskiLogo,
  espadastudio: EspadaStudioLogo,
  flamestudio: FlameStudioLogo,
  hatoshi: HatoshiLogo,
  lifecycle: LifecycleLogo,
  укуточкувтаверні: UKutochkuLogo,
  unimay: UnimayLogo,
  qtv: QTVLogo,
  aniua: AniUaLogo,
  aniuaсубтитри: AniUaLogo,
  clankaizoku: ClanKaizokuLogo,
  субтитриclankaizoku: ClanKaizokuLogo,
  didkostudio: DidkoStudioLogo,
  субтитриdidkostudio: DidkoStudioLogo,
  vrdub: VRDubLogo,
  анімрія: AniMriyaLogo,
  uamax: UaMaxLogo,
  melvoice: MelvoiceLogo,
  субтитриmelvoice: MelvoiceLogo,
  kioto: KiotoLogo,
  togarashi: TogarashiLogo,
  роботаголосом: RobotaHolosomLogo,
  inariokami: InariOkamiLogo,
  субтитриlegat: LegatLogo,
  otakoistudio: OtakoiStudioLogo,
  ufdub: UfdubLogo,
  starfall: StarfallLogo,
  справжнякозацькаозвучка: SKOLogo,
  юіґень: YuigenLogo,
};

export const STUDIO_CORRECTED_NAMES: Record<string, string> = {
  "двоголосий закадровий | AniUA": "AniUA",
  "багатоголосий закадровий | Клан Кайзоку": "Clan Kaizoku",
  "Glass Moon (Gwean & Maslinka)": "Glass Moon",
  "Gwean & Maslinka": "Glass Moon",
  "Клан Кайзоку": "Clan Kaizoku",
  FanWoxUA: "FanVoxUA",
  FanVoxUa: "FanVoxUA",
  MelodicVoiceStudio: "Melvoice",
  Кіото: "Kioto",
  ІnariОkami: "InariOkami", // I & O letters from cyrillic, bruh =/
};

export const BACKEND_BRANCHES: Record<BackendBranches, string> = {
  stable: "https://api.hikka-features.pp.ua",
  beta: "https://beta.hikka-features.pp.ua",
};

export const CLIENT_REFERENCE: string = "a327508d-64e2-4a09-8ae2-c1e313bde39a";

export const NEEDED_SCOPES: string[] = [
  "read:user-details",
  "update:user-details:description",
];
