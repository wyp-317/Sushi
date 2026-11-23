const $ = (id) => document.getElementById(id);
let chapters = [],
  index = 0;
// Each chapter has one visual anchor. All quotations stay in their original order.
const keyVerses = [
  "“轼若为滂，母许之否乎？”",
  "人生到处知何似，应似飞鸿踏雪泥。",
  "欲把西湖比西子，淡妆浓抹总相宜。",
  "但愿人长久，千里共婵娟。",
  "与君世世为兄弟，更结人间未了因。",
  "竹杖芒鞋轻胜马，谁怕？一蓑烟雨任平生。",
  "一年好景君须记，最是橙黄橘绿时。",
  "日啖荔枝三百颗，不辞长作岭南人。",
  "小儿误喜朱颜在，一笑那知是酒红。",
  "问汝平生功业，黄州惠州儋州。",
];
// Apply the same year typography in headings, prose, cards and the catalogue.
// Only text nodes are replaced: navigation links and event handlers stay intact.
function formatYears() {
  for (const root of document.querySelectorAll(
    ".header, #main, #menu, #info, #explorer, #workReader",
  )) {
    const walker = document.createTreeWalker(root, NodeFilter.SHOW_TEXT);
    const nodes = [];
    while (walker.nextNode()) {
      const node = walker.currentNode;
      if (
        !node.parentElement.closest(".year, script, style") &&
        /\b(?:10\d{2}|110[01])\b/.test(node.textContent)
      )
        nodes.push(node);
    }
    for (const node of nodes) {
      const fragment = document.createDocumentFragment();
      const regex = /\b(?:10\d{2}|110[01])(?:[—–-](?:10\d{2}|110[01]))?年?/g;
      let end = 0;
      for (const match of node.textContent.matchAll(regex)) {
        fragment.append(
          document.createTextNode(node.textContent.slice(end, match.index)),
        );
        const year = document.createElement("span");
        year.className = "year";
        year.textContent = match[0];
        fragment.append(year);
        end = match.index + match[0].length;
      }
      fragment.append(document.createTextNode(node.textContent.slice(end)));
      node.replaceWith(fragment);
    }
  }
}
function navigate(next, scroll = true) {
  index = Math.max(0, Math.min(chapters.length - 1, next));
  const c = chapters[index];
  $("chapterLabel").textContent =
    `第 ${String(index + 1).padStart(2, "0")} 幕 / ${c.label}`;
  $("place").textContent = c.place;
  $("period").textContent = c.period;
  $("age").textContent = `${c.ageYear}年 · 苏轼${c.age_info.label}`;
  $("title").textContent = c.title;
  $("subtitle").textContent = c.subtitle;
  $("contextTitle").textContent = c.label;
  for (const name of ["event", "weight", "joy"]) $(name).textContent = c[name];
  $("poemTitle").textContent = c.poem;
  $("poemAuthor").textContent = index === 0 ? "《宋史》" : "苏轼";
  $("verse").replaceChildren(
    ...c.verse.split("\n").map((line) => {
      const span = document.createElement("span");
      span.className =
        line === keyVerses[index] ? "verse-line key-verse" : "verse-line";
      span.textContent = line || "\u00a0";
      return span;
    }),
  );
  const splitAt = c.event.indexOf("。") + 1;
  if (splitAt > 0) {
    const lead = document.createElement("strong");
    lead.className = "event-lead";
    lead.textContent = c.event.slice(0, splitAt);
    $("event").replaceChildren(
      lead,
      document.createTextNode(c.event.slice(splitAt)),
    );
  }
  $("expression").textContent = c.expression;
  $("readingText").textContent = c.reading;
  $("question").textContent = c.question;
  $("source").href = c.source;
  $("workCount").textContent = c.work_count
    ? `本阶段收录 ${c.work_count} 篇，读一读同一时期的不同心声。`
    : "少年时期暂未选录作品，可以从全部作品继续阅读。";
  $("moreWorks").textContent = c.work_count
    ? `查看本阶段全部 ${c.work_count} 篇作品 ↗`
    : "从后来的作品，继续认识他 ↗";
  const picks = c.recommendations || [];
  $("recommendationIntro").textContent = picks.length
    ? `选读 ${picks.length} 篇，看看这一阶段还有怎样的生活与心声。点击卡片打开原文。`
    : "少年篇先从史传认识他，后面的篇章再循着作品同行。";
  $("recommendedGrid").replaceChildren(
    ...picks.map((work) => {
      const card = element("button", undefined, "recommended-card");
      card.type = "button";
      card.append(
        element(
          "small",
          `${work.year}年 · 苏轼${work.age_info.label} · ${work.genre}${work.status === "provisional" ? " · 编年存疑" : ""}`,
        ),
      );
      card.append(element("h3", work.title));
      card.append(element("p", work.reason));
      card.append(element("span", "打开原文 →", "card-link"));
      card.onclick = () => showWork(work.id, work.reason);
      return card;
    }),
  );
  $("counter").textContent = `${String(index + 1).padStart(2, "0")} / 10`;
  $("prev").disabled = index === 0;
  $("next").querySelector("span:nth-child(2)").firstChild.textContent =
    index === 9 ? "再读一次人生" : "未来会怎样？";
  $("nextHint").textContent =
    index === 9
      ? "回到眉山，重新出发"
      : `走入第 ${String(index + 2).padStart(2, "0")} 幕`;
  $("people").replaceChildren(
    ...(c.people || []).map((person) =>
      element(
        "span",
        `${person.name} · ${person.year}年${person.age.label}`,
        "person",
      ),
    ),
  );
  $("weightSources").replaceChildren(
    ...(c.weightSources || []).map((ref) => {
      const a = document.createElement("a");
      a.href = ref.url;
      a.textContent = ref.title + " ↗";
      a.target = "_blank";
      a.rel = "noopener noreferrer";
      return a;
    }),
  );
  $("weightDetails").open = false;
  document.body.className =
    index === 4 || index === 5
      ? "season-night"
      : index >= 7
        ? "season-sea"
        : "";
  document.querySelectorAll(".dot").forEach((dot, i) => {
    dot.classList.toggle("active", i === index);
    dot.classList.toggle("done", i < index);
    dot.setAttribute("aria-current", i === index ? "step" : "false");
  });
  if (location.hash !== `#chapter-${index + 1}`)
    history.pushState(null, "", `#chapter-${index + 1}`);
  document.title = `${c.label} · 一蓑烟雨`;
  formatYears();
  if (scroll) {
    window.scrollTo({ top: 0, behavior: "instant" });
    $("main").focus({ preventScroll: true });
  }
}
function hashIndex() {
  const n = Number(location.hash.replace("#chapter-", ""));
  return Number.isInteger(n) && n >= 1 && n <= 10 ? n - 1 : 0;
}
async function init() {
  try {
    chapters = await api("/api/chapters");
    if (chapters.length !== 10) throw Error("章节数据不完整");
    chapters.forEach((c, i) => {
      const option = document.createElement("option");
      option.value = c.id;
      option.textContent = `第${c.id}幕 · ${c.label}`;
      $("searchChapter").append(option);
      const dot = document.createElement("button");
      dot.className = "dot";
      dot.title = `${i + 1} · ${c.label}`;
      dot.setAttribute("aria-label", `第${i + 1}幕：${c.label}`);
      dot.onclick = () => navigate(i);
      $("dots").append(dot);
      const button = document.createElement("button");
      const num = document.createElement("span");
      num.className = "chapter-number";
      num.textContent = String(i + 1).padStart(2, "0");
      const label = document.createElement("div");
      const b = document.createElement("b");
      b.textContent = c.label;
      const small = document.createElement("small");
      small.textContent = `${c.period} · ${c.place}`;
      label.append(b, small);
      button.append(num, label);
      button.onclick = () => {
        $("menu").close();
        navigate(i);
      };
      $("chaptersList").append(button);
    });
    navigate(hashIndex(), false);
  } catch (e) {
    $("subtitle").textContent = "长卷暂时未能展开。";
    $("error").hidden = false;
    $("error").textContent =
      `${e.message}。请通过 Python 服务打开，双击“启动苏轼网站.bat”，不要直接打开 HTML 文件。`;
    $("next").disabled = true;
  }
}
$("next").onclick = () => navigate(index === 9 ? 0 : index + 1);
$("prev").onclick = () => navigate(index - 1);
$("catalog").onclick = () => $("menu").showModal();
$("about").onclick = () => $("info").showModal();
document
  .querySelectorAll("dialog .close")
  .forEach((b) => (b.onclick = () => b.closest("dialog").close()));
