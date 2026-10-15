import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useMemo, useState, type FormEvent } from "react";
import { Check, Plus, Trash2, ClipboardList, Sparkles, CircleCheckBig } from "lucide-react";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "TaskFlow — Simple Task Tracker" },
      {
        name: "description",
        content:
          "A clean, fast personal task tracker. Add tasks, check them off, filter by status, and everything is saved in your browser.",
      },
      { property: "og:title", content: "TaskFlow — Simple Task Tracker" },
      {
        property: "og:description",
        content:
          "A clean, fast personal task tracker. Add tasks, check them off, filter by status, and everything is saved in your browser.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: Index,
});

type Task = {
  id: string;
  text: string;
  completed: boolean;
  createdAt: number;
};

type Filter = "all" | "active" | "completed";

const STORAGE_KEY = "taskflow-tasks-v1";

function loadTasks(): Task[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];
    return parsed.filter(
      (t): t is Task =>
        typeof t === "object" &&
        t !== null &&
        typeof t.id === "string" &&
        typeof t.text === "string" &&
        typeof t.completed === "boolean",
    );
  } catch {
    return [];
  }
}

function Index() {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [hydrated, setHydrated] = useState(false);
  const [draft, setDraft] = useState("");
  const [filter, setFilter] = useState<Filter>("all");

  // Load from localStorage after hydration to avoid SSR mismatch.
  useEffect(() => {
    setTasks(loadTasks());
    setHydrated(true);
  }, []);

  // Persist on every change (after initial load).
  useEffect(() => {
    if (!hydrated) return;
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(tasks));
  }, [tasks, hydrated]);

  const remaining = useMemo(
    () => tasks.filter((t) => !t.completed).length,
    [tasks],
  );

  const completedCount = tasks.length - remaining;

  const visibleTasks = useMemo(() => {
    switch (filter) {
      case "active":
        return tasks.filter((t) => !t.completed);
      case "completed":
        return tasks.filter((t) => t.completed);
      default:
        return tasks;
    }
  }, [tasks, filter]);

  function addTask(e: FormEvent) {
    e.preventDefault();
    const text = draft.trim();
    if (!text) return;
    setTasks((prev) => [
      {
        id: crypto.randomUUID(),
        text,
        completed: false,
        createdAt: Date.now(),
      },
      ...prev,
    ]);
    setDraft("");
  }

  function toggleTask(id: string) {
    setTasks((prev) =>
      prev.map((t) => (t.id === id ? { ...t, completed: !t.completed } : t)),
    );
  }

  function deleteTask(id: string) {
    setTasks((prev) => prev.filter((t) => t.id !== id));
  }

  const filters: { value: Filter; label: string; count: number }[] = [
    { value: "all", label: "All", count: tasks.length },
    { value: "active", label: "Active", count: remaining },
    { value: "completed", label: "Completed", count: completedCount },
  ];

  return (
    <div className="relative min-h-screen bg-background">
      {/* Soft ambient backdrop */}
      <div
        aria-hidden
        className="pointer-events-none fixed inset-x-0 top-0 -z-10 h-72 bg-gradient-to-b from-primary/[0.06] to-transparent"
      />

      <main className="mx-auto w-full max-w-xl px-4 pb-16 pt-10 sm:pt-14">
        <header className="mb-8">
          <div className="flex items-center justify-between gap-3">
            <div className="flex items-center gap-3.5">
              <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-br from-primary to-primary/80 text-primary-foreground shadow-lg shadow-primary/25 ring-1 ring-primary/20">
                <ClipboardList className="h-5 w-5" aria-hidden />
              </div>
              <div>
                <h1 className="text-[1.7rem] font-bold leading-tight tracking-tight text-foreground">
                  TaskFlow
                </h1>
                <p className="mt-0.5 text-sm text-muted-foreground">
                  {remaining === 0
                    ? tasks.length > 0
                      ? "All done — nice work!"
                      : "Add your first task below"
                    : `${remaining} task${remaining === 1 ? "" : "s"} remaining`}
                </p>
              </div>
            </div>

            {tasks.length > 0 && (
              <div className="hidden rounded-full border border-border bg-card px-3.5 py-1.5 text-xs font-medium text-muted-foreground shadow-sm sm:block">
                {completedCount}/{tasks.length} done
              </div>
            )}
          </div>
        </header>

        <form
          onSubmit={addTask}
          className="mb-6 flex gap-2.5 rounded-2xl border border-border bg-card p-2 shadow-sm"
        >
          <input
            type="text"
            value={draft}
            onChange={(e) => setDraft(e.target.value)}
            placeholder="What needs to be done?"
            aria-label="New task"
            className="h-11 min-w-0 flex-1 rounded-xl bg-transparent px-3.5 text-sm text-foreground outline-none transition placeholder:text-muted-foreground focus-visible:ring-2 focus-visible:ring-ring/30"
          />
          <button
            type="submit"
            disabled={!draft.trim()}
            className="inline-flex h-11 shrink-0 items-center gap-1.5 rounded-xl bg-primary px-4 text-sm font-semibold text-primary-foreground shadow-sm transition hover:bg-primary/90 active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-50"
          >
            <Plus className="h-4 w-4" aria-hidden />
            <span className="hidden sm:inline">Add Task</span>
            <span className="sm:hidden">Add</span>
          </button>
        </form>

        <div
          className="mb-5 inline-flex rounded-xl border border-border bg-muted/60 p-1"
          role="tablist"
          aria-label="Filter tasks"
        >
          {filters.map((f) => (
            <button
              key={f.value}
              type="button"
              role="tab"
              aria-selected={filter === f.value}
              onClick={() => setFilter(f.value)}
              className={`inline-flex items-center gap-1.5 rounded-lg px-3.5 py-1.5 text-sm font-medium transition ${
                filter === f.value
                  ? "bg-card text-foreground shadow-sm ring-1 ring-border/50"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              {f.label}
              <span
                className={`rounded-full px-1.5 py-px text-[11px] leading-4 tabular-nums ${
                  filter === f.value
                    ? "bg-primary/10 text-primary"
                    : "bg-muted text-muted-foreground"
                }`}
              >
                {f.count}
              </span>
            </button>
          ))}
        </div>

        {visibleTasks.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-border bg-card/50 px-6 py-14 text-center">
            <div className="mx-auto mb-3 flex h-10 w-10 items-center justify-center rounded-full bg-muted text-muted-foreground">
              {filter === "active" && tasks.length > 0 ? (
                <CircleCheckBig className="h-5 w-5" aria-hidden />
              ) : (
                <Sparkles className="h-5 w-5" aria-hidden />
              )}
            </div>
            <p className="text-sm text-muted-foreground">
              {tasks.length === 0
                ? "No tasks yet. Type something above and hit Add Task."
                : filter === "active"
                  ? "No active tasks — everything is checked off."
                  : "No completed tasks yet."}
            </p>
          </div>
        ) : (
          <ul className="space-y-2.5">
            {visibleTasks.map((task) => (
              <li
                key={task.id}
                className={`group flex items-center gap-3 rounded-2xl border px-4 py-3.5 transition-all duration-200 ${
                  task.completed
                    ? "border-border/60 bg-muted/40 shadow-none hover:border-border"
                    : "border-border bg-card shadow-sm hover:-translate-y-0.5 hover:border-ring/40 hover:shadow-md"
                }`}
              >
                <button
                  type="button"
                  role="checkbox"
                  aria-checked={task.completed}
                  aria-label={
                    task.completed
                      ? `Mark "${task.text}" as not complete`
                      : `Mark "${task.text}" as complete`
                  }
                  onClick={() => toggleTask(task.id)}
                  className={`flex h-6 w-6 shrink-0 items-center justify-center rounded-lg border transition-all duration-200 ${
                    task.completed
                      ? "border-primary bg-primary text-primary-foreground"
                      : "border-input bg-background hover:border-primary hover:shadow-[0_0_0_3px] hover:shadow-primary/15"
                  }`}
                >
                  {task.completed && <Check className="h-3.5 w-3.5" aria-hidden />}
                </button>
                <span
                  className={`flex-1 text-sm leading-snug transition-colors ${
                    task.completed
                      ? "text-muted-foreground/80 line-through decoration-border"
                      : "text-foreground"
                  }`}
                >
                  {task.text}
                </span>
                <button
                  type="button"
                  aria-label={`Delete "${task.text}"`}
                  onClick={() => deleteTask(task.id)}
                  className="rounded-lg p-1.5 text-muted-foreground opacity-60 transition hover:bg-destructive/10 hover:text-destructive focus:opacity-100 sm:opacity-0 sm:group-hover:opacity-100 sm:group-hover:focus:opacity-100"
                >
                  <Trash2 className="h-4 w-4" aria-hidden />
                </button>
              </li>
            ))}
          </ul>
        )}

        {tasks.length > 0 && (
          <footer className="mt-6 flex items-center justify-between text-xs text-muted-foreground">
            <span>
              {tasks.length} total · {completedCount} completed
            </span>
            {tasks.some((t) => t.completed) && (
              <button
                type="button"
                onClick={() => setTasks((prev) => prev.filter((t) => !t.completed))}
                className="rounded-md px-2 py-1 font-medium transition hover:bg-destructive/10 hover:text-destructive"
              >
                Clear completed
              </button>
            )}
          </footer>
        )}
      </main>
    </div>
  );
}