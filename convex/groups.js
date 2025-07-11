import { v } from "convex/values";
import { mutation, query } from "./_generated/server";
import { internal } from "./_generated/api";

export const getGroupExpenses = query({
    args:{
        groupId:v.id("groups")
    },
    handler:async(ctx , {groupId}) => {
        const currentUser = await ctx.runQuery(internal.users.getCurrentUser);

        const group = await ctx.db.get(groupId);
        if(!group) throw new Error('Group Not Found');

        if(!group.members.some((m) => m.userId === currentUser._id)) throw new Error('You are not a member of this group');

        const expenses = await ctx.db.query("expenses").withIndex("by_group",(q) => q.eq("groupId",groupId)).collect();

        const settlements = await ctx.db.query("settlements").filter((q) => q.eq(q.field("groupId"),groupId)).collect();

        // member map

        const memberDetails = await Promise.all(
            group.members.map(async(m) => {
                const u = await ctx.db.get(m.userId);
                return{
                    id:u._id,
                    name:u.name,
                    imageUrl:u.imageUrl,
                    role:u.role,
                };
            })
        );
        const ids = memberDetails.map((m) => m.id);

        // Balance calc. steps
        //
        //Initialize totals object to track overall balance for each user
        //Format : {userId1 : balance1, userId2 : balance2},

        const totals = Object.fromEntries(ids.map((id) => [id,0]));

        //Create a 2D ledger to track who owes whom
        //ledger[A][B] = how much A owes B

        const ledger = {};
        
        ids.forEach((a) => {
            ledger[a] = {};
            ids.forEach((b) => {
                if(a != b) ledger[a][b] = 0;

            })
        });

        //Apply expenses to balances 
        //.....................
        //Example:
        //- E1. user1 paid ₹60, split equally among 3 users (₹20 each)
        //- After applying this expense :
        //- totals = {user1 : +40, user2 : -20, user3 : -20}
        //- ledger = {
        //      "user1" : {"user2" : 0, "user3" :0},
        //      "user2" : {"user1" : 20, "user3" :0}
        //      "user3" : {"user1" : 20, "user2" :0},
        //            }
        //- this means user 2 owes user 1 ₹20 and user3 owes user1 ₹20
        
        for(const exp of expenses){
            const payer = exp.paidByUserId;

            for(const split of exp.splits){
                if(split.userId === payer || split.paid) continue;

                const debtor = split.userId;
                const amt = split.amount;

                //Update the totals : increase payer's balance , decrease debtor's balance 
                totals[payer] += amt;  //Payer gains credit
                totals[debtor] -= amt;  //Debtor goes into debt

                ledger[debtor][payer] += amt;
            }
        }

        //Apply the settlements to balances
        for(const s of settlements){
            //Update totals: increase payer's balance, decrease receiver's balance 
            totals[s.paidByUserId] += s.amount;
            totals[s.receivedByUserId] -= s.amount;

            //Update the ledger: reduce what the payer owes to the receiver
            ledger[s.paidByUserId][s.receivedByUserId] -= s.amount;
        }

        //Simplify the ledger (Debt Simplification)
        //Example :->with a circular debt 
        //Initial legder
        //User 1 owes User 2 $10
        //User 2 owes User 3 $15
        //User 3 owes User 1 $5
        //After simplification
        //User 1 owes User 2 $5
        //User 2 owes User 3 $15
        //User 3 owes User 1 $0
        ids.forEach((a) => {
            ids.forEach((b) => {
                if(a >= b) return;

                //Calculate the net debt between two users
                const diff = ledger[a][b] - ledger[b][a];
                if(diff > 0){
                    ledger[a][b] = diff;    //User A owes User B (net)
                    ledger[b][a] = 0;
                }else if(diff < 0){
                    ledger[b][a] = -diff;    //User B owes User A (net)
                    ledger[a][b] = 0;
                }else{
                    ledger[a][b] = ledger[b][a] = 0;    //They are even
                }
            })
        })

        //Format the response Data
        const balances = memberDetails.map((m) => ({
            ...m,
            totalBalance:totals[m.id],
            owes: Object.entries(ledger[m.id]).filter(([,val]) => val > 0).map(([to,amount]) => ({to,amount})),
            owedBy:ids.filter((other) => ledger[other][m.id] > 0).map((other) => ({
                from:other,
                amount:ledger[other][m.id]
            })),
        }));

        const userLookupMap = {};
        memberDetails.forEach((member) => {
            userLookupMap[member.id] = member;
        });

        return {
            //Group information
            group:{
                id:group._id,
                name:group.name,
                description:group.description,
            },
            members: memberDetails, //All group members with detials 
            expenses,               //All expenses in this group
            settlements,            //All settlements in this group
            balances,               //Calculated balance info for each member
            userLookupMap,          //Quick lookup for the user details
        };
    },
});

export const deleteGroupExpenses = mutation({
    args:{
        groupId : v.id("groups"),
    },
    handler:async(ctx,{groupId}) => {
        const user = await ctx.runQuery(internal.users.getCurrentUser);

        const expense = await ctx.db.get(groupId);
        if(!expense) throw new Error('Expense not found');

        //Check if the user is authorized to delete this expense
        //Only the creater of the expense or the payer can delete it
        if(expense.createdBy !== user._id && expense.paidByUserId !== user._id){
            throw new Error("You don't have the permission to delete this expense");
        }

        await ctx.db.delete(groupId);

        return {success : true};
    },
});

export const getGroupOrMembers = query({
    args:{
        groupId:v.optional(v.id("groups"),)
    },
    handler:async(ctx,{groupId}) => {
        const currentUser = await ctx.runQuery(internal.users.getCurrentUser);

        //Get all the groups where  the user is a  member 
        const allGroups = await ctx.db.query("groups").collect();
        const userGroups = allGroups.filter((group) => 
        group.members.some((member) => member.userId === currentUser._id));

        if(groupId){
            const selectGroup = userGroups.find(
                (group) => group._id === groupId
            );

            if(!selectGroup){
                throw new Error('Group not found or you are not the member of this group');
            }
            const memberDetails = await Promise.all(
                selectGroup.members.map(async(member) => {
                    const user = await ctx.db.get(member.userId);
                    if(!user) return null;

                    return{
                        id:user._id,
                        name:user.name,
                        email:user.email,
                        imageUrl:user.imageUrl,
                        role:member.role,
                    };
                })
            );

            const validMembers = memberDetails.filter((member) => member !== null);

            return {
                selectGroup:{
                    id:selectGroup._id,
                    name:selectGroup.name,
                    description:selectGroup.description,
                    createdBy:selectGroup.createdBy,
                    member:validMembers,
                },
                groups: userGroups.map((group) => ({
                    id:group._id,
                    name:group.name,
                    description:group.description,
                    memberCount:group.members.length,
                })),
            };
        }else{
            //Just return the list of groups wuthout the member details
            return{
                selectGroup:null,
                groups:userGroups.map((group) => ({
                    id:group._id,
                    name:group.name,
                    description:group.description,
                    memberCount:group.members.length,
                })),
            };
        }
    }
});