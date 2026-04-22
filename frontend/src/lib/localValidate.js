export function localValidate(exercise, raw) {
  const type = exercise?.input_type
  const expected = exercise?.answer

  if (type === "decomposition") {
    const parts = exercise?.params?.parts || {}
    let submitted = {}
    try { submitted = JSON.parse(raw) } catch { /* ignore */ }
    const ok = Object.keys(parts).every(
      (k) => Number(parts[k]) === Number(submitted?.[k] ?? 0),
    )
    return { ok, expected }
  }

  if (type === "drag_order") {
    const expectedArr = exercise?.params?.correct_order || expected
    let submitted = []
    try { submitted = JSON.parse(raw) } catch { /* ignore */ }
    const ok = JSON.stringify(expectedArr) === JSON.stringify(submitted)
    return { ok, expected: expectedArr }
  }

  if (type === "point_on_line" || type === "number") {
    const norm = (v) => String(v).trim().replace(",", ".")
    return { ok: norm(expected) === norm(raw), expected }
  }

  if (type === "mcq_multi") {
    const expectedArr = Array.isArray(expected) ? expected : [expected]
    let picked = []
    try { picked = JSON.parse(raw) } catch { /* ignore */ }
    const same = expectedArr.length === picked.length
      && expectedArr.every((v) => picked.includes(v))
    return { ok: same, expected: expectedArr }
  }

  return { ok: String(expected) === String(raw), expected }
}
