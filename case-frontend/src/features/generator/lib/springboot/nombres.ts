/** Helpers de nombres (Pascal/camel/snake/kebab/plural) y mapeo de tipos SQL → Java. Parte de `springBootGenerator.ts`. */

export const BASE_PACKAGE = "com.casetool.generated"
export const BASE_PATH = "src/main/java/com/casetool/generated/"

// --- Helpers de nombres y tipos ---

export function toPascalCase(s?: string | null): string {
  if (!s || !s.trim()) return "Item"
  return s
    .trim()
    .split(/[_-\s]+/)
    .filter(Boolean)
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1).toLowerCase())
    .join("") || "Item"
}

export function toCamelCase(s?: string | null): string {
  const pascal = toPascalCase(s)
  return pascal.charAt(0).toLowerCase() + pascal.slice(1)
}

export function toSnakeCase(s?: string | null): string {
  if (!s || !s.trim()) return "item"
  return s
    .trim()
    .replace(/([a-z])([A-Z])/g, "$1_$2")
    .replace(/[_-\s]+/g, "_")
    .toLowerCase()
}

export function toPlural(s: string): string {
  if (!s) return "items"
  const lower = s.toLowerCase()
  if (lower.endsWith("s") || lower.endsWith("x") || lower.endsWith("z")) {
    return `${s}es`
  }
  if (/[aeiouáéíóú]$/i.test(lower)) {
    return `${s}s`
  }
  return `${s}es`
}

export function toKebabCase(s?: string | null): string {
  if (!s || !s.trim()) return "items"
  const normalized = s.trim().replace(/[_-\s]+/g, "-").toLowerCase()
  return normalized.endsWith("s") ? normalized : `${normalized}s`
}

export function sanitizarNombre(s?: string | null): string {
  if (!s || !s.trim()) return "casetool-backend"
  const cleaned = s
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
  return cleaned || "casetool-backend"
}

export function toJavaType(sqlType?: string | null): string {
  if (!sqlType) return "String"
  const s = sqlType.toUpperCase().trim()
  if (s.includes("BIGINT") || s.includes("BIGSERIAL")) return "Long"
  if (s.includes("INT") || s.includes("SERIAL")) return "Integer"
  if (s.includes("BOOL")) return "Boolean"
  if (s.includes("DECIMAL") || s.includes("NUMERIC")) return "BigDecimal"
  if (s.includes("FLOAT") || s.includes("DOUBLE") || s.includes("REAL")) return "Double"
  if (s.includes("TIMESTAMP") || s.includes("DATETIME")) return "LocalDateTime"
  if (s.includes("DATE")) return "LocalDate"
  if (s.includes("TIME")) return "LocalTime"
  if (s.includes("CHAR") || s.includes("TEXT") || s.includes("STRING") || s.includes("VARCHAR")) return "String"
  return "String"
}

export function normalizeIdentifier(str?: string | null): string {
  if (!str) return ""
  return str
    .toLowerCase()
    .replace(/[^a-z0-9]/g, "")
    .replace(/^id/, "")
    .replace(/id$/, "")
    .replace(/s$/, "")
    .replace(/e$/, "")
}

export function isSameForeignKey(attrName: string, relFieldName: string, relColName: string): boolean {
  const normAttr = normalizeIdentifier(attrName)
  const normField = normalizeIdentifier(relFieldName)
  const normCol = normalizeIdentifier(relColName)
  if (!normAttr || (!normField && !normCol)) return false
  return normAttr === normField || normAttr === normCol
}
