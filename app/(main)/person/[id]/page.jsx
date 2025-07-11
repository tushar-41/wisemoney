'use client';
import { ExpenseList } from '@/components/ExpenseList';
import { SettlementsList } from '@/components/SettlementsList';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { api } from '@/convex/_generated/api';
import { useConvexQuery } from '@/hooks/use-convex-query';
import { ArrowLeft, ArrowLeftRight, PlusCircle } from 'lucide-react';
import Link from 'next/link';
import { useParams, useRouter } from 'next/navigation';
import React, { useState } from 'react'
import { BarLoader } from 'react-spinners';

const PersonExpenses = () => {

    const params = useParams();
    const router = useRouter();

    const [activeTab,setActiveTab] = useState("expenses");

    const {data,isLoading} = useConvexQuery(api.expenses.getExpensesBetweenUsers,{ userId:params.id });

    if(isLoading){
        return(
            <div className='container mx-auto py-12'>
                <BarLoader width={"100%"} color='#64748B' />
            </div>
        );
    }

    const otherUser = data?.otherUser;
    const expenses = data?.expenses || [];
    const settlements = data?.settlements || [];
    const balance = data?.balance || 0;


  return (
    <div className='container mx-auto py-6 max-w-4xl'>
        <div className='mb-6'>
        <Button variant={"outline"} size={"sm"} className='mb-4' onClick={() => router.back()} >
            <ArrowLeft className='h-4 w-4 mr-2' />
            Back
        </Button>
        <div className='flex items-center justify-between'>
            <div className='flex items-center gap-3'>
            <Avatar className='h-16 w-16'>
                <AvatarImage src={otherUser?.imageUrl}/>
                <AvatarFallback>
                {otherUser?.name?.charAt(0) || " "}
                </AvatarFallback>
            </Avatar>
            <div>
                <h1 className='text-4xl gradient-title'>{otherUser?.name}</h1>
                <p className='text-muted-foreground'>{otherUser?.email}</p>
            </div>
            </div>
            <div className='flex gap-2'>
                <Button variant={"outline"} asChild>
                    <Link href={`/settlements/user/${params.id}`}>
                    <ArrowLeftRight className='mr-2 h-4 w-4'/>
                    Settle Up
                    </Link>
                </Button>
                <Button asChild>
                    <Link href={`expenses/new`}>
                    <PlusCircle className='mr-2 h-4 w-4'/>
                    Add Expense
                    </Link>
                </Button>
            </div>
        </div>
      </div>
      <Card className='mb-6'>
        <CardHeader className='pb-2'>
            <CardTitle className='text-xl'>Balance</CardTitle>
        </CardHeader>
        <CardContent>
            <div className='flex justify-between items-center'>
            <div>
                {balance === 0 ?
            <p>You are all settled up! Great!!</p> :
            balance > 0 ?
            (<p>
                <span className='font-medium'>{otherUser?.name}</span> owes you
            </p>) : (
                <p>You owe <span className='font-medium'>{otherUser?.name}</span></p>
            )   
            }
            </div>
            <div className={`text-2xl font-bold ${balance > 0 ? "text-green-600" : balance < 0 ? "text-red-600" : " "}`}>
                ₹{Math.abs(balance).toFixed(2)}
            </div>
            </div>
        </CardContent>
      </Card>
      <Tabs defaultValue='expenses'
            value={activeTab}
            onValueChange={setActiveTab}
            className='space-y-4'>
        <TabsList className='grid w-full grid-cols-2'>
            <TabsTrigger value={'expenses'}>Expenses ({expenses.length})</TabsTrigger>
            <TabsTrigger value={'settlements'}>Settlements ({settlements.length})</TabsTrigger>
        </TabsList>
        <TabsContent value='expenses'>
           <ExpenseList expenses={expenses}
           showOtherPerson={false}
           otherPersonId={params.id}
           userLookupMap={{[otherUser.id]: otherUser}}
           />
        </TabsContent>
        <TabsContent value='settlements'>
            <SettlementsList settlements={settlements}
            userLookupMap={{[otherUser.id]: otherUser}}
            />
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default PersonExpenses