document.querySelectorAll("dialog").forEach((d) =>
  d.addEventListener("click", (e) => {
    if (e.target === d) {
      const r = d.getBoundingClientRect();
      if (
        e.clientX < r.left ||
        e.clientX > r.right ||
        e.clientY < r.top ||
        e.clientY > r.bottom
      )
        d.close();
    }
  }),
);
window.addEventListener("hashchange", () => {
  if (chapters.length) navigate(hashIndex());
});
document.addEventListener("keydown", (e) => {
  if (
    document.querySelector("dialog[open]") ||
    ["INPUT", "TEXTAREA", "SELECT", "BUTTON", "SUMMARY"].includes(
      document.activeElement.tagName,
    ) ||
    e.altKey ||
    e.ctrlKey ||
    e.metaKey
  )
    return;
  if (e.key === "ArrowRight") {
    e.preventDefault();
    navigate(Math.min(9, index + 1));
  }
  if (e.key === "ArrowLeft") {
    e.preventDefault();
    navigate(index - 1);
  }
});
let searchVersion = 0;
let searchPage = 1,
  searchSignature = "";
function element(tag, text, className) {
  const node = document.createElement(tag);
  if (text !== undefined) node.textContent = text;
  if (className) node.className = className;
  return node;
}
function yearNote(text) {
  const paragraph = element("p", undefined, "library-note");
  paragraph.append(document.createTextNode("编年说明："));
  let end = 0;
  for (const match of text.matchAll(/https?:\/\/[^\s，。；）]+/g)) {
    paragraph.append(document.createTextNode(text.slice(end, match.index)));
    const link = element("a", "底本参照 ↗");
    link.href = match[0];
    link.target = "_blank";
    link.rel = "noopener noreferrer";
    paragraph.append(link);
    end = match.index + match[0].length;
  }
  paragraph.append(document.createTextNode(text.slice(end)));
  return paragraph;
}
async function api(url) {
  if (typeof window.sushiStaticApi === "function")
    return window.sushiStaticApi(url);
  let response;
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), 10000);
  let payload;
  try {
    response = await fetch(url, { signal: controller.signal });
    try {
      payload = await response.json();
    } catch {
      throw Error("资料服务返回了无法读取的内容，请重启网站后重试。");
    }
  } catch (error) {
    if (error.name === "AbortError")
      throw Error("检索等待时间过长，请稍后重试。");
    if (error instanceof TypeError)
      throw Error(
        "无法连接资料服务。请确认“启动苏轼Demo.bat”的运行窗口保持开启，然后重试。",
      );
    throw error;
  } finally {
    clearTimeout(timer);
  }
  if (!response.ok)
    throw Error(
      response.status >= 500
        ? "资料服务暂时出错，请重启网站后重试。"
        : payload.error || "检索请求未能完成，请检查条件后重试。",
    );
  return payload;
}
function searchNotice(message, retry = false) {
  $("searchStatus").textContent = message;
  $("searchNoticeText").textContent = message;
  $("retrySearch").hidden = !retry;
  if (!$("searchNotice").open) $("searchNotice").showModal();
}
$("retrySearch").onclick = () => {
  $("searchNotice").close();
  runSearch();
};
function chapterButton(id, label) {
  const button = element("button", label || "回到这一幕 →", "result-jump");
  button.type = "button";
  button.onclick = () => {
    document.querySelectorAll("dialog[open]").forEach((d) => d.close());
    navigate(chapters.findIndex((c) => c.id === id));
  };
  return button;
}
async function runSearch(page = 1) {
  const version = ++searchVersion;
  for (const id of ["searchStart", "searchEnd"]) {
    const input = $(id);
    if (
      input.validity.badInput ||
      (input.value &&
        (!/^\d+$/.test(input.value) ||
          Number(input.value) < 1 ||
          Number(input.value) > 9999))
    ) {
      searchNotice("年份请输入1至9999之间的整数；不知道的条件可以留空。");
      return;
    }
  }
  if (
    $("searchStart").value &&
    $("searchEnd").value &&
    Number($("searchStart").value) > Number($("searchEnd").value)
  ) {
    searchNotice("起始年份不能晚于结束年份，请调整后再检索。");
    return;
  }
  const params = new URLSearchParams();
  for (const [key, id] of [
    ["q", "searchQuery"],
    ["place", "searchPlace"],
    ["kind", "searchKind"],
    ["genre", "searchGenre"],
    ["chapter", "searchChapter"],
    ["start", "searchStart"],
    ["end", "searchEnd"],
  ]) {
    const value = $(id).value.trim();
    if (value) params.set(key, value);
  }
  const signature = params.toString();
  if (signature !== searchSignature) page = 1;
  searchSignature = signature;
  params.set("page", page);
  params.set("page_size", "12");
  document
    .querySelectorAll(".search-pagination button")
    .forEach((b) => (b.disabled = true));
  $("searchStatus").textContent = "正在查找……";
  $("searchResults").replaceChildren();
  try {
    const data = await api(`/api/search?${params}`);
    if (version !== searchVersion) return;
    searchPage = data.page;
    $("searchStatus").textContent = data.total
      ? `找到 ${data.total} 条资料 · 本页第 ${(data.page - 1) * data.page_size + 1}—${Math.min(data.page * data.page_size, data.total)} 条`
      : "没有匹配的资料，请试试其他关键词或放宽条件。";
    $("searchResults").replaceChildren(
      ...data.items.map((item) => {
        const card = element("article", undefined, "search-result");
        card.append(
          element(
            "small",
            `${{ work: "作品", event: "事件", person: "人物" }[item.kind]} · ${item.year}年${item.status === "provisional" ? "（编年待核）" : ""}${item.age_info ? ` · 苏轼${item.age_info.label}` : ""} · ${item.chapter_label}`,
          ),
        );
        card.append(element("h3", item.title));
        if (item.text && item.kind !== "work") {
          const excerpt = element(
            "p",
            item.text.length > 150 ? item.text.slice(0, 150) + "……" : item.text,
          );
          card.append(excerpt);
        }
        if (item.kind === "work") {
          const isExcerpt = item.text_scope === "excerpt";
          const reading = element("details", undefined, "work-reading");
          reading.append(
            element(
              "summary",
              isExcerpt ? "展开所选段落 · 节选" : "展开阅读全文",
            ),
          );
          reading.append(element("div", item.text, "work-original"));
          card.append(reading);
          if (item.year_note) card.append(yearNote(item.year_note));
          card.append(
            element(
              "p",
              `${item.genre} · ${item.status === "provisional" ? "编年待核" : "通行编年"} · ${item.note}`,
              "library-note",
            ),
          );
          for (const event of item.events)
            card.append(
              element(
                "p",
                `关联背景：${event.year}年 ${event.title}。${event.note}`,
                "library-note",
              ),
            );
        }
        if (item.match_note && item.match_note !== "按条件筛选")
          card.append(element("p", item.match_note, "library-note"));
        const actions = element("div", undefined, "result-actions");
        actions.append(chapterButton(item.chapter_id));
        if (item.kind === "work") {
          const read = element("button", "打开作品阅读 →", "result-jump");
          read.onclick = () => showWork(item.id);
          actions.prepend(read);
        }
        const source = element("a", "资料依据 ↗");
        source.href = item.source;
        source.target = "_blank";
        source.rel = "noopener noreferrer";
        actions.append(source);
        if (
          item.kind === "work" &&
          item.year_source &&
          item.year_source !== item.source
        ) {
          const yearSource = element("a", "编年依据 ↗");
          yearSource.href = item.year_source;
          yearSource.target = "_blank";
          yearSource.rel = "noopener noreferrer";
          actions.append(yearSource);
        }
        card.append(actions);
        return card;
      }),
    );
    document
      .querySelectorAll(".search-pagination")
      .forEach((nav) => (nav.hidden = data.pages <= 1));
    document
      .querySelectorAll(".page-label")
      .forEach(
        (label) => (label.textContent = `第 ${data.page} / ${data.pages} 页`),
      );
    document
      .querySelectorAll(".page-prev")
      .forEach((b) => (b.disabled = data.page <= 1));
    document
      .querySelectorAll(".page-next")
      .forEach((b) => (b.disabled = data.page >= data.pages));
    formatYears();
    if (!data.total)
      searchNotice(
        "没有找到符合条件的资料。可以只保留年份或地点等一个条件，或点击“清空条件”重新查找。",
      );
  } catch (error) {
    if (version === searchVersion) {
      document
        .querySelectorAll(".search-pagination")
        .forEach((nav) => (nav.hidden = true));
      searchNotice(
        /[\u4e00-\u9fff]/.test(error.message)
          ? error.message
          : "检索暂时未能完成，请稍后重试。",
        true,
      );
    }
  }
}
async function openExplorer() {
  $("explorer").showModal();
  runSearch();
  try {
    const s = await api("/api/stats");
    $("libraryStats").textContent =
      `当前收录 ${s.persons} 位人物、${s.events} 条事件、${s.works} 篇作品。资料与十幕叙事关联，尚非完整苏轼全集。`;
  } catch (e) {
    $("libraryStats").textContent = e.message;
  }
}
$("explore").onclick = () => {
  $("searchForm").reset();
  openExplorer();
};
$("moreWorks").onclick = () => {
  $("searchForm").reset();
  $("searchKind").value = "work";
  $("searchChapter").value = chapters[index].work_count
    ? chapters[index].id
    : "";
  openExplorer();
};
$("searchForm").onsubmit = (e) => {
  e.preventDefault();
  runSearch();
};
$("searchForm").onreset = () => {
  ++searchVersion;
  searchPage = 1;
  searchSignature = "";
  document
    .querySelectorAll(".search-pagination")
    .forEach((nav) => (nav.hidden = true));
  $("searchResults").replaceChildren();
  $("searchStatus").textContent = "条件已清空，请重新查找。";
};
document.querySelectorAll(".page-prev").forEach(
  (b) =>
    (b.onclick = async () => {
      await runSearch(searchPage - 1);
      $("searchStatus").scrollIntoView({ block: "start" });
    }),
);
document.querySelectorAll(".page-next").forEach(
  (b) =>
    (b.onclick = async () => {
      await runSearch(searchPage + 1);
      $("searchStatus").scrollIntoView({ block: "start" });
    }),
);
$("explorer").addEventListener("close", () => {
  ++searchVersion;
});
init();

