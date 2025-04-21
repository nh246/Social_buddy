"use server";

import prisma from "@/lib/prisma";
import { auth, currentUser } from "@clerk/nextjs/server";

// sync the user with the database
export async function syncUser() {
  try {
    const { userId } = await auth();
    const user = await currentUser();

    if (!userId || !user) return;

    // check if the user is available in the database
    const existingUser = await prisma.user.findUnique({
      where: {
        clerkId: userId,
      },
    });

    if (existingUser) return existingUser;

    const dbUser = await prisma.user.create({
      data: {
        clerkId: userId,
        name: `${user.firstName || ""} ${user.lastName || ""}`,
        username:
          user.username ?? user.emailAddresses[0].emailAddress.split("@")[0],
        email: user.emailAddresses[0].emailAddress,
        image: user.imageUrl,
      },
    });
    return dbUser;
  } catch (error) {
    console.log("Error in syncUser", error);
  }
}

// get user by clerkId
export async function getUserByClerkId(clerkId:string){
  return prisma.user.findUnique({
    where:{
      clerkId,
    },
    include:{
      _count: {
        select:{
          followers: true,
          following: true,
          posts: true,
        }
      }
    }
  })
}

// get database user id
export async function getDbUserId(){
  const { userId: clerkId } = await auth();
  if(!clerkId) throw new Error("Unauthorized");

  const user = await getUserByClerkId(clerkId);
  if(!user) throw new Error("User not found");

  return user.id
}