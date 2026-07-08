import { readFileSync } from "fs";
import { dirname, join } from "path";
import { fileURLToPath } from "url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const KAFKA_UPDATES_PATH = join(__dirname, "..", "..", "data", "kafka-updates.json");

export function fetchKafkaUpdates() {
  const raw = readFileSync(KAFKA_UPDATES_PATH, "utf-8");
  return JSON.parse(raw);
}
