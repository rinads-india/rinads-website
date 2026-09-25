import { Card } from "@rinads/ui";
import { operations, opsContext } from "@/lib/commerce";

export default function TasksPage() {
  const ctx = opsContext();
  const tasks = operations.tasks.list(ctx);

  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-semibold">Staff tasks</h2>
      <Card className="overflow-x-auto p-0">
        <table>
          <thead>
            <tr>
              <th>Title</th>
              <th>Priority</th>
              <th>Status</th>
              <th>Due</th>
            </tr>
          </thead>
          <tbody>
            {tasks.length === 0 ? (
              <tr><td colSpan={4} className="p-4 text-muted-foreground">No tasks yet.</td></tr>
            ) : (
              tasks.map((t) => (
                <tr key={t.id}>
                  <td>{t.title}</td>
                  <td>{t.priority}</td>
                  <td>{t.status}</td>
                  <td>{t.dueAt ? new Date(t.dueAt).toLocaleDateString() : "—"}</td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </Card>
    </div>
  );
}
