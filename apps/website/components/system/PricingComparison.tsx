import { PRICING_COMPARISON_ROWS, PRICING_PLANS } from "@/lib/content/commercialConfig";

export function PricingComparison() {
  return (
    <div className="overflow-x-auto">
      <table className="w-full min-w-[720px] border-collapse text-left text-sm">
        <caption className="sr-only">Compare Start, Grow, Scale and Enterprise plans</caption>
        <thead>
          <tr className="border-b border-white/10">
            <th scope="col" className="py-3 pr-4 font-semibold text-muted-foreground">
              Coverage
            </th>
            {PRICING_PLANS.map((plan) => (
              <th key={plan.id} scope="col" className="px-3 py-3 font-semibold text-foreground">
                {plan.name}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {PRICING_COMPARISON_ROWS.map((row) => (
            <tr key={row.label} className="border-b border-white/5">
              <th scope="row" className="py-3 pr-4 font-medium text-muted-foreground">
                {row.label}
              </th>
              {PRICING_PLANS.map((plan) => (
                <td key={plan.id} className="px-3 py-3 text-foreground/90">
                  {row.get(plan)}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
