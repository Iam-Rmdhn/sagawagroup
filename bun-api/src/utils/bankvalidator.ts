import Fuse from "fuse.js";

const banks = [
  { name: "Allo Bank", aliases: ["allo"] },
  { name: "Bank Aladin Syariah", aliases: ["aladin", "bank aladin"] },
  { name: "Bank BCA", aliases: ["bca"] },
  { name: "Bank BCA Syariah", aliases: ["bca syariah"] },
  { name: "Bank BJB (Bank Jabar Banten)", aliases: ["bjb", "bank bjb"] },
  { name: "Bank BPD DIY", aliases: ["bpd diy"] },
  { name: "Bank Danamon", aliases: ["danamon"] },
  { name: "Bank NTB", aliases: ["ntb", "bank nusa tenggara barat"] },
  { name: "Bank NTT", aliases: ["ntb", "bank nusa tenggara timur"] },
  { name: "Bank DKI", aliases: ["dki"] },
  { name: "Bank HSBC", aliases: ["hsbc"] },
  { name: "MNC Bank", aliases: ["mnc", "bank mnc"] },
  { name: "Bank Jago", aliases: ["jago"] },
  { name: "Bank Jambi", aliases: ["jambi"] },
  { name: "Bank Lampung", aliases: ["lampung"] },
  { name: "Bank Jateng", aliases: ["jateng"] },
  { name: "Bank Jatim", aliases: ["jatim"] },
  { name: "Bank Nationalnobu", aliases: ["nobu", "bank nobu"] },
  { name: "Bank KEB Hana (LINE Bank)", aliases: ["hana", "line bank"] },
  { name: "Bank Mandiri", aliases: ["mandiri"] },
  { name: "Bank Mandiri", aliases: ["mandiri"] },
  { name: "Bank Mayapada", aliases: ["mayapada"] },
  { name: "Bank Mega", aliases: ["mega"] },
  { name: "Bank Mega Syariah", aliases: ["mega syariah"] },
  { name: "Bank Muamalat", aliases: ["muamalat"] },
  { name: "Bank Negara Indonesia (BNI)", aliases: ["bni"] },
  { name: "Bank Neo Commerce (BNC)", aliases: ["bnc", "neo commerce"] },
  { name: "Bank OCBC NISP", aliases: ["ocbc", "nisp"] },
  { name: "Bank Panin", aliases: ["panin"] },
  {
    name: "Bank Panin Dubai Syariah",
    aliases: ["panin dubai", "panin syariah"],
  },
  { name: "Bank Rakyat Indonesia (BRI)", aliases: ["bri"] },
  { name: "Bank Raya", aliases: ["raya"] },
  { name: "Bank Sinarmas", aliases: ["sinarmas"] },
  { name: "Bank Sumsel Babel", aliases: ["sumsel babel"] },
  { name: "Bank Sumut", aliases: ["sumut"] },
  { name: "Bank Syariah Indonesia (BSI)", aliases: ["bsi"] },
  { name: "Bank Tabungan Negara (BTN)", aliases: ["btn"] },
  { name: "Krom Bank Indonesia", aliases: ["krom", "krom indonesia"] },
  { name: "Bank UOB Indonesia", aliases: ["uob"] },
  { name: "blu by BCA Digital", aliases: ["blu", "blu bca", "bca digital"] },
  { name: "Citibank Indonesia", aliases: ["citibank"] },
  { name: "Deutsche Bank AG", aliases: ["deutsche"] },
  { name: "JP Morgan Chase Bank", aliases: ["jp morgan", "chase"] },
  { name: "MUFG Bank", aliases: ["mufg"] },
  { name: "SeaBank", aliases: ["seabank", "sea bank"] },
  {
    name: "Standard Chartered Bank",
    aliases: ["standard chartered", "standard"],
  },
  { name: "Bank Nagari", aliases: ["nagari"] },
  { name: "Bank Bukopin", aliases: ["bukopin"] },
  { name: "Permata Bank", aliases: ["permata"] },
  { name: "Bank Saqu Indonesia", aliases: ["saqu", "saqu indonesia"] },
  { name: "Superbank", aliases: ["super"] },
  {
    name: "Bank Kalbar",
    aliases: ["kalbar", "bank kalimantan barat", "kalbar bank"],
  },
  { name: "Bank Kalsel", aliases: ["bank kalsel", "kalimantan selatan"] },
  {
    name: "Bankaltimtara",
    aliases: [
      "kalimantan utara",
      "kalimantan timur",
      "kaltimtara",
      "bank kalimantan utara",
      "bank kalimantan timur",
    ],
  },
  { name: "Bank Kalteng", aliases: ["kalteng", "bank kalimantan tengah"] },
  { name: "CIMB Niaga", aliases: ["bank cimb", "cimb"] },
  { name: "Bank Aceh", aliases: ["aceh", "aceh syariah"] },
  { name: "JTrust Bank", aliases: ["jtrust"] },
];

const fuse = new Fuse(banks, {
  includeScore: true,
  threshold: 0.3,
  keys: ["name", "aliases"],
});

export function validateBankInput(input: string): string | null {
  if (typeof input !== "string") return null;

  const trimmedInput = input.trim().toLowerCase();
  const result = fuse.search(trimmedInput);

  const topResult = result?.[0];

  if (!topResult || !topResult.item) return null;

  return topResult.item.name;
}
