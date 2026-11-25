const pluralRules = new Intl.PluralRules('en-US');

export function pluralize(count: number, singular: string, plural: string): string {
  const forms: Record<string, string> = { one: singular, other: plural };
  return `${count} ${forms[pluralRules.select(count)] ?? plural}`;
}

export function formatUnits(count: number): string {
  return pluralize(count, 'time unit', 'time units');
}
