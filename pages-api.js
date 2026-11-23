/* GitHub Pages adapter. The Python exporter supplies the public reading data. */
(() => {
  const data = window.SUSHI_PAGES_DATA;
  const contains = (text, query) =>
    String(text || "")
      .toLowerCase()
      .includes(query.toLowerCase());
  window.sushiStaticApi = (url) => {
    const request = new URL(url, "https://static.invalid");
    if (request.pathname === "/api/chapters") return data.chapters;
    if (request.pathname === "/api/stats") return data.stats;
    if (request.pathname.startsWith("/api/works/")) {
      const id = decodeURIComponent(
        request.pathname.slice("/api/works/".length),
      );
      if (!data.works[id]) throw Error("作品不存在");
      return data.works[id];
    }
    if (request.pathname !== "/api/search") throw Error("资料接口不存在");
    const params = request.searchParams;
    const q = (params.get("q") || "").trim();
    const place = (params.get("place") || "").trim();
    const kind = params.get("kind") || "all";
    const genre = params.get("genre") || "";
    const number = (key) => {
      const value = (params.get(key) || "").trim();
      if (!value) return null;
      if (!/^\d+$/.test(value)) throw Error("数值参数须为整数");
      return Number(value);
    };
    const chapter = number("chapter"),
      start = number("start"),
      end = number("end");
    let page = number("page") ?? 1;
    const pageSize = number("page_size") ?? 50;
    if (!["all", "work", "event", "person"].includes(kind))
      throw Error("资料类型无效");
    if (genre && !["诗", "词", "赋", "记", "文"].includes(genre))
      throw Error("作品类型无效");
    if (q.length > 100 || place.length > 50) throw Error("检索词过长");
    if (chapter !== null && (chapter < 1 || chapter > 10))
      throw Error("人生阶段须为1至10的整数");
    if ([start, end].some((y) => y !== null && (y < 1 || y > 9999)))
      throw Error("年份须为1至9999的整数");
    if (start !== null && end !== null && start > end)
      throw Error("起始年份不能晚于结束年份");
    if (page < 1 || page > 10000 || pageSize < 1 || pageSize > 100)
      throw Error("分页参数超出范围");
    const people = data.seed.persons.filter(
      (p) => contains(p.name, q) || contains(p.aliases, q),
    );
    const related = new Set(
      q
        ? data.seed.participants
            .filter((p) => people.some((person) => person.id === p.person_id))
            .map((p) => p.chapter_id)
        : [],
    );
    const within = (year) =>
      (start === null || year >= start) && (end === null || year <= end);
    const items = [];
    for (const original of data.items) {
      if (original.kind === "person") continue;
      if (kind !== "all" && kind !== original.kind) continue;
      if (genre && (original.kind !== "work" || original.genre !== genre))
        continue;
      if (chapter !== null && original.chapter_id !== chapter) continue;
      if (!within(original.year)) continue;
      const c = data.chapters.find((c) => c.id === original.chapter_id);
      const location =
        original.kind === "work"
          ? (data.works[original.id].review?.place ?? c.place)
          : original.place;
      if (place && !contains(location, place)) continue;
      if (
        q &&
        !contains(original.title, q) &&
        !(original.kind === "work" && contains(original.text, q)) &&
        !related.has(original.chapter_id)
      )
        continue;
      items.push({
        ...original,
        match_note: q
          ? related.has(original.chapter_id)
            ? "人物与该阶段有关；不代表人物就是作品写作对象"
            : "标题或正文匹配"
          : "",
      });
    }
    if ((kind === "all" || kind === "person") && !genre) {
      for (const person of people) {
        const refs = data.seed.participants
          .filter(
            (p) =>
              p.person_id === person.id &&
              (chapter === null || p.chapter_id === chapter) &&
              within(p.year),
          )
          .map((p) => ({
            ...data.chapters.find((c) => c.id === p.chapter_id),
            year: p.year,
          }))
          .filter((c) => !place || contains(c.place, place))
          .map((c) => ({ id: c.id, label: c.label, year: c.year }))
          .sort((a, b) => a.year - b.year);
        if (!refs.length) continue;
        items.push({
          kind: "person",
          id: person.id,
          title: person.name,
          year: refs[0].year,
          chapter_id: refs[0].id,
          chapter_label: refs[0].label,
          text: person.note,
          source: person.source,
          status: person.birth_status,
          chapters: refs,
        });
      }
    }
    const compare = (a, b) => (a < b ? -1 : a > b ? 1 : 0);
    items.sort(
      (a, b) =>
        a.year - b.year || compare(a.kind, b.kind) || compare(a.id, b.id),
    );
    const pages = Math.max(1, Math.ceil(items.length / pageSize));
    page = Math.min(page, pages);
    return {
      items: items.slice((page - 1) * pageSize, page * pageSize),
      total: items.length,
      page,
      pages,
      page_size: pageSize,
    };
  };
})();
