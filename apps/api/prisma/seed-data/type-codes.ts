import {
  GENRE_NAMES,
  type GenreName,
  type RootGenreName,
} from "@repo/cards-domain";

export const PRINTED_DEFAULT_SEASON = "S1" as const;

export const ROOT_GENRE_PRINTED_TYPE_CODE: Record<RootGenreName, string> = {
  Rock: "RK",
  Mainstream: "MS",
  Electronic: "EL",
  "Reggae/Dub": "RD",
  "Hip-Hop": "HH",
  "Disco/Funk": "DF",
  Classical: "CS",
  Vintage: "VT",
};

/**
 * Canonical territory-name → TYPE-code mapping for the genre taxonomy.
 * Standard ISO 3166-1 alpha-2 for sovereign states; X-prefixed codes for
 * sub-national / non-sovereign regions (X-prefix = ISO private-use convention).
 * This is the authoritative list: all Territory rows are seeded from it.
 */
export const TERRITORY_PRINTED_TYPE_CODE: Record<string, string> = {
  // A
  Afghanistan: "AF",
  Albania: "AL",
  Algeria: "DZ",
  Andorra: "AD",
  Angola: "AO",
  "Antigua and Barbuda": "AG",
  Argentina: "AR",
  Armenia: "AM",
  Australia: "AU",
  Austria: "AT",
  Azerbaijan: "AZ",
  // B
  Bahamas: "BS",
  Bahrain: "BH",
  Bangladesh: "BD",
  Barbados: "BB",
  Belarus: "BY",
  Belgium: "BE",
  Belize: "BZ",
  Benin: "BJ",
  Bhutan: "BT",
  Bolivia: "BO",
  "Bosnia and Herzegovina": "BA",
  Botswana: "BW",
  Brazil: "BR",
  Brunei: "BN",
  Bulgaria: "BG",
  "Burkina Faso": "BF",
  Burundi: "BI",
  // C
  "Cabo Verde": "CV",
  Cambodia: "KH",
  Cameroon: "CM",
  Canada: "CA",
  "Central African Republic": "CF",
  Chad: "TD",
  Chile: "CL",
  China: "CN",
  Colombia: "CO",
  Comoros: "KM",
  "Congo (Republic)": "CG",
  "Congo (Democratic Republic)": "CD",
  "Costa Rica": "CR",
  Croatia: "HR",
  Cuba: "CU",
  Cyprus: "CY",
  Czechia: "CZ",
  // D
  Denmark: "DK",
  Djibouti: "DJ",
  Dominica: "DM",
  "Dominican Republic": "DO",
  // E
  Ecuador: "EC",
  Egypt: "EG",
  "El Salvador": "SV",
  "Equatorial Guinea": "GQ",
  Eritrea: "ER",
  Estonia: "EE",
  Eswatini: "SZ",
  Ethiopia: "ET",
  // F
  Fiji: "FJ",
  Finland: "FI",
  France: "FR",
  // G
  Gabon: "GA",
  Gambia: "GM",
  Georgia: "GE",
  Germany: "DE",
  Ghana: "GH",
  Greece: "GR",
  Grenada: "GD",
  Guatemala: "GT",
  Guinea: "GN",
  "Guinea-Bissau": "GW",
  Guyana: "GY",
  // H
  Haiti: "HT",
  Honduras: "HN",
  Hungary: "HU",
  // I
  Iceland: "IS",
  India: "IN",
  Indonesia: "ID",
  Iran: "IR",
  Iraq: "IQ",
  Ireland: "IE",
  Israel: "IL",
  Italy: "IT",
  // J
  Jamaica: "JM",
  Japan: "JP",
  Jordan: "JO",
  // K
  Kazakhstan: "KZ",
  Kenya: "KE",
  Kiribati: "KI",
  Kosovo: "XK",
  Kuwait: "KW",
  Kyrgyzstan: "KG",
  // L
  Laos: "LA",
  Latvia: "LV",
  Lebanon: "LB",
  Lesotho: "LS",
  Liberia: "LR",
  Libya: "LY",
  Liechtenstein: "LI",
  Lithuania: "LT",
  Luxembourg: "LU",
  // M
  Madagascar: "MG",
  Malawi: "MW",
  Malaysia: "MY",
  Maldives: "MV",
  Mali: "ML",
  Malta: "MT",
  "Marshall Islands": "MH",
  Mauritania: "MR",
  Mauritius: "MU",
  Mexico: "MX",
  Micronesia: "FM",
  Moldova: "MD",
  Monaco: "MC",
  Mongolia: "MN",
  Montenegro: "ME",
  Morocco: "MA",
  Mozambique: "MZ",
  Myanmar: "MM",
  // N
  Namibia: "NA",
  Nauru: "NR",
  Nepal: "NP",
  Netherlands: "NL",
  "New Zealand": "NZ",
  Nicaragua: "NI",
  Niger: "NE",
  Nigeria: "NG",
  "North Korea": "KP",
  "North Macedonia": "MK",
  Norway: "NO",
  // O
  Oman: "OM",
  // P
  Pakistan: "PK",
  Palau: "PW",
  Palestine: "PS",
  Panama: "PA",
  "Papua New Guinea": "PG",
  Paraguay: "PY",
  Peru: "PE",
  Philippines: "PH",
  Poland: "PL",
  Portugal: "PT",
  "Puerto Rico": "PR",
  // Q
  Qatar: "QA",
  // R
  Romania: "RO",
  Russia: "RU",
  Rwanda: "RW",
  // S
  "Saint Kitts and Nevis": "KN",
  "Saint Lucia": "LC",
  "Saint Vincent and the Grenadines": "VC",
  Samoa: "WS",
  "San Marino": "SM",
  "Sao Tome and Principe": "ST",
  "Saudi Arabia": "SA",
  Senegal: "SN",
  Serbia: "RS",
  Seychelles: "SC",
  "Sierra Leone": "SL",
  Singapore: "SG",
  Slovakia: "SK",
  Slovenia: "SI",
  "Solomon Islands": "SB",
  Somalia: "SO",
  "South Africa": "ZA",
  "South Korea": "KR",
  "South Sudan": "SS",
  Spain: "ES",
  "Sri Lanka": "LK",
  Sudan: "SD",
  Suriname: "SR",
  Sweden: "SE",
  Switzerland: "CH",
  Syria: "SY",
  // T
  Taiwan: "TW",
  Tajikistan: "TJ",
  Tanzania: "TZ",
  Thailand: "TH",
  "Timor-Leste": "TL",
  Togo: "TG",
  Tonga: "TO",
  "Trinidad and Tobago": "TT",
  Tunisia: "TN",
  Turkey: "TR",
  Turkmenistan: "TM",
  Tuvalu: "TV",
  // U
  Uganda: "UG",
  Ukraine: "UA",
  "United Arab Emirates": "AE",
  "United Kingdom": "UK",
  USA: "US",
  Uruguay: "UY",
  Uzbekistan: "UZ",
  // V
  Vanuatu: "VU",
  Venezuela: "VE",
  Vietnam: "VN",
  // Y
  Yemen: "YE",
  // Z
  Zambia: "ZM",
  Zimbabwe: "ZW",

  // Sub-national regions (X-prefix = ISO private-use convention)
  England: "EN",
  Scotland: "XS",
  // FR subdivisions
  Britany: "XB",
  Corsica: "XC",
};

