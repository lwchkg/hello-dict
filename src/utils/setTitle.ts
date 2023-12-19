export function setTitleWithPrefix(prefix?: string): void {
  const newTitle = prefix
    ? `${prefix} - Hello Dict`
    : "Hello Dict - free dictionary";
  if (newTitle !== document.title) document.title = newTitle;
}
