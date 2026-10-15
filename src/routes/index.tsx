import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useMemo, useState, type FormEvent } from "react";
import { Check, Plus, Trash2, ClipboardList } from "lucide-react";

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

  const filters: { value: Filter; label: string }[] = [
    { value: "all", label: "All" },
    { value: "active", label: "Active" },
    { value: "completed", label: "Completed" },
  ];

  return (
    <div className="min-h-screen bg-background">
      <main className="mx-auto w-full max-w-xl px-4 py-10 sm:py-16">
        <header className="mb-8">
          <div className="flex items-center gap-3">
            <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-primary text-primary-foreground shadow-sm">
              <ClipboardList className="h-5 w-5" aria-hidden />
            </div>
            <div>
              <h1 className="text-2xl font-bold tracking-tight text-foreground">
                TaskFlow
              </h1>
              <p className="text-sm text-muted-foreground">
                {remaining === 0
                  ? tasks.length > 0
                    ? "All done — nice work!"
                    : "Add your first task below"
                  : `${remaining} task${remaining === 1 ? "" : "s"} remaining`}
              </p>
            </div>
          </div>
        </header>

        <form onSubmit={addTask} className="mb-6 flex gap-2">
          <input
            type="text"
            value={draft}
            onChange={(e) => setDraft(e.target.value)}
            placeholder="What needs to be done?"
            aria-label="New task"
            className="h-11 flex-1 rounded-lg border border-input bg-card px-4 text-sm text-foreground shadow-sm outline-none transition placeholder:text-muted-foreground focus:border-ring focus:ring-2 focus:ring-ring/30"
          />
          <button
            type="submit"
            disabled={!draft.trim()}
            className="inline-flex h-11 items-center gap-1.5 rounded-lg bg-primary px-4 text-sm font-medium text-primary-foreground shadow-sm transition hover:bg-primary/90 disabled:cursor-not-allowed disabled:opacity-50"
          >
            <Plus className="h-4 w-4" aria-hidden />
            Add Task
          </button>
        </form>

        <div
          className="mb-4 inline-flex rounded-lg bg-muted p-1"
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
              className={`rounded-md px-3.5 py-1.5 text-sm font-medium transition ${
                filter === f.value
                  ? "bg-card text-foreground shadow-sm"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              {f.label}
            </button>
          ))}
        </div>

        {visibleTasks.length === 0 ? (
          <div className="rounded-xl border border-dashed border-border bg-card/50 px-6 py-12 text-center">
            <p className="text-sm text-muted-foreground">
              {tasks.length === 0
                ? "No tasks yet. Type something above and hit Add Task."
                : filter === "active"
                  ? "No active tasks — everything is checked off."
                  : "No completed tasks yet."}
            </p>
          </div>
        ) : (
          <ul className="space-y-2">
            {visibleTasks.map((task) => (
              <li
                key={task.id}
                className="group flex items-center gap-3 rounded-xl border border-border bg-card px-4 py-3 shadow-sm transition hover:shadow"
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
                  className={`flex h-5 w-5 shrink-0 items-center justify-center rounded-md border transition ${
                    task.completed
                      ? "border-primary bg-primary text-primary-foreground"
                      : "border-input bg-background hover:border-primary"
                  }`}
                >
                  {task.completed && <Check className="h-3.5 w-3.5" aria-hidden />}
                </button>
                <span
                  className={`flex-1 text-sm transition ${
                    task.completed
                      ? "text-muted-foreground line-through"
                      : "text-foreground"
                  }`}
                >
                  {task.text}
                </span>
                <button
                  type="button"
                  aria-label={`Delete "${task.text}"`}
                  onClick={() => deleteTask(task.id)}
                  className="rounded-md p-1.5 text-muted-foreground opacity-60 transition hover:bg-destructive/10 hover:text-destructive focus:opacity-100 sm:opacity-0 sm:group-hover:opacity-100"
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
              {tasks.length} total · {tasks.length - remaining} completed
            </span>
            {tasks.some((t) => t.completed) && (
              <button
                type="button"
                onClick={() => setTasks((prev) => prev.filter((t) => !t.completed))}
                className="font-medium transition hover:text-destructive"
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
