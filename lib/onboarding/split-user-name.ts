export const splitUserName = (fullName?: string | null) => {
  const trimmed = fullName?.trim() ?? ""

  if (!trimmed) {
    return {
      given_name: null,
      family_name: null,
    }
  }

  const [given_name, ...rest] = trimmed.split(/\s+/)

  return {
    given_name: given_name ?? null,
    family_name: rest.length ? rest.join(" ") : null,
  }
}
