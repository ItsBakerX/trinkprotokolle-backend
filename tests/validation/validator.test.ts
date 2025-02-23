import validator from 'validator';

/**
 * Die folgenden Tests wurden erstellt, da die Dokumentation von express-validator bzw. dem 
 * zugrunde liegenden Paket validator nicht ausreichend war.
 * 
 * Aus den Tests lernen wir, dass isDate nicht mit variabler Anzahl Stellen von Tagen und Monaten umgehen kann.
 * D.h. entweder werden Tag (und Monat) einstellig definiert oder zweistellig. Einstellig ist natürlich nicht
 * möglich. Daher definieren wir Tag und Monat hier zweistellig. Und wir definieren für unsere Anwendung, 
 * dass Tag und Monat immer zweistellig, ggf. mit führender Null, dargestellt werden. Wenn wir das anders
 * haben wollen würden, müssten wir einen eigenen Validator schreiben.
 */

test("isDate: ok", async () => {
    expect(validator.isDate("01.01.2021", { format: "DD.MM.YYYY", delimiters: ["."] } )).toBeTruthy();
});

test("isDate: ok mit Tag und Monat", async () => {
    expect(validator.isDate("31.12.2021", { format: "DD.MM.YYYY", delimiters: ["."] } )).toBeTruthy();
});

test("isDate: falsch, wenn Tag nur einstellig", async () => {
    expect(validator.isDate("1.12.2021", { format: "DD.MM.YYYY", delimiters: ["."] } )).toBeFalsy();
});

test("isDate: ok, wenn Tag nur einstellig", async () => {
    expect(validator.isDate("1.12.2021", { format: "D.MM.YYYY", delimiters: ["."] } )).toBeTruthy();
});

test("isDate: falsch, wenn Tag nur einstellig definiert aber zweistellig ist", async () => {
    expect(validator.isDate("10.12.2021", { format: "D.MM.YYYY", delimiters: ["."] } )).toBeFalsy();
});

test("isDate: falsch, Tag und Monat vertauscht", async () => {
    expect(validator.isDate("12.31.2021", { format: "DD.MM.YYYY", delimiters: ["."] } )).toBeFalsy();
});

test("isDate: delimiters vergessen", async () => {
    expect(()=>validator.isDate("01.01.2021", { format: "DD.MM.YYYY" } )).toThrow()
});