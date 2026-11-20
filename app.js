const defaultStudents = [
  {
    serial: "0001",
    name: "Garagara",
    phone: "0175014811",
    email: "garagara765@gmail.com",
    identification: "310434470"
  },
  {
    serial: "0002",
    name: "Barasa",
    phone: "071234567",
    email: "barasa543@gmail.com",
    identification: ""
  }
];

const storageKey = "campusdesk-students";
let students = loadStudents();

const elements = {
  rows: document.querySelector("#studentRows"),
  empty: document.querySelector("#emptyState"),
  search: document.querySelector("#searchInput"),
  sort: document.querySelector("#sortSelect"),
  total: document.querySelector("#totalStudents"),
  shown: document.querySelector("#shownStudents"),
  dialog: document.querySelector("#studentDialog"),
  form: document.querySelector("#studentForm"),
  toast: document.querySelector("#toast"),
  sidebar: document.querySelector(".sidebar")
};

function loadStudents() {
  try {
    const saved = JSON.parse(localStorage.getItem(storageKey));
    if (!Array.isArray(saved)) return defaultStudents;
    return saved
      .filter(student => student && typeof student === "object")
      .map(student => ({
        serial: String(student.serial ?? ""),
        name: String(student.name ?? ""),
        phone: String(student.phone ?? ""),
        email: String(student.email ?? ""),
        identification: String(student.identification ?? "")
      }))
      .filter(student => student.serial && student.name);
  } catch {
    return defaultStudents;
  }
}

function saveStudents() {
  try {
    localStorage.setItem(storageKey, JSON.stringify(students));
  } catch {
    showToast("Your browser could not save this record.");
  }
}

function escapeHtml(value) {
  return String(value ?? "").replace(/[&<>"']/g, character => ({
    "&": "&amp;",
    "<": "&lt;",
    ">": "&gt;",
    '"': "&quot;",
    "'": "&#039;"
  })[character]);
}

function initials(name) {
  return name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map(part => part[0].toUpperCase())
    .join("") || "?";
}

function filteredStudents() {
  const query = elements.search.value.trim().toLowerCase();
  const filtered = students.filter(student =>
    [student.serial, student.name, student.phone, student.email, student.identification]
      .some(value => String(value ?? "").toLowerCase().includes(query))
  );

  return filtered.sort((a, b) => {
    if (elements.sort.value === "serial") {
      return String(a.serial).localeCompare(String(b.serial), undefined, { numeric: true });
    }
    return String(a.name).localeCompare(String(b.name), undefined, { sensitivity: "base" });
  });
}

function render() {
  const visible = filteredStudents();
  elements.total.textContent = students.length;
  elements.shown.textContent = visible.length;
  elements.rows.innerHTML = visible.map(student => `
    <tr>
      <td>
        <div class="student-cell">
          <span class="avatar" aria-hidden="true">${escapeHtml(initials(student.name))}</span>
          <div>
            <span class="student-name">${escapeHtml(student.name)}</span>
            <span class="student-id">ID ${escapeHtml(student.serial)}</span>
          </div>
        </div>
      </td>
      <td>${escapeHtml(student.phone)}</td>
      <td>${escapeHtml(student.email)}</td>
      <td>${escapeHtml(student.identification || "—")}</td>
    </tr>
  `).join("");
  elements.empty.hidden = visible.length !== 0;
  document.querySelector("table").hidden = visible.length === 0;
}

function showToast(message) {
  elements.toast.textContent = message;
  elements.toast.classList.add("show");
  window.clearTimeout(showToast.timeout);
  showToast.timeout = window.setTimeout(() => elements.toast.classList.remove("show"), 2600);
}

function validateForm() {
  let valid = true;
  const fields = [...elements.form.querySelectorAll("input")];

  fields.forEach(field => {
    const error = field.parentElement.querySelector(".field-error");
    field.classList.remove("invalid");
    error.textContent = "";

    let message = "";
    if (!field.value.trim()) message = "This field is required.";
    if (field.name === "email" && field.value && !field.validity.valid) {
      message = "Enter a valid email address.";
    }

    if (message) {
      valid = false;
      field.classList.add("invalid");
      error.textContent = message;
    }
  });

  if (valid) {
    const data = Object.fromEntries(new FormData(elements.form));
    const duplicate = students.some(student =>
      student.serial.toLowerCase() === data.serial.trim().toLowerCase()
    );
    if (duplicate) {
      const serialField = elements.form.elements.serial;
      serialField.classList.add("invalid");
      serialField.parentElement.querySelector(".field-error").textContent = "This student ID already exists.";
      return false;
    }
  }

  return valid;
}

document.querySelector("#openAddStudent").addEventListener("click", () => {
  elements.form.reset();
  elements.form.querySelectorAll(".field-error").forEach(error => { error.textContent = ""; });
  elements.form.querySelectorAll("input").forEach(input => input.classList.remove("invalid"));
  elements.dialog.showModal();
  elements.form.elements.serial.focus();
});

function closeDialog() {
  elements.dialog.close();
}

document.querySelector("#closeDialog").addEventListener("click", closeDialog);
document.querySelector("#cancelDialog").addEventListener("click", closeDialog);
elements.dialog.addEventListener("click", event => {
  if (event.target === elements.dialog) closeDialog();
});

elements.form.addEventListener("submit", event => {
  event.preventDefault();
  if (!validateForm()) return;

  const data = Object.fromEntries(new FormData(elements.form));
  students.push({
    serial: data.serial.trim(),
    name: data.name.trim(),
    phone: data.phone.trim(),
    email: data.email.trim(),
    identification: data.identification.trim()
  });
  saveStudents();
  elements.search.value = "";
  closeDialog();
  render();
  showToast("Student record saved.");
});

elements.search.addEventListener("input", render);
elements.sort.addEventListener("change", render);

document.querySelector("#exportButton").addEventListener("click", () => {
  const visible = filteredStudents();
  if (!visible.length) {
    showToast("No records to export.");
    return;
  }
  const headers = ["Serial No", "User Name", "Phone", "Email Address", "Identification"];
  const csvValue = value => {
    let text = String(value ?? "");
    if (/^[=+\-@]/.test(text)) text = `'${text}`;
    return `"${text.replace(/"/g, '""')}"`;
  };
  const rows = visible.map(student =>
    [student.serial, student.name, student.phone, student.email, student.identification]
      .map(csvValue)
      .join(",")
  );
  const blob = new Blob([[headers.join(","), ...rows].join("\n")], { type: "text/csv;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = "student-directory.csv";
  link.click();
  URL.revokeObjectURL(url);
  showToast("Student directory exported.");
});

document.querySelector("#menuButton").addEventListener("click", event => {
  const open = elements.sidebar.classList.toggle("open");
  event.currentTarget.setAttribute("aria-expanded", String(open));
});

document.addEventListener("click", event => {
  if (window.innerWidth <= 700 &&
      elements.sidebar.classList.contains("open") &&
      !elements.sidebar.contains(event.target) &&
      !document.querySelector("#menuButton").contains(event.target)) {
    elements.sidebar.classList.remove("open");
    document.querySelector("#menuButton").setAttribute("aria-expanded", "false");
  }
});

render();
