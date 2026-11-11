---
name: features-mutations
description: Next.js Server Actions and mutations - form handling, useActionState, redirect and notFound, cookies in actions, and cache invalidation after writes.
---

# Mutations with Server Actions

## Defining a Server Action

```tsx
// app/actions.ts
'use server'

export async function createPost(formData: FormData) {
  const title = formData.get('title') as string
  const post = await db.post.create({ data: { title } })
  revalidatePath('/blog')
  return post
}
```

- The directive goes at the top of an **async** function or a whole file.
- Actions use `POST` and can be invoked by **direct HTTP requests** — always check auth inside the action.
- By convention, a Server Action is an async function used with `startTransition`; that happens automatically when it is passed to `<form action>` or `<button formAction>`.
- A single server round trip can return **both** the updated UI and fresh data.

## Calling an action

```tsx
// Server Component — progressive enhancement by default
<form action={createPost}>
  <input name="title" />
  <button>Save</button>
</form>
```

```tsx
// Client Component — import from a 'use server' file
'use client'
import { createPost } from './actions'
import { useActionState } from 'react'

const [state, formAction, isPending] = useActionState(createPost, { error: null })
```

- Forms calling Server Actions work **before JS loads** (progressive enhancement). In a Client Component the submission is queued until hydration, then prioritized.
- After hydration, the browser does **not** reload on submit — React handles it.

## After a mutation

```tsx
import { revalidatePath, revalidateTag, updateTag } from 'next/cache'
import { redirect, notFound } from 'next/navigation'
import { cookies } from 'next/headers'

async function createPost(formData: FormData) {
  const post = await db.post.create({ data: { title: formData.get('title') as string } })

  updateTag(`post:${post.id}`)      // read-your-own-writes (Server Actions only)
  revalidatePath('/blog')           // invalidate a path
  redirect('/blog')                 // throws — must be outside try/catch
}
```

- `redirect()` and `notFound()` **throw** — never call them inside a `try/catch` that swallows the error, or the redirect silently fails.
- `redirect` defaults to `push` inside Server Actions and `replace` elsewhere; pass `type` explicitly.
- `cookies().set()` / `.delete()` work in Server Actions and Route Handlers.
- `after()` runs work **after** the response is finished (logging, analytics) — it still runs if the response errors or `notFound`/`redirect` was called.

## Forms

```tsx
import Form from 'next/form'

<Form action="/search">           {/* string action → GET, params in URL */}
  <input name="q" />
</Form>
```

- `<Form>` with a **string** action behaves like a native GET form but prefetches the target and navigates client-side.
- `<Form>` with a **function** action behaves like a React `<form>`.
- Use `useFormStatus` (from `react-dom`) in the submit button to read `pending`/`data`/`method` of the nearest parent form.

## Security

- Server Functions are **public HTTP endpoints** — treat them like API routes.
- Validate and authorize inside **every** action; never rely on the UI hiding the button.
- Do not pass secrets or non-serializable values to/from the client.
- Use the Data Security guide for DTO patterns and DAL (data access layer) recommendations.

<!--
Source references:
- https://nextjs.org/docs/app/getting-started/mutating-data
- https://nextjs.org/docs/app/guides/server-actions
- https://nextjs.org/docs/app/guides/forms
- https://nextjs.org/docs/app/api-reference/components/form
- https://nextjs.org/docs/app/api-reference/functions/redirect
- https://nextjs.org/docs/app/api-reference/functions/after
-->
