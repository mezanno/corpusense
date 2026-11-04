type ExcelRow = Record<string, unknown>;

/**
 * Détermine si une valeur est une valeur primitive
 * directement exploitable dans une cellule Excel.
 */
function isPrimitive(value: unknown): boolean {
  return (
    value === null ||
    value === undefined ||
    typeof value === 'string' ||
    typeof value === 'number' ||
    typeof value === 'boolean'
  );
}

/**
 * Détermine si une valeur est un objet JSON classique.
 *
 * On exclut notamment les tableaux et les objets spéciaux.
 */
function isPlainObject(value: unknown): value is Record<string, unknown> {
  if (typeof value !== 'object' || value === null) {
    return false;
  }

  if (Array.isArray(value)) {
    return false;
  }

  const prototype = Object.getPrototypeOf(value) as unknown;

  return prototype === Object.prototype || prototype === null;
}

/**
 * Nettoie un nom destiné à devenir un nom de fichier.
 */
function sanitizeFilenamePart(value: string): string {
  return value
    .replace(/[<>:"/\\|?*\p{Cc}]/gu, '_')
    .replace(/\s+/g, ' ')
    .trim();
}

/**
 * Ajoute une valeur à toutes les lignes existantes.
 */
function addValueToRows(rows: ExcelRow[], key: string, value: unknown): ExcelRow[] {
  return rows.map((row) => ({
    ...row,
    [key]: value,
  }));
}

/**
 * Transforme un objet en une ou plusieurs lignes Excel.
 *
 * Plusieurs propriétés contenant des tableaux d'objets
 * produisent un produit cartésien.
 */
function flattenObject(value: Record<string, unknown>, prefix = ''): ExcelRow[] {
  let rows: ExcelRow[] = [{}];

  for (const [key, propertyValue] of Object.entries(value)) {
    const columnName = prefix ? `${prefix}.${key}` : key;

    // -----------------------------------------------------------------------
    // Tableau
    // -----------------------------------------------------------------------

    if (Array.isArray(propertyValue)) {
      if (propertyValue.length === 0) {
        rows = addValueToRows(rows, columnName, '');
        continue;
      }

      // Tableau de primitives
      if (propertyValue.every(isPrimitive)) {
        rows = addValueToRows(rows, columnName, propertyValue.join('; '));
        continue;
      }

      // Tableau d'objets
      if (propertyValue.every(isPlainObject)) {
        const expandedRows: ExcelRow[] = [];

        for (const row of rows) {
          for (const item of propertyValue) {
            const nestedRows = flattenObject(item, columnName);

            for (const nestedRow of nestedRows) {
              expandedRows.push({
                ...row,
                ...nestedRow,
              });
            }
          }
        }

        rows = expandedRows;
        continue;
      }

      // Tableau complexe / mixte
      rows = addValueToRows(rows, columnName, JSON.stringify(propertyValue));

      continue;
    }

    // -----------------------------------------------------------------------
    // Objet imbriqué
    // -----------------------------------------------------------------------

    if (isPlainObject(propertyValue)) {
      const nestedRows = flattenObject(propertyValue, columnName);

      const expandedRows: ExcelRow[] = [];

      for (const row of rows) {
        for (const nestedRow of nestedRows) {
          expandedRows.push({
            ...row,
            ...nestedRow,
          });
        }
      }

      rows = expandedRows;
      continue;
    }

    // -----------------------------------------------------------------------
    // Valeur simple
    // -----------------------------------------------------------------------

    rows = addValueToRows(rows, columnName, propertyValue);
  }

  return rows;
}

/**
 * Aplati les données extraites pour leur export Excel.
 *
 * Exemple :
 *
 * {
 *   entité: 'AGENOIS',
 *   intervention: [
 *     { libellé: 'A', page: 675 },
 *     { libellé: 'B', page: 679 },
 *   ],
 *   personne: [
 *     { nom: 'Dupont' },
 *     { nom: 'Martin' },
 *   ],
 * }
 *
 * devient 4 lignes :
 *
 * A / 675 / Dupont
 * A / 675 / Martin
 * B / 679 / Dupont
 * B / 679 / Martin
 */
function flattenForExcel(data: unknown[]): ExcelRow[] {
  return data.flatMap((item) => {
    if (!isPlainObject(item)) {
      return [] as ExcelRow[];
    }

    return flattenObject(item);
  });
}

export { flattenForExcel, sanitizeFilenamePart };
