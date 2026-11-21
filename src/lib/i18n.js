import { readFileSync, readdirSync } from 'node:fs';

// Messages live in src/locales/<locale>.json, named after the Discord locale; keys are paths like "play.errors.noVoice"
export const DEFAULT_LOCALE = 'en-US';

const dir = new URL('../locales/', import.meta.url);

const messages = {};
export const languages = {};

for (const file of readdirSync(dir)) {
  if (!file.endsWith('.json')) continue;
  const locale = file.slice(0, -'.json'.length);
  messages[locale] = JSON.parse(readFileSync(new URL(file, dir), 'utf8'));
  languages[locale] = messages[locale].meta.name;
}

const lookup = (locale, key) => key.split('.').reduce((node, part) => node?.[part], messages[locale]);

const pluralRules = new Map();
const pluralForm = (locale, count) => {
  if (!pluralRules.has(locale)) pluralRules.set(locale, new Intl.PluralRules(locale));
  return pluralRules.get(locale).select(count);
};

// With a count, "key_one", "key_other"... are tried before "key"
function find(locale, key, count) {
  const forms = count === undefined ? [key] : [`${key}_${pluralForm(locale, count)}`, `${key}_other`, key];
  return forms.map((form) => lookup(locale, form)).find((value) => value !== undefined);
}

const warned = new Set();

export function t(locale, key, vars = {}) {
  let value = find(locale, key, vars.count) ?? find(DEFAULT_LOCALE, key, vars.count);
  if (Array.isArray(value)) value = value[Math.floor(Math.random() * value.length)];
  if (typeof value !== 'string') {
    if (!warned.has(key)) console.warn(`Missing translation: ${key}`);
    warned.add(key);
    return key;
  }
  return value.replace(/\{(\w+)\}/g, (placeholder, name) => (name in vars ? String(vars[name]) : placeholder));
}

export const translator = (locale) => (key, vars) => t(locale, key, vars);

export function localizations(key) {
  const result = {};
  for (const locale of Object.keys(messages)) {
    const value = locale === DEFAULT_LOCALE ? undefined : lookup(locale, key);
    if (typeof value === 'string') result[locale] = value;
  }
  return result;
}

export const describe = (builder, key) =>
  builder.setDescription(t(DEFAULT_LOCALE, `${key}.description`)).setDescriptionLocalizations(localizations(`${key}.description`));

export const localize = (option, key) =>
  describe(option.setName(t(DEFAULT_LOCALE, `${key}.name`)).setNameLocalizations(localizations(`${key}.name`)), key);

export const choice = (key, value) => ({ name: t(DEFAULT_LOCALE, key), name_localizations: localizations(key), value });
