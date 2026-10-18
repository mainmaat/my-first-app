const STORAGE_KEY = "teacherJobs.v1";
const SOON_DAYS = 14;

const sources = [
  {
    name: "東京私学ドットコム",
    desc: "東京私立中学高等学校協会。加盟校一覧から各校サイトへ",
    url: "https://www.tokyoshigaku.com/",
  },
  {
    name: "神奈川私学（kanagaku.com）",
    desc: "神奈川県私立中学高等学校協会。加盟校一覧から各校サイトへ",
    url: "https://kanagaku.com/",
  },
  {
    name: "ハローワークインターネットサービス",
    desc: "学校法人の求人も掲載。「教員」「講師」で検索",
    url: "https://www.hellowork.mhlw.go.jp/",
  },
];

const els = {
  pref: document.getElementById("f-pref"),
  level: document.getElementById("f-level"),
  subject: document.getElementById("f-subject"),
  type: document.getElementById("f-type"),
  open: document.getElementById("f-open"),
  searchLinks: document.getElementById("search-links"),
  sourceLinks: document.getElementById("source-links"),
  form: document.getElementById("job-form"),
  submit: document.getElementById("j-submit"),
  cancel: document.getElementById("j-cancel"),
  list: document.getElementById("job-list"),
  count: document.getElementById("count"),
  exportBtn: document.getElementById("export"),
  importInput: document.getElementById("import"),
};

const fields = ["id", "school", "pref", "city", "level", "subject", "type", "deadline", "status", "url", "memo"];

let jobs = loadJobs();

function loadJobs() {
  try {
    const data = JSON.parse(localStorage.getItem(STORAGE_KEY));
    return Array.isArray(data) ? data : [];
  } catch (e) {
    return [];
  }
}

function saveJobs() {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(jobs));
  } catch (e) {
    alert("保存できませんでした。ブラウザの設定を確認してください。");
  }
}

function filters() {
  return {
    pref: els.pref.value,
    level: els.level.value,
    subject: els.subject.value,
    type: els.type.value,
    openOnly: els.open.checked,
  };
}

function today() {
  const d = new Date();
  d.setHours(0, 0, 0, 0);
  return d;
}

function daysLeft(deadline) {
  if (!deadline) return null;
  const d = new Date(deadline + "T00:00:00");
  return Math.round((d - today()) / 86400000);
}

function link(name, desc, url) {
  const a = document.createElement("a");
  a.className = "link-card";
  a.href = url;
  a.target = "_blank";
  a.rel = "noopener noreferrer";
  const strong = document.createElement("strong");
  strong.textContent = name;
  const span = document.createElement("span");
  span.textContent = desc;
  a.append(strong, span);
  return a;
}

function renderSearchLinks() {
  const f = filters();
  const prefs = f.pref ? [f.pref] : ["東京都", "神奈川県"];
  const words = ["私立", f.level || "中学 高校", "教員募集", f.subject, f.type].filter(Boolean).join(" ");

  els.searchLinks.replaceChildren();
  for (const pref of prefs) {
    const indeedQ = ["私立", f.level || "中学 高校", f.subject, f.type || "教員"].filter(Boolean).join(" ");
    els.searchLinks.append(
      link(
        `Google：${pref}の募集要項`,
        `${pref} ${words}`,
        "https://www.google.com/search?q=" + encodeURIComponent(`${pref} ${words} 募集要項`)
      ),
      link(
        `Indeed：${pref}`,
        indeedQ,
        "https://jp.indeed.com/jobs?q=" + encodeURIComponent(indeedQ) + "&l=" + encodeURIComponent(pref)
      )
    );
  }
}

function renderSources() {
  els.sourceLinks.replaceChildren(...sources.map((s) => link(s.name, s.desc, s.url)));
}

function matches(job, f) {
  if (f.pref && job.pref !== f.pref) return false;
  if (f.level && job.level !== f.level) return false;
  if (f.subject && job.subject !== f.subject) return false;
  if (f.type && job.type !== f.type) return false;
  if (f.openOnly) {
    const left = daysLeft(job.deadline);
    if (left !== null && left < 0) return false;
  }
  return true;
}

function byDeadline(a, b) {
  if (!a.deadline) return 1;
  if (!b.deadline) return -1;
  return a.deadline.localeCompare(b.deadline);
}

function renderJobs() {
  const f = filters();
  const visible = jobs.filter((j) => matches(j, f)).sort(byDeadline);
  els.count.textContent = `${visible.length}件 / 全${jobs.length}件`;
  els.list.replaceChildren();

  if (visible.length === 0) {
    const p = document.createElement("p");
    p.className = "empty";
    p.textContent = jobs.length === 0
      ? "まだ記録がありません。上のリンクで募集を見つけたら追加してください。"
      : "条件に合う募集はありません。";
    els.list.append(p);
    return;
  }

  for (const job of visible) {
    els.list.append(jobCard(job));
  }
}

