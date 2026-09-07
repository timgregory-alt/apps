# Auth email templates

Supabase Auth emails (signup confirmation, invites, password resets) are
configured in the dashboard, not deployed from this repo — these files are
just the source of truth so the HTML isn't only living in a browser tab.

To apply one: Supabase dashboard → **Authentication → Emails → Templates**,
pick the matching template, paste the file's contents into the **Message
body** field, set the **Subject heading** noted in the file's comment, and
save.

| File | Supabase template | Used for |
|---|---|---|
| `confirm-signup.html` | Confirm signup | Guest signup email confirmation |
| `invite-winery.html` | Invite user | Winery portal access invite |
| `magic-link.html` | Magic Link | Passwordless sign-in link |

Both use Supabase's `{{ .ConfirmationURL }}` template variable — don't
rename or remove it, that's the actual working link.
