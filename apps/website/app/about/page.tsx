import { redirect } from "next/navigation";

/** Legacy about URL resolves to the product-led company overview. */
export default function AboutPage() {
  redirect("/company");
}
