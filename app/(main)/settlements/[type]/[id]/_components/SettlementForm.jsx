'use client';
import { AvatarImage } from '@/components/ui/avatar';
import { Label } from '@/components/ui/label';
import { api } from '@/convex/_generated/api';
import { useConvexMutation, useConvexQuery } from '@/hooks/use-convex-query';
import { zodResolver } from '@hookform/resolvers/zod';
import { Avatar } from '@radix-ui/react-avatar';
import React, { useState } from 'react'
import { useForm } from 'react-hook-form';
import { toast } from 'sonner';
import { z } from 'zod'


const settlementSchema = z.object({
    amount:z.string().min(1,"Amount is required").refine((val) => !isNaN(parseFloat(val)) && parseFloat(val) > 0 , {
        message:"Amount must be postive number",
    }),
    note:z.string().optional(),
    paymentType:z.enum(["youPaid","theyPaid"]),
});

const SettlementForm = (
    {
        onSuccess,
        entityType,
        entityData,
    }
) => {

    const {data:currentUser} = useConvexQuery(api.users.getCurrentUser);
    const createSettlement = useConvexMutation(api.settlements.createSettlements);

    const 
    {register,
    handleSubmit,
    watch,
    formState:{isSubmitting,errors}
    } = useForm({
        resolver:zodResolver(settlementSchema),
        defaultValues:{
            amount:'',
            note:"",
            paymentType:"youPaid",
        },
    });

    //Get selected payment 
    const paymentType = watch("paymentType");

    //Single user settlment 
    const handleUserSettlement = async(data) => {
        const amount = data.amount;

        try {
            const paidByUserId = data.paymentType === 'youPaid' ? currentUser._id : entityData.counterPart.userId;

            const receivedByUserId = data.paymentType === 'youPaid' ? entityData.counterPart.userId : currentUser._id;

            await createSettlement.mutate({
                amount,
                note:data.note,
                paidByUserId,
                receivedByUserId,
                // No groupId for user settlements
            });

            toast.success('Settlement created successfully');
            if(onSuccess) onSuccess();
        } catch (error) {
            toast.error("Failed to record settlement" + error.message);
        }
    }

    const handleGroupSettlement = async(data,selectedUserId) => {
        if(!selectedUserId){
            toast.error("Please select a group member to settle with");
            return;
        }

        const amount = parseFloat(data.amount);
        try {
            // Determine payer and receiver based on the selected payment type and balances
            const paidByUserId = data.paymentType === "youPaid" ? currentUser._id : selectedUser.userId;

            const receivedByUserId = data.paymentType === "youPaid" ? selectedUser.userId : currentUser._id;

          await createSettlement.mutate({
            amount,
            note: data.note,
            paidByUserId,
            receivedByUserId,
            groupId: entityData.group.id,
         });

          toast.success("Settlement recorded successfully!");
          if (onSuccess) onSuccess();
    } catch (error) {
      toast.error("Failed to record settlement: " + error.message);  
        }
    }

    const onsubmit = async(data) => {
        if(entityType === 'user'){
            await handleUserSettlement(data);
        }else if(entityType === 'group' && selectedGroupMemberId){
            await handleGroupSettlement(data,selectedGroupMemberId);
        }
    }



    const [selectedGroupMemberId,setSelectedGroupMemberId] = useState(null);

    if(!currentUser) return null;

    if(entityType === 'user'){
        const otherUser = entityData.counterPart.otherUser;
        const netBalance = entityData.counterPart.netBalance;
    

  return (
    <form onSubmit={handleSubmit(onsubmit)} className='space-y-4'>
        <div className='bg-muted p-4'>
            <h3 className='text-center'>Current Balance</h3>
            {netBalance === 0 ? (
                <p className='text-sm text-muted-foreground'> you all settled up with{otherUser.name}</p>
            ): netBalance > 0 ?
        (
            <div className='flex justify-between items-center'>
                <span>{otherUser.name} owes you</span>
                <span className='text-2xl text-green-600'>₹{netBalance}</span>
            </div>
        ):(
            <div>
                </div>
        )}
        </div>
    </form>
  )
}
}

export default SettlementForm