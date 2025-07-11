import { internal } from "./_generated/api";
import { query } from "./_generated/server";

export const getUserBalances = query({            //Getting expenses of user
    handler:async(ctx) => {
        const user = await ctx.runQuery(internal.users.getCurrentUser);

        //FILTER THE EXPENSES TO ONLY INCLUDE ONE-ON-ONE EXPENSES (not group expenses)
        //where the current user either the payer or in th splits
        const expenses = (await ctx.db.query("expenses").collect()).filter(
            (e)=>
                !e.groupId && //1-1 only
            (e.paidByUserId === user._id || e.splits.some((s) => s.userId === user._id))
        );

        let youOwe = 0; //Total amount user owes others
        let youAreOwed = 0; //Total amount others owe the user
        const balanceByUser = {}; //Detailed breakdown per user process each expenses to calculate balances

        for(const e of expenses){
            const isPayer = e.paidByUserId === user._id;
            const mySplit = e.splits.find((s) => s.userId === user._id);

            if(isPayer){
                for(const s of e.splits){
                    if(s.userId === user._id || s.paid) continue;

                    //Add to amount owed to the user
                    youAreOwed += s.amount;
                    
                    (balanceByUser[s.userId] ??= {owed:0,owing:0}).owed += s.amount;
                }
            }else if(mySplit && !mySplit.paid){
                //Someone else paid and user hasn't paid their split
                youOwe += mySplit.amount;

                //Add to the amount the current user owes to the payer
                (balanceByUser[e.paidByUserId] ??= {owed:0,owing:0}).owing += mySplit.amount;
            }
        }

        //get settlements that directly involve the current user
        const settlements = (await ctx.db.query("settlements").collect()).filter((s) => !s.groupId && 
        (s.paidByUserId === user._id || s.receivedByUserId === user._id) 
        );

        for(const s of settlements){
            if(s.paidByUserId === user._id){
                //user paid someone else -> reduce what user owes
                youOwe -= s.amount;
                (balanceByUser[s.receivedByUserId] ??= {owed:0,owing:0}).owing -= s.amount;
            }else{
                //Someone paid the user -> reduces what they owe the user
                youAreOwed -= s.amount;
                (balanceByUser[s.paidByUserId] ??= {owed:0,owing:0}).owed -= s.amount;
            }
        }

        //build the lists for UI
        const youOweList = []; //List if people user owes money to
        const youAreOwedByList = []; //list of people who owe the user

        for(const [uid,{owed,owing}] of Object.entries(balanceByUser)){
            const net = owed - owing; //net balances
            if(net === 0) continue; //Skip the balances

            //Get the user detials now 
            const counterPart = await ctx.db.get(uid);
            const base = {
                userId:uid,
                name:counterPart?.name??"Unknown",
                imageUrl:counterPart?.imageUrl,
                amount:Math.abs(net),
            }

            net > 0 ? youAreOwedByList.push(base) : youOweList.push(base);
        }

        youOweList.sort((a,b) => b.amount - a.amount);
        youAreOwedByList.sort((a,b) => b.amount - a.amount);

        return {
            youOwe, //total amount user owes
            youAreOwed, //Total amount owed to user
            totalBalance:youAreOwed-youOwe, //Net balance
            oweDetails:{youOwe: youOweList, youAreOwedBy:youAreOwedByList}, //Detailed list
        };
    },
});

export const getTotalSpent = query({
    handler:async(ctx) => {
        const user = await ctx.runQuery(internal.users.getCurrentUser);

        const currentYear = new Date().getFullYear();
        const startOfYear = new Date(currentYear,0,1).getTime();

        const expenses = await ctx.db.query("expenses").withIndex("by_date" , (q)=>q.gte("date", startOfYear)).collect();

        //Filter expenses to only include those where the user is involved
        const userExpenses = expenses.filter((expense) => expense.paidByUserId === user._id ||
        expense.splits.some((split) => split.userId === user._id));

        let totalSpent = 0;
        userExpenses.forEach((expense) => {
            const userSplit = expense.splits.find((split) => split.userId === user._id);

            if(userSplit){
                totalSpent += userSplit.amount;
            }
        });

        return totalSpent;   
    },
});

export const getMonthlySpending = query({
    handler:async(ctx) => {
        const user = await ctx.runQuery(internal.users.getCurrentUser);

        //Get current year and its start timestamp
        const currentYear = new Date().getFullYear();
        const startOfYear = new Date(currentYear,0,1).getTime();

        //Get all expenses for current year
        const allExpenses = await ctx.db.query("expenses").withIndex("by_date",(q)=> q.gte("date", startOfYear))
        .collect();

        const userExpenses = allExpenses.filter((expense) => expense.paidByUserId === user._id ||
        expense.splits.some((split) => split.userId === user._id));

        const monthlyTotals = {};

        for(let i=0 ; i<12 ; i++){
            const monthDate = new Date(currentYear,i,1);
            monthlyTotals[monthDate.getTime()] = 0;
        }

        userExpenses.forEach((expense) => {
            const date = new Date(expense.date);

            const monthStart = new Date(
                date.getFullYear(),
                date.getMonth(),
                1
            ).getTime();
            
            const userSplit = expense.splits.find(
                (split) => split.userId === user._id );
             
            if(userSplit){
                monthlyTotals[monthStart] = (monthlyTotals[monthStart] || 0) + userSplit.amount;
            }    
        });

        const result = Object.entries(monthlyTotals).map(([month,total]) => ({
            month: parseInt(month),
            total,
        }));

        //Sort the month in cronological order
        result.sort((a,b) => a.month - b.month);
        return result;
    },
});

export const getUserGroups = query({
    handler:async(ctx) => {
        const user = await ctx.runQuery(internal.users.getCurrentUser);

        //Get all groups from the database
        const allgroups = await ctx.db.query("groups").collect();

        //Filter the only include groups where the user is a member 
        const groups = allgroups.filter((group)=> group.members.some((member) => member.userId === user._id));

        const enhancedGroups = await Promise.all(
            groups.map(async(group) => {
                const expenses = await ctx.db.query("expenses").withIndex("by_group",(q) => q.eq("groupId",group._id)).collect();

                let balance = 0;

            //Calculate the balance from the expenses
            expenses.forEach((expense) => {
                if(expense.paidByUserId === user._id){
                    //User paid for the expense others may owe him
                    expense.splits.forEach((split) => {
                        //Add the amount other owe's to the user (excluding user's own split and paid split)
                        if(split.userId !== user._id && !split.paid){
                            balance += split.amount;
                        }
                    });
                }else{
                    //Someone else paid user may owe them
                    const userSplit = expense.splits.find((split)=> split.userId === user._id);
                    //Subtract amounts the user owes others
                    if(userSplit && !userSplit.paid){
                        balance -= userSplit.amount;
                    }
                }
            });
            //Apply settlements to adjust the balance 
            const settlements = await ctx.db.query("settlements").filter((q) => q.and(q.eq(q.field("groupId"),group._id),
        q.or(
            q.eq(q.field("paidByUserId"),user._id),
            q.eq(q.field("receivedByUserId"),user._id), 
        )
        )).collect(); 

        settlements.forEach((settlement) => {
            if(settlement.paidByUserId === user._id){
                balance += settlement.amount;
            }else{
                //Some one paid the user -decrease the user's balance 
                balance -= settlement.amount;
            }
        });

        return {
            ...group,
            id:group.id,
            balance,
        };
        }));

        //Return the enhanced groups 
        return enhancedGroups;
    }
});