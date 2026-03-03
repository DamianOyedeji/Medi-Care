
  # Mental Health Support Landing Page

  This is a code bundle for Mental Health Support Landing Page. The original project is available at https://www.figma.com/design/n33rnX7JFpfKRQERK49SDp/Mental-Health-Support-Landing-Page.

  ## Running the code

  Run `npm i` to install the dependencies.

  Run `npm run dev` to start the development server.

  ## Password Reset (Supabase)

  The forgot password flow uses Supabase email authentication:

  1. Copy `.env.example` to `.env` and add your Supabase project URL and anon key.
  2. In Supabase Dashboard → Authentication → URL Configuration, add your app URL(s) to **Redirect URLs** (e.g. `http://localhost:5173/` for dev).
  3. Customize the "Reset Password" email template in Authentication → Email Templates if desired. The `{{ .ConfirmationURL }}` variable is the reset link Supabase sends.
  