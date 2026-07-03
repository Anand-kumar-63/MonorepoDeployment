import { prismaClient } from "@repo/db";
export default async function Home() {
  const user = prismaClient.user.findMany();
  return <div>{JSON.stringify(user)}</div>;
}