function jobCard(job) {
  const left = daysLeft(job.deadline);
  const card = document.createElement("article");
  card.className = "job";
  if (left !== null && left < 0) card.classList.add("closed");
  else if (left !== null && left <= SOON_DAYS) card.classList.add("soon");

  const title = document.createElement("div");
  title.className = "job-title";
  const name = document.createElement("strong");
  name.textContent = job.school;
  const deadline = document.createElement("span");
  deadline.className = "deadline";
  if (left === null) deadline.textContent = "締切未登録";
  else if (left < 0) deadline.textContent = `締切済み（${job.deadline}）`;
  else if (left === 0) deadline.textContent = `今日締切（${job.deadline}）`;
  else deadline.textContent = `締切 ${job.deadline}（あと${left}日）`;
  title.append(name, deadline);

  const tags = document.createElement("div");
  tags.className = "tags";
  const place = [job.pref, job.city].filter(Boolean).join(" ");
  for (const t of [place, job.level, job.subject, job.type]) {
    const s = document.createElement("span");
    s.className = "tag";
    s.textContent = t;
    tags.append(s);
  }
  const status = document.createElement("span");
  status.className = "tag status";
  status.textContent = job.status;
  tags.append(status);

  card.append(title, tags);

  if (job.memo) {
    const memo = document.createElement("p");
    memo.className = "memo";
    memo.textContent = job.memo;
    card.append(memo);
  }

  const actions = document.createElement("div");
  actions.className = "job-actions";
  if (job.url) {
    const a = document.createElement("a");
    a.href = job.url;
    a.target = "_blank";
    a.rel = "noopener noreferrer";
    a.textContent = "募集要項を開く";
    actions.append(a);
  }
  const edit = document.createElement("button");
  edit.type = "button";
  edit.className = "secondary";
  edit.textContent = "編集";
  edit.addEventListener("click", () => startEdit(job.id));
  const del = document.createElement("button");
  del.type = "button";
  del.className = "danger";
  del.textContent = "削除";
  del.addEventListener("click", () => removeJob(job.id));
  actions.append(edit, del);
  card.append(actions);

  return card;
}

function formValue(name) {
  return document.getElementById("j-" + name).value.trim();
}

function setFormValue(name, value) {
  document.getElementById("j-" + name).value = value || "";
}

function resetForm() {
  els.form.reset();
  setFormValue("id", "");
  els.submit.textContent = "追加する";
  els.cancel.hidden = true;
}

function startEdit(id) {
  const job = jobs.find((j) => j.id === id);
  if (!job) return;
  for (const name of fields) setFormValue(name, job[name]);
  els.submit.textContent = "更新する";
  els.cancel.hidden = false;
  els.form.scrollIntoView({ behavior: "smooth" });
}

function removeJob(id) {
  const job = jobs.find((j) => j.id === id);
  if (!job || !confirm(`「${job.school}」の記録を削除しますか？`)) return;
  jobs = jobs.filter((j) => j.id !== id);
  saveJobs();
  renderJobs();
}

els.form.addEventListener("submit", (e) => {
  e.preventDefault();
  const job = {};
  for (const name of fields) job[name] = formValue(name);
  if (job.id) {
    jobs = jobs.map((j) => (j.id === job.id ? job : j));
  } else {
    job.id = Date.now().toString(36) + Math.random().toString(36).slice(2, 6);
    jobs.push(job);
  }
  saveJobs();
  resetForm();
  renderJobs();
});

els.cancel.addEventListener("click", resetForm);

for (const el of [els.pref, els.level, els.subject, els.type, els.open]) {
  el.addEventListener("change", () => {
    renderSearchLinks();
    renderJobs();
  });
}

els.exportBtn.addEventListener("click", () => {
  const blob = new Blob([JSON.stringify(jobs, null, 2)], { type: "application/json" });
  const a = document.createElement("a");
  a.href = URL.createObjectURL(blob);
  a.download = "teacher-jobs.json";
  a.click();
  URL.revokeObjectURL(a.href);
});

els.importInput.addEventListener("change", async () => {
  const file = els.importInput.files[0];
  if (!file) return;
  try {
    const data = JSON.parse(await file.text());
    if (!Array.isArray(data)) throw new Error("not array");
    const ids = new Set(jobs.map((j) => j.id));
    const added = data.filter((j) => j && j.school && j.id && !ids.has(j.id));
    jobs = jobs.concat(added);
    saveJobs();
    renderJobs();
    alert(`${added.length}件を読み込みました。`);
  } catch (e) {
    alert("読み込めませんでした。このアプリで書き出したJSONを選んでください。");
  }
  els.importInput.value = "";
});

renderSources();
renderSearchLinks();
renderJobs();
