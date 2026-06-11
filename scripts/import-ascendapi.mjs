// Importa el catálogo completo de ejercicios desde AscendAPI (ex-ExerciseDB).
// Ver ADR-007. Usa el tier gratuito alojado (oss.exercisedb.dev, sin auth).
// Idempotente: upsert por source_id (re-ejecutar actualiza, no duplica).
import postgres from "postgres";

process.loadEnvFile(".env.local");
const sql = postgres(process.env.DATABASE_URL_SESSION, { max: 1 });

const BASE = "https://oss.exercisedb.dev/api/v1/exercises";

// targetMuscle (inglés, AscendAPI) → grupo muscular (español, nuestro catálogo)
const MUSCLE_GROUP = {
  abs: "abdomen",
  abductors: "abductores",
  adductors: "aductores",
  biceps: "bíceps",
  calves: "pantorrillas",
  "cardiovascular system": "cardio",
  delts: "hombros",
  forearms: "antebrazos",
  glutes: "glúteos",
  hamstrings: "isquiotibiales",
  lats: "espalda",
  "levator scapulae": "cuello",
  pectorals: "pecho",
  quads: "cuádriceps",
  "serratus anterior": "pecho",
  spine: "espalda baja",
  traps: "trapecios",
  triceps: "tríceps",
  "upper back": "espalda",
};

// Fallback cuando el targetMuscle no está en el mapa: bodyPart → grupo
const BODYPART_GROUP = {
  neck: "cuello",
  "lower arms": "antebrazos",
  shoulders: "hombros",
  cardio: "cardio",
  "upper arms": "brazos",
  chest: "pecho",
  "lower legs": "pantorrillas",
  back: "espalda",
  "upper legs": "piernas",
  waist: "abdomen",
};

// 1) Descargar todo el catálogo (paginado por cursor).
// La API pagina de a 25 y aplica rate-limit: pausa entre páginas + backoff en 429.
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

async function fetchPage(url) {
  for (let attempt = 1; attempt <= 6; attempt++) {
    const res = await fetch(url, { signal: AbortSignal.timeout(15000) });
    if (res.status === 429) {
      const wait = 2000 * attempt;
      console.log(`Rate limit — esperando ${wait / 1000}s…`);
      await sleep(wait);
      continue;
    }
    if (!res.ok) throw new Error(`AscendAPI HTTP ${res.status} en ${url}`);
    return res.json();
  }
  throw new Error(`Rate limit persistente en ${url}`);
}

// ⚠️ El cursor de la API es CIRCULAR (nunca termina): hay que parar por total
// y deduplicar por exerciseId.
const byId = new Map();
let cursor = null;
let total = Infinity;
while (byId.size < total) {
  const url = `${BASE}?limit=100${cursor ? `&cursor=${cursor}` : ""}`;
  const { data, meta } = await fetchPage(url);
  total = meta.total;
  const before = byId.size;
  for (const ex of data) byId.set(ex.exerciseId, ex);
  if (byId.size === before) break; // página repetida: ya dimos la vuelta
  console.log(`Descargados: ${byId.size}/${total}`);
  cursor = meta.nextCursor;
  await sleep(600);
}
const all = [...byId.values()];
console.log(`Descarga completa: ${all.length} únicos`);

// 2) Mapear a filas de nuestra tabla
const unmapped = new Set();
const rows = all.map((ex) => {
  const target = ex.targetMuscles?.[0];
  const bodyPart = ex.bodyParts?.[0];
  let group = MUSCLE_GROUP[target] ?? BODYPART_GROUP[bodyPart];
  if (!group) {
    unmapped.add(`${target} / ${bodyPart}`);
    group = bodyPart ?? "otro";
  }
  return {
    name: ex.name,
    muscle_group: group,
    secondary_muscles: ex.secondaryMuscles ?? [],
    equipment: ex.equipments?.[0] ?? null,
    media_url: ex.gifUrl,
    media_type: "gif",
    instructions: ex.instructions ?? [],
    source_id: ex.exerciseId,
    is_custom: false,
  };
});

// 3) Upsert masivo por lotes (pocas queries, no una por fila)
const CHUNK = 200;
let imported = 0;
for (let i = 0; i < rows.length; i += CHUNK) {
  const chunk = rows.slice(i, i + CHUNK);
  await sql`
    insert into exercises ${sql(
      chunk,
      "name",
      "muscle_group",
      "secondary_muscles",
      "equipment",
      "media_url",
      "media_type",
      "instructions",
      "source_id",
      "is_custom",
    )}
    on conflict (source_id) do update set
      name = excluded.name,
      muscle_group = excluded.muscle_group,
      secondary_muscles = excluded.secondary_muscles,
      equipment = excluded.equipment,
      media_url = excluded.media_url,
      instructions = excluded.instructions`;
  imported += chunk.length;
  console.log(`Upsert: ${imported}/${rows.length}`);
}
if (unmapped.size) console.log("Sin mapeo (revisar):", [...unmapped]);

const groups = await sql`
  select muscle_group, count(*)::int as n from exercises
  where source_id is not null group by 1 order by n desc`;
console.table(groups.map((g) => ({ grupo: g.muscle_group, ejercicios: g.n })));

await sql.end();
