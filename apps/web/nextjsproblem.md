# Next.js Static Site Generation (SSG)
In Next.js, when we create a production build using:
npm run build

Next.js generates a `.next` folder. This folder contains the optimized production version of our application, including pre-rendered HTML pages, JavaScript bundles, and other build files.

By default, Next.js tries to optimize pages by generating them statically whenever possible. This process is called **Static Site Generation (SSG)**.

In Static Site Generation, Next.js fetches the required data and generates the HTML pages at build time. Once the build is completed and the `.next` folder is created, those generated pages are stored and served directly to users.

For example, suppose a page fetches data from a database:

- User 1
- User 2
- User 3

When we run the build command, Next.js calls the database/API once, fetches this data, generates the HTML page, and stores it.

After deployment, whenever a user visits the website, Next.js does not call the database again. Instead, it directly serves the already generated static HTML file from the `.next` folder.

This makes the website extremely fast because there is no database query or server-side computation required for every user request.

Example Flow:

Build Time:
Database
    |
    |
Next.js fetches data
    |
    |
Creates Static HTML
    |
    |
Stores inside .next folder


User Request:

User visits website
        |
        |
Next.js returns already generated HTML


However, there is one limitation of Static Site Generation.
If new data is added to the database after the website has already been built, the static page will not automatically update.
Example:
During build:
Database:
Post 1
Post 2
Post 3

HTML generated with:
Post 1
Post 2
Post 3

Later, someone adds:
Post 4

The database now contains:
Post 1
Post 2
Post 3
Post 4

But users will still see:

Post 1
Post 2
Post 3

because Next.js is serving the previously generated static HTML page.
Next.js will not automatically call the database again to fetch the new data unless we rebuild the application or use other rendering techniques.

Benefits of Static Site Generation:
1. Very Fast Performance

Pages are already generated before users request them, so the response time is very low.
2. Better SEO Optimization

Search engines receive fully generated HTML content immediately, making it easier for them to crawl and index the website.
3. Less Server Load

Because pages are static, the server does not need to repeatedly fetch data or regenerate pages for every request.
SSG is best for:

- Blogs
- Documentation websites
- Portfolio websites
- Landing pages
- Marketing pages
- Product pages where data does not change frequently


To handle frequently changing data, Next.js provides other approaches:


1. Dynamic Rendering
Using
export const dynamic = "force-dynamic";
This forces Next.js to fetch fresh data on every request.
Flow:
User Request
       |
       |
Next.js Server
       |
       |
Database/API Call
       |
       |
Fresh HTML Response

2. Incremental Static Regeneration (ISR)
Using:
export const revalidate = 60;
ISR allows Next.js to keep the benefits of static generation while updating the page after a specific time interval.
Example:
revalidate = 60
means Next.js will regenerate the page every 60 seconds with updated database data.

Final Summary:
Static Site Generation in Next.js generates pages during build time and stores them inside the `.next` folder. After deployment, Next.js serves these pre-generated pages without calling the database again. This provides excellent speed and SEO benefits, but new database changes will not appear automatically unless we rebuild the application or use techniques like ISR or dynamic rendering.


## Why Nextjs Projects Dockerfile becomes tricky??
If your frontend build needs to talk to the database during the build phase
# Why Next.js Build Fails When PostgreSQL Docker Container Is Stopped

When using Next.js with Prisma and PostgreSQL running inside Docker, stopping the PostgreSQL container can cause the Next.js production build to fail.

This happens because Next.js may need database access during the build process.

Example:

```tsx
import { prismaClient } from "@repo/db";

export default async function Home(){

 const users = await prismaClient.user.findMany();

 return (
   <div>{JSON.stringify(users)}</div>
 )
}
```

Here the page is directly executing a Prisma query:

```ts
await prismaClient.user.findMany()
```

inside a Server Component.

## What Happens During next build

When we run:

```bash
npm run build
```

Next.js creates the `.next` folder containing the optimized production build.

By default, Next.js tries to optimize pages using Static Site Generation (SSG).

If a page does not contain dynamic behavior, Next.js executes the page during build time and generates static HTML.

Flow:

```
next build
     |
Execute Server Component
     |
Run Prisma Query
     |
Connect PostgreSQL
     |
Fetch Database Data
     |
Generate Static HTML
     |
Store inside .next folder
```

## When PostgreSQL Docker Is Running

If the container is active:

```bash
docker ps
```

Example:

```
postgres-db running
localhost:5434 -> container:5432
```

Flow:

```
Next.js Build
      |
Prisma Client
      |
PostgreSQL Docker
      |
Database Response
      |
HTML Generated
      |
.next Created
```

The build succeeds because Prisma can connect to PostgreSQL.

## When PostgreSQL Docker Is Stopped

If we stop the database:

```bash
docker stop postgres-db
```

PostgreSQL is no longer available.

During build:

```
Next.js Build
      |
Prisma Query Runs
      |
Connect localhost:5434
      |
No Database Found
      |
Connection Failed
      |
Build Failed
```

The issue is not Docker or Prisma.  
The problem is Next.js is trying to fetch database data during build time.

## Why Does Next.js Call Database During Build?

Next.js App Router uses Server Components.

Server Components can directly access:

- Databases
- APIs
- Backend logic

Example:

```tsx
export default async function Home(){

 const users = await prismaClient.user.findMany();

}
```

Next.js sees this page can be static, so it runs the query during:

```bash
next build
```

The generated HTML is stored inside:

```
.next/
```

and served to users.

## Solution 1: Keep Database Running During Build

Start PostgreSQL:

```bash
docker start postgres-db
```

Then:

```bash
npm run build
```

This works because the database is available when Next.js generates static pages.

## Solution 2: Use Dynamic Rendering

Tell Next.js:

"Do not fetch data during build. Fetch data when users request the page."

Add:

```tsx
export const dynamic = "force-dynamic";
```

Example:

```tsx
export const dynamic = "force-dynamic";

import { prismaClient } from "@repo/db";

export default async function Home(){

 const users = await prismaClient.user.findMany();

 return(
  <pre>
   {JSON.stringify(users,null,2)}
  </pre>
 )
}
```

Now the behavior changes.

Before:

```
Build Time
    |
Database Query
    |
Static HTML
```

After:

```
Build Time
    |
Create Application

User Request
    |
Run Server Component
    |
Prisma Query
    |
Database
    |
Fresh Response
```

The database is required only when users visit the website.

## Solution 3: Incremental Static Regeneration (ISR)

Use:

```tsx
export const revalidate = 60;
```

Meaning:

Regenerate the static page every 60 seconds.

Flow:

```
Generate Static Page
        |
Cache HTML
        |
After 60 seconds
        |
Fetch New Data
        |
Update Page
```

## Final Summary

The Next.js build fails when PostgreSQL Docker is stopped because the Prisma query runs while creating the `.next` folder.

This happens because Next.js uses Static Site Generation by default whenever possible.

A Server Component with:

```ts
await prismaClient.user.findMany()
```

can execute during build time.

To prevent database dependency during build:

```tsx
export const dynamic = "force-dynamic";
```

This moves database fetching from build time to request time.