let readerVersion = 0;
async function showWork(id, reason = "") {
  const version = ++readerVersion;
  $("readerTitle").textContent = "正在展开作品……";
  for (const field of [
    "readerMeta",
    "readerOriginal",
    "readerBackground",
    "readerInterpretation",
    "readerReview",
    "readerScope",
  ])
    $(field).textContent = "";
  $("readerReason").textContent = reason;
  $("readerReason").hidden = !reason;
  $("readerSources").replaceChildren();
  $("workReader").querySelector("details").open = false;
  if (!$("workReader").open) $("workReader").showModal();
  $("workReader").scrollTop = 0;
  try {
    const w = await api(`/api/works/${encodeURIComponent(id)}`);
    if (version !== readerVersion) return;
    $("readerTitle").textContent = w.title;
    $("readerMeta").textContent =
      `${w.year}年 · 苏轼${w.age_info.label} · ${w.review?.place || "写作地点待核"} · ${w.genre}${w.status === "provisional" ? " · 编年存疑，见依据说明" : ""}`;
    $("readerScope").textContent =
      w.text_scope === "excerpt"
        ? "本条收录节选；完整篇章可通过下方原文来源阅读。"
        : "本条收录所列标题范围的全文。";
    $("readerOriginal").textContent = w.text;
    $("readerBackground").textContent =
      w.review?.background ||
      "本条尚未完成逐篇背景复核，以下阅读提示与来源供进一步查阅。";
    $("readerInterpretation").textContent = w.note;
    $("readerReview").textContent = w.review
      ? `${w.review.review_date}复核：${w.year_note} ${w.review.review_note}`
      : w.year_note;
    const refs = [
      { title: "原文来源", url: w.source, evidence: "原文与收录范围。" },
      ...(w.review?.refs || [
        { title: "编年依据", url: w.year_source, evidence: w.year_note },
      ]),
    ];
    $("readerSources").replaceChildren(
      ...refs.map((ref) => {
        const p = element("p");
        const link = element("a", ref.title + " ↗");
        link.href = ref.url;
        link.target = "_blank";
        link.rel = "noopener noreferrer";
        p.append(link, element("span", " · " + ref.evidence));
        return p;
      }),
    );
    formatYears();
  } catch (error) {
    if (version === readerVersion) {
      $("readerTitle").textContent = "作品暂时无法展开";
      $("readerMeta").textContent = error.message;
    }
  }
}
$("workReader").addEventListener("close", () => {
  ++readerVersion;
});
