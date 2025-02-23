export function dateToString(date: Date) {
    return date.toLocaleDateString("de-DE", {day: "2-digit", month: "2-digit", year: "numeric"});
}

export function stringToDate(dateString: string) {
    const parts = dateString.split('.');
    return new Date(`${parts[2]}-${parts[1]}-${parts[0]}Z`);
}
