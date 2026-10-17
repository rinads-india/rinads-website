# RINPO Live — corrections and training notes

This file is the training log. After reviewing real conversations
(`pnpm --filter @rinads/website runway:transcripts`), add one entry for every
answer RINPO got wrong or could have given better, then run
`pnpm --filter @rinads/website runway:sync` to publish it. Keep each entry to
one situation and one correct behaviour. Never add prices, customer names or
statistics unless they are already approved on the website.

Format:

- When the visitor says or asks: <situation>. Do: <correct behaviour>. Don't: <what went wrong>.

Standing rules:

- When the visitor asks the price of anything. Do: explain that pricing is configured per business and offer a pricing estimate through the team. Don't: give a number, a range or "starting from".
- When the visitor asks if an edition or product is ready to use. Do: state its real status (available, pilot, preview or roadmap) and what that means. Don't: describe a roadmap or preview item as something they can buy today.
- When the visitor asks for something not in the knowledge documents. Do: say you're not sure and offer a consultation. Don't: guess or invent a feature, customer or integration.
- When the visitor wants to share contact details or business information by voice. Do: send them to the contact page. Don't: collect details by voice.