export function formatPrintedSetId(
  typeCode: string,
  seasonCode: string,
  sequenceWithinSeason: number,
  variantSuffix?: string | null,
): string {
  if (sequenceWithinSeason < 1 || sequenceWithinSeason > 180) {
    throw new Error(
      `Printed sequence must be 1–180 inclusive, got ${sequenceWithinSeason}`,
    );
  }
  const padded = String(sequenceWithinSeason).padStart(3, "0");
  return `${typeCode}-${seasonCode}-${padded}${variantSuffix ?? ""}`;
}

function isGenreName(s: string): s is GenreName {
  return (GENRE_NAMES as readonly string[]).includes(s);
}

function lookupPrintedCode(
  anchorGenreName: string,
  codeByAnchorName: ReadonlyMap<string, string>,
): string {
  const code = codeByAnchorName.get(anchorGenreName);
  if (!code) {
    throw new Error(
      `Printed set id: missing printedTypeCode in DB for taxonomy genre "${anchorGenreName}"`,
    );
  }
  return code;
}

/** Transition pillar row matches wheel root — lookup `Genre.printedTypeCode` by name. */
export function printedTypeCodeForTransitionGenre(
  rootGenreLabel: string,
  codeByAnchorName: ReadonlyMap<string, string>,
): string {
  if (!rootGenreLabel?.trim())
    throw new Error("Printed set id: transition genre required");
  if (!isGenreName(rootGenreLabel)) {
    throw new Error(
      `Printed set id: unknown transition pillar genre "${rootGenreLabel}"`,
    );
  }
  return lookupPrintedCode(rootGenreLabel, codeByAnchorName);
}
