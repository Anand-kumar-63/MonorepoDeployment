  import "dotenv/config";
  import { prismaClient } from "@repo/db";
  export default async function Home() {
    const user = await prismaClient.user.findMany();
    return <div>{JSON.stringify(user)}</div>;
  }

