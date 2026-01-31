const STORAGE_KEYS = {
  users: "market_users",
  session: "market_session",
};

const createId = () =>
  typeof crypto !== "undefined" && crypto.randomUUID
    ? crypto.randomUUID()
    : `user-${Date.now()}-${Math.random().toString(16).slice(2)}`;

const DEFAULT_USERS = [
  {
    id: createId(),
    fullName: "Admin principal",
    username: "admin",
    password: "admin123",
    role: "admin",
  },
];

const loginSection = document.getElementById("loginSection");
const adminSection = document.getElementById("adminSection");
const loginForm = document.getElementById("loginForm");
const loginMessage = document.getElementById("loginMessage");
const logoutButton = document.getElementById("logoutButton");
const userForm = document.getElementById("userForm");
const userMessage = document.getElementById("userMessage");
const userList = document.getElementById("userList");
const cancelButton = document.getElementById("cancelButton");
const activeUserBadge = document.getElementById("activeUserBadge");
const resetSeedButton = document.getElementById("resetSeedButton");
const emptyState = document.getElementById("emptyState");

let editingUserId = null;

const ensureDefaultUsers = (users) => {
  if (!users.length) {
    return [...DEFAULT_USERS];
  }
  const hasAdmin = users.some((user) => user.username === "admin");
  if (!hasAdmin) {
    return [...users, ...DEFAULT_USERS];
  }
  return users;
};

const getUsers = () => {
  const stored = localStorage.getItem(STORAGE_KEYS.users);
  const parsed = stored ? JSON.parse(stored) : [];
  const seeded = ensureDefaultUsers(parsed);
  if (!stored || seeded.length !== parsed.length) {
    saveUsers(seeded);
  }
  return seeded;
};

const saveUsers = (users) => {
  localStorage.setItem(STORAGE_KEYS.users, JSON.stringify(users));
};

const setMessage = (element, message, type = "success") => {
  element.textContent = message;
  element.classList.toggle("error", type === "error");
};

const getSession = () => {
  const stored = localStorage.getItem(STORAGE_KEYS.session);
  return stored ? JSON.parse(stored) : null;
};

const setSession = (session) => {
  if (!session) {
    localStorage.removeItem(STORAGE_KEYS.session);
    return;
  }
  localStorage.setItem(STORAGE_KEYS.session, JSON.stringify(session));
};

const resetForm = () => {
  userForm.reset();
  editingUserId = null;
  cancelButton.classList.add("hidden");
  document.getElementById("saveButton").textContent = "Guardar usuario";
};

const renderUsers = () => {
  const users = getUsers();
  userList.innerHTML = "";
  emptyState.classList.toggle("hidden", users.length > 0);

  users.forEach((user) => {
    const row = document.createElement("div");
    row.className = "table-row";
    row.innerHTML = `
      <span>${user.fullName}</span>
      <span>${user.username}</span>
      <span>${user.role}</span>
      <span class="table-actions">
        <button class="button ghost" data-action="edit">Editar</button>
        <button class="button danger" data-action="delete">Eliminar</button>
      </span>
    `;

    row.querySelector('[data-action="edit"]').addEventListener("click", () => {
      editingUserId = user.id;
      userForm.fullName.value = user.fullName;
      userForm.username.value = user.username;
      userForm.password.value = user.password;
      userForm.role.value = user.role;
      cancelButton.classList.remove("hidden");
      document.getElementById("saveButton").textContent = "Actualizar usuario";
    });

    row
      .querySelector('[data-action="delete"]')
      .addEventListener("click", () => handleDelete(user.id));

    userList.appendChild(row);
  });
};

const handleDelete = (userId) => {
  const users = getUsers();
  const session = getSession();
  if (session?.id === userId) {
    setMessage(
      userMessage,
      "No puedes eliminar el usuario con sesión activa.",
      "error"
    );
    return;
  }
  const updated = users.filter((user) => user.id !== userId);
  saveUsers(updated);
  setMessage(userMessage, "Usuario eliminado correctamente.");
  renderUsers();
};

const showAdmin = (session) => {
  loginSection.classList.add("hidden");
  adminSection.classList.remove("hidden");
  logoutButton.classList.remove("hidden");
  activeUserBadge.textContent = `Sesión: ${session.fullName} (${session.role})`;
  renderUsers();
};

const showLogin = () => {
  loginSection.classList.remove("hidden");
  adminSection.classList.add("hidden");
  logoutButton.classList.add("hidden");
};

loginForm.addEventListener("submit", (event) => {
  event.preventDefault();
  const username = loginForm.username.value.trim();
  const password = loginForm.password.value.trim();
  const users = getUsers();
  const user = users.find(
    (item) => item.username === username && item.password === password
  );

  if (!user) {
    setMessage(loginMessage, "Credenciales inválidas.", "error");
    return;
  }

  setSession(user);
  setMessage(loginMessage, "");
  showAdmin(user);
});

logoutButton.addEventListener("click", () => {
  setSession(null);
  showLogin();
});

resetSeedButton.addEventListener("click", () => {
  saveUsers([...DEFAULT_USERS]);
  setMessage(loginMessage, "Usuario admin restaurado.");
  renderUsers();
});

userForm.addEventListener("submit", (event) => {
  event.preventDefault();
  const users = getUsers();
  const payload = {
    fullName: userForm.fullName.value.trim(),
    username: userForm.username.value.trim(),
    password: userForm.password.value.trim(),
    role: userForm.role.value,
  };

  if (
    users.some(
      (user) => user.username === payload.username && user.id !== editingUserId
    )
  ) {
    setMessage(userMessage, "El usuario ya existe.", "error");
    return;
  }

  if (editingUserId) {
    const updated = users.map((user) =>
      user.id === editingUserId ? { ...user, ...payload } : user
    );
    saveUsers(updated);
    setMessage(userMessage, "Usuario actualizado correctamente.");
  } else {
    saveUsers([...users, { id: createId(), ...payload }]);
    setMessage(userMessage, "Usuario creado correctamente.");
  }
  resetForm();
  renderUsers();
});

cancelButton.addEventListener("click", () => {
  resetForm();
  setMessage(userMessage, "");
});

const session = getSession();
if (session) {
  showAdmin(session);
} else {
  showLogin();
}
