import {defineSchema, defineTable} from 'convex/server';
import { v } from 'convex/values';

export default defineSchema({
    users:defineTable({
        name: v.string(),
        email: v.optional(v.string()),
        tokenIdentifier: v.string(),
        imageUrl: v.optional(v.string()),
    }).index("by_token", ["tokenIdentifier"])
      .index("by_email", ["email"])
      .searchIndex("search_name", {searchField:"name"})
      .searchIndex("search_email", {searchField:"email"}),

    expenses:defineTable({
        description:v.string(),
        amount:v.number(),
        category:v.optional(v.string()),
        date:v.number(),
        paidByUserId:v.id("users"),
        splitType:v.string(),
        splits:v.array(
            v.object({
                userId:v.id("users"), //Reference to the user
                amount:v.number(), //amount owed by this user
                paid:v.boolean(),
            })
        ),
        groupId:v.optional(v.id("groups")),  //Null ofr one-on-one expense
        createdBy:v.id("users"), //reference to the users table
    }).index("by_group",["groupId"])
      .index("by_user_and_group",["paidByUserId","groupId"])
      .index("by_date",["date"]), 

    groups:defineTable({
        name:v.string(),
        description:v.optional(v.string()),
        createdBy:v.id("users"),  //Reference to the users table
        members:v.array(
            v.object({
                userId:v.id("users"),
                role:v.string(),
                joinedAt:v.number(),
            })
        ),
    }),

    settlements:defineTable({
        amount:v.number(),
        note:v.optional(v.string()),
        date:v.number(), //Timestamp
        paidByUserId:v.id("users"), //Reference to users table
        receivedByUserId:v.id("users"), //Reference to suers table
        groupId:v.optional(v.id("groups")), //Null for the one-one settlements
        relatedExpenseIds:v.optional(v.array(v.id("expenses"))), //Which expenses this settlements cover
        createdBy:v.id("users"), //Reference to users table
    }).index("by_group",["groupId"])
      .index("by_user_and_group",["paidByUserId","groupId"])
      .index("by_receiver_and_group",["receivedByUserId" , "groupId"])
      .index("by_date",["date"]),
});