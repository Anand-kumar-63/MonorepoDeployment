import { prismaClient } from "db/clients";
export default async function Home() {
  const user = prismaClient.user.findMany();
  return <div>{JSON.stringify(user)}</div>;
}
