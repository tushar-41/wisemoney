import { v } from "convex/values";
import { action } from "./_generated/server";
import { Resend } from 'resend';

export const sendEmail = action({
    args:{
        to:v.string(),
        subject:v.string(),
        html:v.string(),
        text:v.optional(v.string()),
        apiKey:v.string(),
    },
    handler:async(ctx,args) => {
        const resend = new Resend(args.apiKey);

        try{
            const result = await resend.emails.send({
                from:"Wise Money's <onboarding@resend.dev>",
                to:args.to,
                subject:args.subject,
                html:args.html,
                text:args.text,
            });

            return {success: true,id:result.id};
        }catch(error){
            return {success:false,error:error.message};
        }
    }
});