# Debugging Prisma Migration Issues with PostgreSQL Docker

When Prisma migration fails with PostgreSQL running inside Docker, debug layer by layer instead of randomly changing files.

Flow:

Application (Prisma)
        |
DATABASE_URL
        |
Docker Port Mapping
        |
PostgreSQL Container
        |
Database/User/Password

## 1. Understand Prisma Error

### P1000 - Authentication Failed

```bash
Error: P1000: Authentication failed against database server
```

Meaning: Prisma reached PostgreSQL but login failed.

Possible reasons:
- Wrong username
- Wrong password
- Database user does not exist

### P1001 - Cannot Reach Database

```bash
Error: P1001: Can't reach database server
```

Meaning: Prisma cannot connect to PostgreSQL.

Possible reasons:
- Container stopped
- Wrong port
- Wrong host

---

## 2. Check PostgreSQL Container

Run:

```bash
docker ps
```

Example:

```txt
postgres  0.0.0.0:5434->5432/tcp
```

Meaning:

```
localhost:5434 ---> PostgreSQL container:5432
```

If container is stopped:

```bash
docker ps -a
docker start <container-name>
```

---

## 3. Verify Port Mapping

Example:

```txt
5434:5432
```

Left side = your machine port  
Right side = container port

DATABASE_URL must use left side:

```env
DATABASE_URL="postgresql://user:password@localhost:5434/db"
```

---

## 4. Check Actual PostgreSQL Credentials

Check container environment:

```bash
docker exec postgres-db env
```

Verify:

```env
POSTGRES_USER=anand
POSTGRES_PASSWORD=mysecretpassword
POSTGRES_DB=mydatabase
```

DATABASE_URL format:

```env
postgresql://USERNAME:PASSWORD@HOST:PORT/DATABASE
```

Example:

```env
DATABASE_URL="postgresql://anand:mysecretpassword@localhost:5434/mydatabase"
```

---

## 5. Test PostgreSQL Without Prisma

Before blaming Prisma, directly login:

```bash
docker exec -it postgres-db psql -U anand -d mydatabase
```

Success:

```bash
mydatabase=#
```

means:

- Container works
- Database exists
- User exists
- Credentials are correct

Error:

```bash
FATAL: role "anand" does not exist
```

means user was never created.

---

## 6. Check Docker Environment Variables

Correct PostgreSQL variables:

```env
POSTGRES_USER
POSTGRES_PASSWORD
POSTGRES_DB
```

Wrong:

```env
POSTGRES_NAME
POSTGRES_USERNAME
POSTGRES_DATABASE
```

Example mistake:

```bash
-e POSTGRES_NAME=anand
```

This does nothing.

Correct:

```bash
-e POSTGRES_USER=anand
```

---

## 7. Remember PostgreSQL Docker Rule

PostgreSQL creates users and databases only during first initialization.

Changing:

```env
POSTGRES_USER
POSTGRES_PASSWORD
```

after container creation will not update anything.

Recreate container:

```bash
docker stop postgres-db
docker rm postgres-db
docker volume prune
```

Create fresh:

```bash
docker run --name postgres-db \
-e POSTGRES_USER=anand \
-e POSTGRES_PASSWORD=mysecretpassword \
-e POSTGRES_DB=mydatabase \
-p 5434:5432 \
-d postgres
```

---

## 8. Check Prisma Environment Loading

If using `prisma.config.ts`, make sure `.env` loads:

```ts
import "dotenv/config";

import { defineConfig, env } from "prisma/config";

export default defineConfig({
 schema:"prisma/schema.prisma",
 datasource:{
   url: env("DATABASE_URL")
 }
});
```

---

## 9. Verify Prisma Schema

`schema.prisma`

```prisma
datasource db {
 provider = "postgresql"
 url = env("DATABASE_URL")
}
```

Provider must match your database.

---

## 10. Run Prisma Migration

Generate client:

```bash
bunx prisma generate
```

Run migration:

```bash
bunx prisma migrate dev
```

---

# Debugging Checklist

✔ Docker container running?

```bash
docker ps
```

✔ Correct port mapping?

```
5434 -> 5432
```

✔ Correct DATABASE_URL?

✔ Correct PostgreSQL user/password/database?

✔ Can login using psql?

✔ Does database role exist?

✔ Is Prisma loading `.env`?

✔ Is schema provider correct?

---

# Golden Rule

Debug in this order:

1. Docker container
2. PostgreSQL connection
3. Credentials
4. DATABASE_URL
5. Prisma configuration
6. Migration

Prisma migration is the final layer. Most problems come from incorrect Docker/PostgreSQL setup.