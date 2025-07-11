import { ConvexHttpClient } from "convex/browser";
import { inngest } from "./client";
import { api } from "@/convex/_generated/api";

const convex = new ConvexHttpClient(process.env.NEXT_PUBLIC_CONVEX_URL);

export const paymentReminder = inngest.createFunction(
    {id: "send-payment-reminders"},
    {cron: "0 10 * * *" },
    async({step}) => {
        //fetch all users
        const users = await step.run("fetch-debts", () => 
        convex.query(api.inngest.getUserWithOutstandingDebts));

        const result = await step.run("send-emails",async() =>{
            return Promise.all(
                users.map(async(u)=>{
                    const rows = u.debts.map(
                        (d)=> 
                        `<tr>
                           <td style='padding:4px 8px;'>${d.name}</td>
                           <td style='padding:4px 8px;'>${d.amount.toFixed(2)}</td>
                        </tr>`
                    ).join("");

                    if(!rows) return { userId:u._id , skipped:true };

                    const html = 
                    `<h2>Wise Money Reminder</h2>
                    <p>Hi ${u.name}, you have the following outstanding balances :</p>
                    <table cellSpacing="0" cellPadding="0" border="1"
                    style="border-collapse:collapse;">
                        <thead>
                            <tr><th>To</th><th>Amount</th></tr>
                        </thead>
                        <tbody>${rows}</tbody>
                    </table>
                    <p>Please settle up soon. Thanks</p>`;

                    try {
                        await convex.action(api.email.sendEmail,{
                            to:u.email,
                            subject:"You have pending payments on wise money",
                            html,
                            apiKey:process.env.RESEND_API_KEY,
                        });

                        return{userId:u._id,succes:true}
                    } catch (error) {
                        return{userId:u._id,success:false,err:error.message}
                    }
                })
            )
        });

        return {
                processed:result.length,
                successes:result.filter((r) => r.succes).length,
                failures:result.filter((r) => r.success === false).length,
            }
    }
)
