import { useCallback, useEffect, useMemo, useState } from "react";
import {
  ArrowRight,
  BookOpen,
  Check,
  CircleAlert,
  FileText,
  LogOut,
  Menu,
  MoreHorizontal,
  Pin,
  Plus,
  Search,
  Tag,
  Trash2,
  X
} from "lucide-react";

const API_ROOT = "/api";

async function request(path, options = {}) {
  let response;
  try {
    response = await fetch(`${API_ROOT}${path}`, {
      credentials: "include",
      ...options,
      headers: {
        ...(options.body ? { "Content-Type": "application/json" } : {}),
        ...options.headers
      }
    });
  } catch {
    throw new Error("Couldn’t reach the server. Check your connection and try again.");
  }

  const raw = await response.text();
  let data = null;
  if (raw) {
    try {
      data = JSON.parse(raw);
    } catch {
      data = { message: raw };
    }
  }
  if (!response.ok) {
    if (response.status === 401) {
      const error = new Error(data?.message || "Your session has expired. Please sign in again.");
      error.status = 401;
      throw error;
    }
    throw new Error(data?.message || data?.error || `Request failed (${response.status}).`);
  }
  return data;
}

function noteId(note) {
  return note.id ?? note._id;
}

function dateLabel(date) {
  if (!date) return "Just now";
  const parsed = new Date(date);
  if (Number.isNaN(parsed.getTime())) return "Just now";
  return new Intl.DateTimeFormat(undefined, { month: "short", day: "numeric" }).format(parsed);
}

function splitTags(value) {
  return [...new Set(value.split(",").map((tag) => tag.trim()).filter(Boolean))];
}

const blankForm = { title: "", content: "", tags: "", pinned: false };

