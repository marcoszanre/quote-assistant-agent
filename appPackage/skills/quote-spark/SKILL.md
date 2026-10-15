---
name: quote-spark
description: Returns an inspiring quote with author and context when triggered with the custom command /quote-spark (or !quote-spark, quote-spark, or when the user asks for a quote).
---
# quote-spark

Activate this skill whenever the user invokes the custom command `/quote-spark` (or variations like `!quote-spark`, `quote-spark <theme>`, or requests an inspirational quote).

## Command Syntax

- `/quote-spark` — Returns a curated quote of the day with author context and a practical takeaway.
- `/quote-spark <theme>` — Returns a quote tailored to `<theme>` (supported themes: `leadership`, `innovation`, `resilience`, `collaboration`, `focus`, or any user-specified topic).

## Procedure

1. **Parse the trigger**:
   - Check if the user provided a theme after `/quote-spark` (e.g., `/quote-spark leadership`).
   - If no theme is specified, select a quote from the catalog below that fits general daily motivation.
2. **Select a verified quote**:
   - Pick a quote from the curated catalog below matching the requested theme (or another historically verified quote if the user requested a specific theme not listed).
   - Never invent or alter the wording of a known quote.
3. **Format the output** using this exact structure:

   > "<Quote text>"
   — **<Author>**, *<Context or work>*

   **Key Takeaway:** <1–2 sentences connecting the quote to practical daily work or the user's theme.>
   **Try next:** Mention one other `/quote-spark <theme>` command the user can try.

## Curated Quote Catalog

| Theme | Quote | Author | Context |
|-------|-------|--------|---------|
| `leadership` | "Management is doing things right; leadership is doing the right things." | Peter F. Drucker | *Essential Drucker* — distinguishing operational execution from strategic direction. |
| `innovation` | "The best way to predict the future is to invent it." | Alan Kay | Xerox PARC (1971) — on proactive creation and pioneering new technology. |
| `resilience` | "Success is not final, failure is not fatal: it is the courage to continue that counts." | Winston Churchill | On perseverance through setbacks and long-term execution. |
| `collaboration` | "Alone we can do so little; together we can do so much." | Helen Keller | On shared purpose and the multiplier effect of teamwork. |
| `focus` | "Simplicity is about subtracting the obvious and adding the meaningful." | John Maeda | *The Laws of Simplicity* — on clarity and prioritization in design and work. |

