import { Card } from "@rinads/ui";
import { submitFeedbackAction } from "./actions";

export const metadata = { title: "Visit feedback — R GLOW" };

export default async function FeedbackPage({
  params,
  searchParams,
}: {
  params: Promise<{ token: string }>;
  searchParams: Promise<{ submitted?: string }>;
}) {
  const { token } = await params;
  const { submitted } = await searchParams;

  return (
    <main className="mx-auto flex min-h-screen max-w-xl items-center px-4 py-12">
      <Card className="w-full">
        <h1 className="text-2xl font-semibold text-foreground">How was your visit?</h1>
        {submitted === "1" ? (
          <p className="mt-3 text-muted-foreground">Thank you. Your feedback has been shared with the salon.</p>
        ) : submitted === "0" ? (
          <p className="mt-3 text-danger">This feedback link is invalid, expired, or has already been used.</p>
        ) : (
          <form action={submitFeedbackAction.bind(null, token)} className="mt-5 space-y-4">
            <fieldset>
              <legend className="text-sm font-medium text-foreground">Rating</legend>
              <div className="mt-2 flex gap-3">
                {[1, 2, 3, 4, 5].map((rating) => (
                  <label key={rating} className="flex cursor-pointer flex-col items-center gap-1 text-sm">
                    <input required type="radio" name="rating" value={rating} />
                    {rating}
                  </label>
                ))}
              </div>
            </fieldset>
            <label className="block text-sm font-medium text-foreground">
              Comments (optional)
              <textarea name="comment" maxLength={4000} rows={4} className="mt-2 w-full rounded-lg border p-3" />
            </label>
            <button type="submit" className="rounded-lg bg-rinads-primary px-4 py-2 font-medium text-white">
              Submit feedback
            </button>
          </form>
        )}
      </Card>
    </main>
  );
}

