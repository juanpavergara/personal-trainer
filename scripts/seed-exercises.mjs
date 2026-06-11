// Seed mínimo del catálogo global de ejercicios (owner_id null).
// Provisional hasta la importación completa desde AscendAPI (ver ADR-007).
// Idempotente: no inserta si ya existen ejercicios globales.
import postgres from "postgres";

process.loadEnvFile(".env.local");
const sql = postgres(process.env.DATABASE_URL_SESSION, { max: 1 });

const EXERCISES = [
  ["Press de banca con barra", "pecho", "barra"],
  ["Press inclinado con mancuernas", "pecho", "mancuernas"],
  ["Fondos en paralelas", "pecho", "peso corporal"],
  ["Dominadas", "espalda", "peso corporal"],
  ["Remo con barra", "espalda", "barra"],
  ["Jalón al pecho", "espalda", "polea"],
  ["Peso muerto convencional", "espalda", "barra"],
  ["Press militar con barra", "hombros", "barra"],
  ["Elevaciones laterales", "hombros", "mancuernas"],
  ["Face pull", "hombros", "polea"],
  ["Curl de bíceps con barra", "bíceps", "barra"],
  ["Curl alterno con mancuernas", "bíceps", "mancuernas"],
  ["Extensión de tríceps en polea", "tríceps", "polea"],
  ["Press francés", "tríceps", "barra"],
  ["Sentadilla con barra", "cuádriceps", "barra"],
  ["Prensa de piernas", "cuádriceps", "máquina"],
  ["Zancadas con mancuernas", "cuádriceps", "mancuernas"],
  ["Peso muerto rumano", "isquiotibiales", "barra"],
  ["Curl femoral tumbado", "isquiotibiales", "máquina"],
  ["Hip thrust con barra", "glúteos", "barra"],
  ["Elevación de talones de pie", "pantorrillas", "máquina"],
];

const [{ count }] =
  await sql`select count(*)::int as count from exercises where owner_id is null`;

if (count > 0) {
  console.log(`Catálogo global ya tiene ${count} ejercicios — no se siembra.`);
} else {
  for (const [name, muscleGroup, equipment] of EXERCISES) {
    await sql`insert into exercises (name, muscle_group, equipment, is_custom)
              values (${name}, ${muscleGroup}, ${equipment}, false)`;
  }
  console.log(`Sembrados ${EXERCISES.length} ejercicios globales.`);
}

await sql.end();
