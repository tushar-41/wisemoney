import { v } from "convex/values";
import { mutation, query } from "./_generated/server";
import { internal } from "./_generated/api";

export const createSettlements = mutation({
    args:{
        amount:v.number(), //must be >0
        note:v.optional(v.string()),
        paidByUserId:v.id("users"),
        receicedByUserId:v.id("users"),
        groupId:v.optional(v.id("groups")),  //undefined when settling one-one expense
        relatedExpenseIds:v.optional(v.array(v.id("expenses"))),  
    },
    handler:async(ctx,args) => {
        const caller = await ctx.runQuery(internal.users.getCurrentUser);

        //basic validation check
        if(args.amount <= 0) throw new Error('Amount must be positive');
        if(args.paidByUserId === args.receicedByUserId){
            throw new Error('Payer and receiver cannot be the same user');
        }
        if(caller._id !== args.paidByUserId && caller._id !== receicedByUserId){
            throw new Error('You must be either the payer or the receiver');
        }

        //groups check (if provided)
        if(args.groupId){
            const group = await ctx.db.get(args.groupId);
            if(!group) throw new Error('Group not found');

            const isMember = (uid) => group.members.some((m) => m.userId === uid);
            if(!isMember(args.paidByUserId) || !isMember(args.receicedByUserId)){
                throw new Error('Both parties must be member of the groups');
            }
        }

        return await ctx.db.insert("settlements",{
            amount:args.amount,
            note:args.note,
            date:new Date().now(),
            paidByUserId:args.paidByUserId,
            receivedByUserId:args.receicedByUserId,
            groupId:args.groupId,
            relatedExpenseIds:args.relatedExpenseIds,
            createdBy:caller._id,
        });
    },
});

export const settlementData = query({
    args:{
        entityType:v.string(), //user | group
        entityId:v.string(), //convex_id (string form) of the user or the group
    },
    handler:async(ctx,args) => {
        const me = await ctx.runQuery(internal.users.getCurrentUser);

        if(args.entityType === "user"){
            const other = await ctx.db.get(args.entityId);
            if(!other) throw new Error('user not found');

            //gather all of the expenses where either of us paid or appeared in the split 
            const allExpenses = await ctx.db.query("expenses").withIndex("by_user_and_group",(q) => q.eq("paidByUserId",me._id).eq("groupId",undefined)).collect();

            //other user expenses
            const otherExpenses = await ctx.db.query("expenses").withIndex("by_user_and_group",(q) => q.eq("paidByUserId",other._id).eq("groupId",undefined)).collect();

            const expenses = [...allExpenses,...otherExpenses];

            let owed = 0; //they owe me
            let owing = 0; //I owe them

            for(const exp of expenses){
                const involvesMe = exp.paidByUserId === me._id || 
                exp.splits.some((s) => s.userId === me._id);
                
                const involveThem = exp.paidByUserId === other._id ||
                exp.splits.some((s) => s.userId === other._id);

                if(!involveThem || !involvesMe) continue;

                //case 1: I paid
                if(exp.paidByUserId === me._id){
                    const split = exp.splits.find((s) => s.userId === other._id && !s.paid);
                    if(split) owed += split.amount;
                }

                if(exp.paidByUserId === other._id){
                    const split = exp.splits.find((s) => s.userId === other._id && !s.paid);
                    if(split) owing += split.amount;
                } 
            }
            
            //Settlements 
            const mySettlements = await ctx.db.query("settlements").withIndex("by_user_and_group",(q) => q.eq("paidByUserId",me._id).eq("groupId",undefined)).collect();
             
            //other settlements
            const otherUserSettlements = await ctx.db.query("settlements").withIndex("by_user_and_group",(q) => q.eq("paidByUserId",other._id).eq("groupId",undefined)).collect();

            const settlements = [...mySettlements,...otherUserSettlements];

            for(const s of settlements){
                if(s.paidByUserId === me._id){
                    //I paid them => my owing goes down 
                    owing = Math.max(0,owed - s.amount);
                }else{
                    //They paid me => their owing goes down
                    owed = Math.max(0,owed - s.amount);
                }
            }

            return {
                type:"user",
                counterPart:{
                    userId:other._id,
                    name:other.name,
                    email:other.email,
                    imageUrl:other.imageUrl,
                },
                youAreOwed:owed,
                youOwe:owing,
                netBalance:owed - owing, //=>you should receive , =>you should pay
            };
        }else if(args.entityType === "group"){
            /* ──────────────────────────────────────────────────────── group page */
      const group = await ctx.db.get(args.entityId);
      if (!group) throw new Error("Group not found");

      const isMember = group.members.some((m) => m.userId === me._id);
      if (!isMember) throw new Error("You are not a member of this group");

      // ---------- expenses for this group
      const expenses = await ctx.db
        .query("expenses")
        .withIndex("by_group", (q) => q.eq("groupId", group._id))
        .collect();

      // ---------- initialise per‑member tallies
      const balances = {};
      group.members.forEach((m) => {
        if (m.userId !== me._id) balances[m.userId] = { owed: 0, owing: 0 };
      });

      // ---------- apply expenses
      for (const exp of expenses) {
        if (exp.paidByUserId === me._id) {
          // I paid; others may owe me
          exp.splits.forEach((split) => {
            if (split.userId !== me._id && !split.paid) {
              balances[split.userId].owed += split.amount;
            }
          });
        } else if (balances[exp.paidByUserId]) {
          // Someone else in the group paid; I may owe them
          const split = exp.splits.find((s) => s.userId === me._id && !s.paid);
          if (split) balances[exp.paidByUserId].owing += split.amount;
        }
      }

      // ---------- apply settlements within the group
      const settlements = await ctx.db
        .query("settlements")
        .filter((q) => q.eq(q.field("groupId"), group._id))
        .collect();

      for (const st of settlements) {
        // we only care if ONE side is me
        if (st.paidByUserId === me._id && balances[st.receivedByUserId]) {
          balances[st.receivedByUserId].owing = Math.max(
            0,
            balances[st.receivedByUserId].owing - st.amount
          );
        }
        if (st.receivedByUserId === me._id && balances[st.paidByUserId]) {
          balances[st.paidByUserId].owed = Math.max(
            0,
            balances[st.paidByUserId].owed - st.amount
          );
        }
      }

      // ---------- shape result list
      const members = await Promise.all(
        Object.keys(balances).map((id) => ctx.db.get(id))
      );

      const list = Object.keys(balances).map((uid) => {
        const m = members.find((u) => u && u._id === uid);
        const { owed, owing } = balances[uid];
        return {
          userId: uid,
          name: m?.name || "Unknown",
          imageUrl: m?.imageUrl,
          youAreOwed: owed,
          youOwe: owing,
          netBalance: owed - owing,
        };
      });

      return {
        type: "group",
        group: {
          id: group._id,
          name: group.name,
          description: group.description,
        },
        balances: list,
      };
    }

    /* ── unsupported entityType ──────────────────────────────────────────── */
    throw new Error("Invalid entityType; expected 'user' or 'group'");
    },
});