function App() {
  const [user, setUser] = useState(null);
  const [authChecked, setAuthChecked] = useState(false);
  const [authMode, setAuthMode] = useState(
    window.location.pathname === "/register" ? "register" : "login"
  );
  const [authForm, setAuthForm] = useState({ name: "", email: "", password: "" });
  const [authBusy, setAuthBusy] = useState(false);
  const [authError, setAuthError] = useState("");
  const [notes, setNotes] = useState([]);
  const [notesBusy, setNotesBusy] = useState(false);
  const [notesError, setNotesError] = useState("");
  const [query, setQuery] = useState("");
  const [activeTag, setActiveTag] = useState("All notes");
  const [view, setView] = useState("all");
  const [editorOpen, setEditorOpen] = useState(false);
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState(blankForm);
  const [saveBusy, setSaveBusy] = useState(false);
  const [editorError, setEditorError] = useState("");
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [deleteBusy, setDeleteBusy] = useState(false);
  const [menuNote, setMenuNote] = useState(null);
  const [mobileNavOpen, setMobileNavOpen] = useState(false);
  const [toast, setToast] = useState("");

  const showToast = useCallback((message) => {
    setToast(message);
    window.setTimeout(() => setToast(""), 2800);
  }, []);

  const loadNotes = useCallback(async () => {
    setNotesBusy(true);
    setNotesError("");
    try {
      const data = await request("/notes");
      setNotes(Array.isArray(data) ? data : data?.notes ?? []);
    } catch (error) {
      if (error.status === 401) setUser(null);
      setNotesError(error.message);
    } finally {
      setNotesBusy(false);
    }
  }, []);

  useEffect(() => {
    let alive = true;
    request("/auth/me")
      .then((data) => {
        if (!alive) return;
        setUser(data?.user ?? data ?? null);
      })
      .catch(() => {
        if (alive) setUser(null);
      })
      .finally(() => {
        if (alive) setAuthChecked(true);
      });
    return () => {
      alive = false;
    };
  }, []);

  useEffect(() => {
    if (user) loadNotes();
    else setNotes([]);
  }, [user, loadNotes]);

  const tags = useMemo(() => {
    const allTags = notes.flatMap((note) => note.tags || []);
    return [...new Set(allTags)].sort((a, b) => a.localeCompare(b));
  }, [notes]);

  const pinnedCount = notes.filter((note) => note.pinned).length;
  const filteredNotes = useMemo(() => {
    const normalizedQuery = query.trim().toLowerCase();
    return [...notes]
      .filter((note) => {
        const matchesView = view !== "pinned" || note.pinned;
        const matchesTag = activeTag === "All notes" || (note.tags || []).includes(activeTag);
        const matchesQuery =
          !normalizedQuery ||
          `${note.title || ""} ${note.content || ""} ${(note.tags || []).join(" ")}`
            .toLowerCase()
            .includes(normalizedQuery);
        return matchesView && matchesTag && matchesQuery;
      })
      .sort((a, b) => {
        if (Boolean(a.pinned) !== Boolean(b.pinned)) return Number(b.pinned) - Number(a.pinned);
        return new Date(b.updatedAt || b.createdAt || 0) - new Date(a.updatedAt || a.createdAt || 0);
      });
  }, [activeTag, notes, query, view]);

  async function handleAuthSubmit(event) {
    event.preventDefault();
    setAuthError("");
    setAuthBusy(true);
    const registering = authMode === "register";
    try {
      const data = await request(registering ? "/auth/register" : "/auth/login", {
        method: "POST",
        body: JSON.stringify(authMode === "register"
          ? { name: authForm.name, email: authForm.email, password: authForm.password }
          : { email: authForm.email, password: authForm.password })
      });
      const responseUser = data?.user ?? (data?.id != null || data?._id != null || data?.email ? data : null);
      const me = responseUser ? null : await request("/auth/me");
      setUser(responseUser ?? me?.user ?? me ?? {});
      setAuthForm({ name: "", email: "", password: "" });
      showToast(registering ? "Your account is ready." : "Welcome back.");
    } catch (error) {
      setAuthError(error.message);
    } finally {
      setAuthBusy(false);
    }
  }

  async function handleLogout() {
    try {
      await request("/auth/logout", { method: "POST" });
    } catch {
      showToast("Signed out on this device.");
    }
    setUser(null);
    setNotes([]);
    setView("all");
    setActiveTag("All notes");
  }

  function openCreate() {
    setEditing(null);
    setForm(blankForm);
    setEditorError("");
    setEditorOpen(true);
  }

  function openEdit(note) {
    setEditing(note);
    setForm({
      title: note.title || "",
      content: note.content || "",
      tags: (note.tags || []).join(", "),
      pinned: Boolean(note.pinned)
    });
    setEditorError("");
    setMenuNote(null);
    setEditorOpen(true);
  }

  async function saveNote(event) {
    event.preventDefault();
    const title = form.title.trim();
    if (!title) {
      setEditorError("Give your note a title before saving.");
      return;
    }
    setSaveBusy(true);
    setEditorError("");
    const payload = { title, content: form.content, tags: splitTags(form.tags), pinned: form.pinned };
    try {
      if (editing) {
        const id = encodeURIComponent(noteId(editing));
        const data = await request(`/notes/${id}`, { method: "PUT", body: JSON.stringify(payload) });
        const returned = data?.note ?? data;
        const updated = returned && typeof returned === "object" && (returned.id != null || returned._id != null)
          ? { ...editing, ...payload, ...returned }
          : { ...editing, ...payload };
        setNotes((current) => current.map((note) => noteId(note) === noteId(editing) ? updated : note));
        showToast("Note updated.");
      } else {
        const data = await request("/notes", { method: "POST", body: JSON.stringify(payload) });
        const returned = data?.note ?? data;
        if (returned && typeof returned === "object" && (returned.id != null || returned._id != null)) {
          setNotes((current) => [returned, ...current.filter((note) => noteId(note) !== noteId(returned))]);
        } else {
          await loadNotes();
        }
        showToast("Note saved.");
      }
      setEditorOpen(false);
    } catch (error) {
      if (error.status === 401) setUser(null);
      setEditorError(error.message);
    } finally {
      setSaveBusy(false);
    }
  }

  async function togglePinned(note) {
    const nextPinned = !note.pinned;
    const id = encodeURIComponent(noteId(note));
    setNotes((current) => current.map((item) => noteId(item) === noteId(note) ? { ...item, pinned: nextPinned } : item));
    setMenuNote(null);
    try {
      const data = await request(`/notes/${id}`, {
        method: "PUT",
        body: JSON.stringify({ pinned: nextPinned })
      });
      const updated = data?.note ?? data;
      if (updated && typeof updated === "object" && (updated.id != null || updated._id != null)) {
        setNotes((current) => current.map((item) => noteId(item) === noteId(note) ? updated : item));
      }
    } catch (error) {
      setNotes((current) => current.map((item) => noteId(item) === noteId(note) ? note : item));
      if (error.status === 401) setUser(null);
      showToast(error.message);
    }
  }

  async function deleteNote() {
    if (!deleteTarget) return;
    setDeleteBusy(true);
    try {
      await request(`/notes/${encodeURIComponent(noteId(deleteTarget))}`, { method: "DELETE" });
      setNotes((current) => current.filter((note) => noteId(note) !== noteId(deleteTarget)));
      showToast("Note deleted.");
      setDeleteTarget(null);
    } catch (error) {
      if (error.status === 401) setUser(null);
      showToast(error.message);
    } finally {
      setDeleteBusy(false);
    }
  }

  function selectView(nextView) {
    setView(nextView);
    setActiveTag("All notes");
    setMobileNavOpen(false);
  }

  if (!authChecked) {
    return (
      <main className="auth-screen">
        <div className="loading-card"><span className="loading-dot" />Loading...</div>
      </main>
    );
  }

  if (!user) {
    const registering = authMode === "register";
    return (
      <main className="auth-screen">
        <section className="auth-panel">
          <a className="brand auth-brand" href="/" onClick={(event) => event.preventDefault()}>
            <span>Notes</span>
          </a>
          <div className="auth-copy">
            <h1>{registering ? "Keep your notes in one place." : "Welcome back."}</h1>
            <p>Write down ideas, class notes, and reminders.</p>
          </div>
          <form className="auth-form" onSubmit={handleAuthSubmit}>
            <div className="form-heading">
              <h2>{registering ? "Create an account" : "Sign in"}</h2>
            </div>
            {registering && (
              <label className="field-label">Name
                <input autoComplete="name" value={authForm.name} onChange={(event) => setAuthForm({ ...authForm, name: event.target.value })} placeholder="Your name" required />
              </label>
            )}
            <label className="field-label">Email address
              <input type="email" autoComplete="email" value={authForm.email} onChange={(event) => setAuthForm({ ...authForm, email: event.target.value })} placeholder="you@example.com" required />
            </label>
            <label className="field-label">Password
              <input type="password" autoComplete={registering ? "new-password" : "current-password"} value={authForm.password} onChange={(event) => setAuthForm({ ...authForm, password: event.target.value })} placeholder="At least 8 characters" minLength={registering ? 8 : undefined} required />
            </label>
            {authError && <p className="inline-error"><CircleAlert size={15} />{authError}</p>}
            <button className="button button-primary auth-submit" type="submit" disabled={authBusy}>
              {authBusy ? "One moment…" : registering ? "Create account" : "Sign in"}
              {!authBusy && <ArrowRight size={17} />}
            </button>
            <p className="switch-auth">
              {registering ? "Already have an account?" : "Don't have an account?"}{" "}
              <button type="button" onClick={() => { setAuthMode(registering ? "login" : "register"); setAuthError(""); }}>
                {registering ? "Sign in" : "Create an account"}
              </button>
            </p>
          </form>
        </section>
      </main>
    );
  }

  const firstName = user?.name?.split(" ")[0] || user?.firstName || "there";
  const hasActiveFilter = Boolean(query.trim()) || activeTag !== "All notes" || view === "pinned";

  return (
    <div className="app-shell">
      {mobileNavOpen && <button className="mobile-scrim" aria-label="Close navigation" onClick={() => setMobileNavOpen(false)} />}
      <aside className={`sidebar ${mobileNavOpen ? "sidebar-open" : ""}`}>
        <div className="sidebar-top">
          <a className="brand" href="/" onClick={(event) => event.preventDefault()}>
            <span>Notes</span>
          </a>
          <button className="icon-button close-nav" aria-label="Close navigation" onClick={() => setMobileNavOpen(false)}><X size={19} /></button>
        </div>
        <button className="button button-primary new-note-button" onClick={openCreate}><Plus size={18} /> New note <span className="shortcut">⌘ N</span></button>
        <div className="side-label">NOTES</div>
        <nav className="side-nav" aria-label="Main navigation">
          <button className={`nav-item ${view === "all" && activeTag === "All notes" ? "active" : ""}`} onClick={() => selectView("all")}><FileText size={17} /><span>All notes</span><span className="nav-count">{notes.length}</span></button>
          <button className={`nav-item ${view === "pinned" ? "active" : ""}`} onClick={() => selectView("pinned")}><Pin size={17} /><span>Pinned</span>{pinnedCount > 0 && <span className="nav-count">{pinnedCount}</span>}</button>
        </nav>
        <div className="side-label tags-label">TAGS <button aria-label="Show all tags" onClick={() => setActiveTag("All notes")}><Plus size={14} /></button></div>
        <nav className="side-nav tag-nav" aria-label="Filter by tag">
          {tags.length ? tags.map((tag) => (
            <button key={tag} className={`nav-item tag-item ${activeTag === tag ? "active" : ""}`} onClick={() => { setActiveTag(tag); setView("all"); setMobileNavOpen(false); }}><span className="tag-dot" /><span>{tag}</span></button>
          )) : <p className="tag-hint">Tags from your notes show up here.</p>}
        </nav>
        <div className="sidebar-bottom">
          <div className="profile-row">
            <div className="avatar">{firstName.slice(0, 1).toUpperCase()}</div>
            <div className="profile-meta"><strong>{user?.name || user?.email || "Your account"}</strong><span>{user?.email || "Personal workspace"}</span></div>
            <button className="icon-button logout-button" onClick={handleLogout} aria-label="Sign out" title="Sign out"><LogOut size={17} /></button>
          </div>
        </div>
      </aside>

      <main className="main-area">
        <header className="topbar">
          <button className="icon-button mobile-menu" aria-label="Open navigation" onClick={() => setMobileNavOpen(true)}><Menu size={20} /></button>
          <div className="breadcrumbs"><span>Notes</span><span className="crumb-slash">/</span><strong>{view === "pinned" ? "Pinned" : activeTag !== "All notes" ? activeTag : "All notes"}</strong></div>
          <div className="topbar-right">
            <label className="search-box">
              <Search size={17} />
              <input aria-label="Search notes" value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Search notes..." />
              {query ? <button aria-label="Clear search" onClick={() => setQuery("")}><X size={15} /></button> : <kbd>⌘ K</kbd>}
            </label>
            <button className="button button-primary top-new-note" onClick={openCreate}><Plus size={17} /><span>New note</span></button>
          </div>
        </header>

        <section className="content-wrap">
          <div className="page-intro">
            <div>
              <div className="greeting-line">MY NOTES</div>
              <h1>{view === "pinned" ? "Pinned notes" : activeTag !== "All notes" ? activeTag : "All notes"}<span className="title-count">{filteredNotes.length}</span></h1>
              <p>{view === "pinned" ? "Notes you have pinned." : activeTag !== "All notes" ? `Notes tagged “${activeTag}”.` : "All your notes in one place."}</p>
            </div>
          </div>

          <div className="notes-toolbar">
            <div className="toolbar-title"><span className="toolbar-accent" /><strong>{hasActiveFilter ? "Matching notes" : "Recently updated"}</strong><span className="toolbar-count">{filteredNotes.length}</span></div>
            {hasActiveFilter && <button className="clear-filters" onClick={() => { setQuery(""); setActiveTag("All notes"); setView("all"); }}>Clear filters <X size={14} /></button>}
            {!hasActiveFilter && <span className="sort-button">Sorted by recently updated</span>}
          </div>

          {notesError ? (
            <div className="state-card error-state">
              <span className="state-icon error-icon"><CircleAlert size={21} /></span><h2>We couldn’t load your notes</h2><p>{notesError}</p><button className="button button-secondary" onClick={loadNotes}>Try again <ArrowRight size={15} /></button>
            </div>
          ) : notesBusy ? (
            <div className="notes-grid" aria-label="Loading notes">
              {Array.from({ length: 6 }).map((_, index) => <div className="note-skeleton" key={index}><span /><span /><span /><span /></div>)}
            </div>
          ) : filteredNotes.length ? (
            <div className="notes-grid">
              {filteredNotes.map((note) => (
                <article className={`note-card ${note.pinned ? "is-pinned" : ""}`} key={noteId(note)}>
                  <div className="note-card-top">
                    <span className="note-date">{dateLabel(note.updatedAt || note.createdAt)}</span>
                    {note.pinned && <span className="pinned-label"><Pin size={12} fill="currentColor" /> PINNED</span>}
                    <div className="note-menu-wrap">
                      <button className="icon-button note-menu-button" aria-label={`Options for ${note.title || "note"}`} onClick={() => setMenuNote(menuNote === noteId(note) ? null : noteId(note))}><MoreHorizontal size={19} /></button>
                      {menuNote === noteId(note) && <>
                        <button className="menu-dismiss" aria-label="Close note menu" onClick={() => setMenuNote(null)} />
                        <div className="note-menu">
                          <button onClick={() => openEdit(note)}><FileText size={15} /> Edit note</button>
                          <button onClick={() => togglePinned(note)}><Pin size={15} /> {note.pinned ? "Unpin note" : "Pin note"}</button>
                          <button className="delete-menu-item" onClick={() => { setDeleteTarget(note); setMenuNote(null); }}><Trash2 size={15} /> Delete note</button>
                        </div>
                      </>}
                    </div>
                  </div>
                  <button className="note-content" onClick={() => openEdit(note)}>
                    <h2>{note.title || "Untitled note"}</h2>
                    <p>{note.content || <span className="empty-preview">No content yet.</span>}</p>
                  </button>
                  <div className="note-card-bottom">
                    <div className="note-tags">{(note.tags || []).slice(0, 3).map((tag) => <button key={tag} className="note-tag" onClick={() => { setActiveTag(tag); setView("all"); }}>{tag}</button>)}{(note.tags || []).length > 3 && <span className="extra-tags">+{note.tags.length - 3}</span>}</div>
                    <button className={`quick-pin ${note.pinned ? "quick-pin-active" : ""}`} onClick={() => togglePinned(note)} aria-label={note.pinned ? "Unpin note" : "Pin note"} title={note.pinned ? "Unpin note" : "Pin note"}><Pin size={15} fill={note.pinned ? "currentColor" : "none"} /></button>
                  </div>
                </article>
              ))}
              <button className="add-note-card" onClick={openCreate}><span className="add-note-icon"><Plus size={18} /></span><strong>Add a note</strong></button>
            </div>
          ) : (
            <div className="state-card empty-state">
              <span className="state-icon"><BookOpen size={22} /></span>
              <h2>{notes.length === 0 ? "No notes yet" : "No notes match"}</h2>
              <p>{notes.length === 0 ? "Create a note to get started." : "Try a different search or clear your filters."}</p>
              {notes.length === 0 && <button className="button button-primary" onClick={openCreate}><Plus size={17} /> Create your first note</button>}
              {notes.length > 0 && hasActiveFilter && <button className="button button-secondary" onClick={() => { setQuery(""); setActiveTag("All notes"); setView("all"); }}>Clear filters <ArrowRight size={15} /></button>}
            </div>
          )}
          <footer className="page-footer"><span>{notes.length} {notes.length === 1 ? "note" : "notes"}</span></footer>
        </section>
      </main>

      {editorOpen && (
        <div className="modal-backdrop" onMouseDown={(event) => { if (event.target === event.currentTarget) setEditorOpen(false); }}>
          <section className="editor-modal" role="dialog" aria-modal="true" aria-labelledby="editor-title">
            <div className="editor-header">
              <div><span className="editor-kicker">{editing ? "EDIT NOTE" : "NEW NOTE"}</span><h2 id="editor-title">{editing ? "Edit note" : "New note"}</h2></div>
              <button className="icon-button modal-close" aria-label="Close editor" onClick={() => setEditorOpen(false)}><X size={20} /></button>
            </div>
            <form onSubmit={saveNote}>
              <label className="field-label editor-title-label">Title
                <input className="editor-title-input" value={form.title} onChange={(event) => setForm({ ...form, title: event.target.value })} placeholder="Note title" autoFocus maxLength={120} />
              </label>
              <label className="field-label editor-content-label">Your note
                <textarea value={form.content} onChange={(event) => setForm({ ...form, content: event.target.value })} placeholder="Write something..." rows={8} />
              </label>
              <label className="field-label tag-input-label"><span><Tag size={14} /> Tags</span>
                <input value={form.tags} onChange={(event) => setForm({ ...form, tags: event.target.value })} placeholder="class notes, ideas, to-do" />
                <small>Separate tags with commas</small>
              </label>
              <label className="pin-toggle"><input type="checkbox" checked={form.pinned} onChange={(event) => setForm({ ...form, pinned: event.target.checked })} /><span className="custom-checkbox"><Check size={13} /></span><Pin size={15} /><span>Keep this note pinned</span></label>
              {editorError && <p className="inline-error editor-error"><CircleAlert size={15} />{editorError}</p>}
              <div className="editor-actions"><button className="button button-quiet" type="button" onClick={() => setEditorOpen(false)}>Cancel</button><button className="button button-primary" type="submit" disabled={saveBusy}>{saveBusy ? "Saving…" : editing ? "Save changes" : "Save note"} {!saveBusy && <ArrowRight size={16} />}</button></div>
            </form>
          </section>
        </div>
      )}

      {deleteTarget && (
        <div className="modal-backdrop delete-backdrop" onMouseDown={(event) => { if (event.target === event.currentTarget) setDeleteTarget(null); }}>
          <section className="delete-modal" role="alertdialog" aria-modal="true" aria-labelledby="delete-title">
            <span className="delete-icon"><Trash2 size={21} /></span><h2 id="delete-title">Delete this note?</h2>
            <p><strong>{deleteTarget.title || "Untitled note"}</strong> will be gone for good. This can’t be undone.</p>
            <div className="delete-actions"><button className="button button-quiet" onClick={() => setDeleteTarget(null)} disabled={deleteBusy}>Keep note</button><button className="button button-danger" onClick={deleteNote} disabled={deleteBusy}>{deleteBusy ? "Deleting…" : "Delete note"}</button></div>
          </section>
        </div>
      )}
      {toast && <div className="toast-message"><span><Check size={15} /></span>{toast}</div>}
    </div>
  );
}

export default App;
