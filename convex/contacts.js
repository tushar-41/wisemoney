import { mutation, query } from "./_generated/server";
import {internal} from './_generated/api';
import { v } from "convex/values";

export const getAllContacts = query({
    handler:async(ctx) => {
        const currentUser = await ctx.runQuery(internal.users.getCurrentUser);

        const expensesYouPaid = await ctx.db.query("expenses").withIndex("by_user_and_group",(q) => 
            q.eq("paidByUserId",currentUser._id).eq("groupId",undefined)
        ).collect();

        const expensesNotPaidByYou = (await ctx.db.query("expenses").withIndex("by_group",
            (q) =>  q.eq("groupId",undefined)).collect()).filter((e) => e.paidByUserId !== currentUser._id &&
        e.splits.some((s) => s.userId === currentUser._id));

        const personalExpenses = [...expensesYouPaid, ...expensesNotPaidByYou];

        const contactIds = new Set();
        personalExpenses.forEach((exp) => {
            if(exp.paidByUserId !== currentUser._id) contactIds.add(exp.paidByUserId);
            
            //Add each user in the splits that isn't the current user
            exp.splits.forEach((s) => {
                if(s.userId !== currentUser._id) contactIds.add(s.userId);
            });
        });

        const contactUsers = await Promise.all(
            [...contactIds].map(async(id) => {
                const u = await ctx.db.get(id);
                return u ? {
                    id:u._id,
                    name:u.name,
                    email:u.email,
                    imageUrl:u.imageUrl,
                    type:"user", // Add a type marker to distinguish from groups
                }
                : null;
            })
        );

        const userGroups = (await ctx.db.query("groups").collect()).filter((g) =>g.members
        .some((m) => m.userId === currentUser._id))
        .map((g) => ({
            id:g._id,
            name:g.name,
            description:g.description,
            memberCount:g.members.length,
            type:"groups" // Add a type marker to distinguish from users
        }));

    //Step 8 : Sort the results alphabetically by name 
    //Optional

    //Step 9 : return the results, filtering out any null values from the contact users

    return{
        users:contactUsers.filter(Boolean),
        groups:userGroups,
    };
    },
});

export const createGroup = mutation({
    args:{
        name:v.string(),
        description:v.string(),
        members:v.array(v.id("users")),
    },
    handler: async(ctx,args) => {
        const currentUser = await ctx.runQuery(internal.users.getCurrentUser);

        if(!args.name.trim()) throw new Error("Groups name cannnot be empty");

        const uniqueMembers = new Set(args.members);

        uniqueMembers.add(currentUser._id);

        for(const id of uniqueMembers){
            if(!(await ctx.db.get(id)))
                throw new Error(`User with ID : ${id} not found`);
        }

        return await ctx.db.insert("groups",{
            name:args.name.trim(),
            description:args.description?.trim() ?? "",
            createdBy:currentUser._id,
            members:[...uniqueMembers].map(id => ({
                userId:id,
                role:id === currentUser._id ? "admin" : "member",
                joinedAt:Date.now(),
            })),
        });
    },
});