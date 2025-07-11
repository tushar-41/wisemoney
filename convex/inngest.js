import { query } from "./_generated/server";

export const getUserWithOutstandingDebts = query({
    handler:async(ctx) => {
        const user = await ctx.db.query("users").collect();
        const result = [];

        //Laod every 1-1 expense once (groupId === undefined)
        const expenses = await ctx.db.query("expenses").filter((q) => q.eq(q.field("groupId"), undefined)).collect();

        //Load all the settlements to made the final calculations (groupId === undefined)
        const settlements = await ctx.db.query("settlements").filter((s) => s.eq(s.field("groupId"), undefined)).collect();

        const userCache = new Map();
        const getUser = async(id) => {
            if(!userCache.has(id)) userCache.set(id,await ctx.db.get(id));
            return userCache.get(id);
        };

        for(const u of user){
            //Map<counterId, {amount: number, since: number}>
            //+Amount => user owes counterparty
            //-Amount => counterParty owes user
            const ledger = new Map();
            
            for(const exp of expenses){
                //case A : somebody else paid , and the user appears in the splits
                if(exp.paidByUserId !== u._id){
                    const split = exp.splits.find(
                        (s) => s.userId === u._id && !s.paid
                    );
                    if(!split) continue;

                    const entry = ledger.get(exp.paidByUserId) ?? {
                        amount: 0,
                        since: exp.date,
                    };
                    entry.amount += split.amount; //user owes
                    entry.since = Math.min(entry.since, exp.date);
                    ledger.set(exp.paidByUserId,entry);
                }else{
                    //Case B: user paid, others appear in splits
                    for(const s of exp.splits){
                        if(s.userId === u._id || s.paid) continue;

                        const entry = ledger.get(s.userId) ?? {
                            amount: 0,
                            since: exp.date, //will be ignored while amount <= 0
                        };
                        entry.amount -= s.amount;
                        ledger.set(s.userId,entry);
                    }
                }
            }

            for(const st of settlements){
                //User has paid someone -> reduce positive amount owed to that someone 
                if(st.paidByUserId === u._id){
                    const entry = ledger.get(st.receivedByUserId);
                    if(entry){
                        entry.amount -= st.amount;
                        if(entry.amount === 0) ledger.delete(st.receivedByUserId);
                        else ledger.set(st.receivedByUserId,entry);
                    }
                }else if(st.receivedByUserId === u._id){   //Someone paid user -> reduce the negative balance (they owe user)
                    const entry = ledger.get(st.paidByUserId);
                    if(entry){
                        entry.amount += st.amount;  //entry amount is negative
                        if(entry.amount === 0) ledger.delete(st.paidByUserId);
                        else ledger.set(st.paidByUserId, entry);
                    }
                }
            }
            const debts = [];
            for(const [counterId, {amount,since}] of ledger){
                if(amount > 0){
                    const counter = await getUser(counterId);
                    debts.push({
                        userId:counterId,
                        name:counter?.name ?? "Unknown",
                        amount,
                        since,
                    });
                }
            }

            if(debts.length){
                result.push({
                    _id:u._id,
                    name:u.name,
                    email:u.email,
                    debts,
                });
            }
        }
        return result;
    },
});

