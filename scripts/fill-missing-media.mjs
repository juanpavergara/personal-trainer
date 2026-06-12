// Llena media_url de los ejercicios del seed provisional (sin media) con
// imágenes estáticas de free-exercise-db (yuhonas, MIT, ~870 ejercicios).
// No toca la decisión pendiente del catálogo completo (ver AGENTS.md): solo
// cubre los 21 ejercicios sembrados por seed-exercises.mjs.
// Idempotente: solo actualiza filas globales con media_url null.
import postgres from "postgres";

process.loadEnvFile(".env.local");
const sql = postgres(process.env.DATABASE_URL_SESSION, { max: 1 });

const DATASET =
  "https://raw.githubusercontent.com/yuhonas/free-exercise-db/main/dist/exercises.json";
const IMG_BASE =
  "https://raw.githubusercontent.com/yuhonas/free-exercise-db/main/exercises/";

// Nombre en nuestro seed (español) → nombre exacto en free-exercise-db
const MATCHES = {
  "Press de banca con barra": "Barbell Bench Press - Medium Grip",
  "Press inclinado con mancuernas": "Incline Dumbbell Press",
  "Fondos en paralelas": "Dips - Chest Version",
  Dominadas: "Pullups",
  "Remo con barra": "Bent Over Barbell Row",
  "Jalón al pecho": "Wide-Grip Lat Pulldown",
  "Peso muerto convencional": "Barbell Deadlift",
  "Press militar con barra": "Standing Military Press",
  "Elevaciones laterales": "Side Lateral Raise",
  "Face pull": "Face Pull",
  "Curl de bíceps con barra": "Barbell Curl",
  "Curl alterno con mancuernas": "Dumbbell Alternate Bicep Curl",
  "Extensión de tríceps en polea": "Triceps Pushdown",
  "Press francés": "EZ-Bar Skullcrusher",
  "Sentadilla con barra": "Barbell Squat",
  "Prensa de piernas": "Leg Press",
  "Zancadas con mancuernas": "Dumbbell Lunges",
  "Peso muerto rumano": "Romanian Deadlift",
  "Curl femoral tumbado": "Lying Leg Curls",
  "Hip thrust con barra": "Barbell Hip Thrust",
  "Elevación de talones de pie": "Standing Calf Raises",
};

const res = await fetch(DATASET, { signal: AbortSignal.timeout(30000) });
if (!res.ok) throw new Error(`free-exercise-db HTTP ${res.status}`);
const dataset = await res.json();
const byName = new Map(dataset.map((e) => [e.name, e]));

let updated = 0;
for (const [esName, enName] of Object.entries(MATCHES)) {
  const match = byName.get(enName);
  if (!match?.images?.length) {
    console.log(`✗ Sin imagen en el dataset: ${esName} → ${enName}`);
    continue;
  }
  const url = IMG_BASE + match.images[0];
  const result = await sql`
    update exercises set media_url = ${url}, media_type = 'image'
    where name = ${esName} and owner_id is null and media_url is null`;
  if (result.count > 0) {
    updated += result.count;
    console.log(`✓ ${esName} → ${enName}`);
  }
}
console.log(`Actualizados: ${updated}`);

const [{ pending }] = await sql`
  select count(*)::int as pending from exercises
  where owner_id is null and media_url is null`;
console.log(`Ejercicios globales sin media restantes: ${pending}`);

await sql.end();
