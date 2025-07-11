"use client";

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { api } from '@/convex/_generated/api'
import { useConvexQuery } from '@/hooks/use-convex-query'
import { ChevronRight, PlusCircle, Users } from 'lucide-react';
import Link from 'next/link';
import React from 'react'
import { BarLoader } from 'react-spinners';
import ExpenseSummary from './_components/ExpenseSummary';
import BalanceSummary from './_components/BalanceSummary';
import GroupList from './_components/GroupList';

const Dashboard = () => {

  //Get all the data from the database using useConvexQuery Hook 
  const {data: balances , isLoading:balancesLoading} = useConvexQuery(api.dashboard.getUserBalances);
  const {data: groups , isLoading: groupsLoading} = useConvexQuery(api.dashboard.getUserGroups);
  const {data: monthlySpending, isLoading: monthlySpendingLoading} = useConvexQuery(api.dashboard.getMonthlySpending);
  const {data: totalSpent, isLoading: totalSpentLoading} = useConvexQuery(api.dashboard.getTotalSpent);

  const isLoading = balancesLoading || groupsLoading || monthlySpendingLoading || totalSpentLoading ;

  return (
    <div className='container mx-auto py-6 space-y-6'>
      {isLoading ? 
      (<div>
        <BarLoader width={"100%"} color='#64748B'/>
      </div>) : (
      <>
      <div className='flex items-center justify-between'>
        <h1 className='text-5xl gradient-title'>Dashboard</h1>
        <Button asChild>
          <Link href='/expenses/new'>
          <PlusCircle className='mr-2 h-4 w-4'/>
          Expenses
          </Link>
        </Button>
      </div>
      <div className='grid grid-cols-1 md:grid-cols-3 gap-4'>
        <Card className="pb-2">
          <CardHeader className="text-sm font-medium text-muted-foreground">
            <CardTitle>Total balance </CardTitle>
          </CardHeader>
          <CardContent>
           <div className='text-2xl font-bold'>
            {balances.totalBalance > 0 ? (<span className='text-green-600'>+₹{balances.totalBalance.toFixed(2)}</span> ) : 
            balances.totalBalance < 0 ?(<span className='text-red-600'>-₹{Math.abs(balances?.totalBalance).toFixed(2)}</span>):
            (<span>₹0.00</span>) }
           </div>
           <p className='text-xs text-muted-foreground mt-1'>
            {balances?.totalBalance > 0 ? "You are owed money" : balances?.totalBalance < 0 ? "You owe money" : "All settle up!"}
           </p>
          </CardContent>
        </Card>

        <Card className="pb-2">
          <CardHeader className="text-sm font-medium text-muted-foreground">
          <CardTitle>You are owed</CardTitle>
          </CardHeader>
          <CardContent>
           <div className='text-2xl font-bold text-green-600'>
            ₹{balances?.youAreOwed.toFixed(2)}
           </div>
           <p className='text-xs text-muted-foreground mt-1'>
            From {balances?.oweDetails?.youAreOwedBy?.length || 0} people
           </p>
          </CardContent>
        </Card>

        <Card className="pb-2">
          <CardHeader className="text-sm font-medium text-muted-foreground">
            <CardTitle>You owe</CardTitle>
          </CardHeader>
          <CardContent>
           {balances?.oweDetails?.youOwe?.length > 0 ? (
            <>
            <div className='text-2xl font-bold text-red-600'>
              ₹{balances?.youOwe.toFixed(2)}
            </div>
            <p className='text-xs text-muted-foreground mt-1'>
              To {balances?.oweDetails?.youOwe?.length || 0} people
            </p>
            </>
           ) : (
            <> 
            <div className='text-2xl font-bold'>₹0.00</div>
            <p className='text-xs text-muted-foreground mt-1'>
              You don't owe anyone
            </p>
            </>
           )}
          </CardContent>
        </Card>
      </div>

      <div className='grid grid-cols-1 lg:grid-cols-3 gap-6'>
        {/* left column */}
        <div className='lg:col-span-2 space-y-6'>
          <ExpenseSummary monthlySpending={monthlySpending} totalSpent={totalSpent}/>
        </div>

        {/* right column */}
        <div className='space-y-6'>
            {/* Balance details */}
            <Card>
            <CardHeader className="pb-3 flex items-center justify-between">
            <CardTitle>Balance details</CardTitle>
            <Button variant='link' asChild className='p-0'>
            <Link href='/contacts'>
            View All
            <ChevronRight className='ml-1 h-4 w-4'/>
            </Link>
            </Button>
          </CardHeader>
          <CardContent>
           <BalanceSummary balances={balances} />
          </CardContent>
        </Card>

        {/* Groups */}
         <Card>
            <CardHeader className="pb-3 flex items-center justify-between">
            <CardTitle>Your Groups</CardTitle>
            <Button variant='link' asChild className='p-0'>
            <Link href='/contacts'>
            View All
            <ChevronRight className='ml-1 h-4 w-4'/>
            </Link>
            </Button>
          </CardHeader>
          <CardContent>
           <GroupList groups={groups}/>
          </CardContent>
          <CardFooter>
            <Button variant='outline' asChild className='w-full'>
              <Link href='/contacts?createGroup=true'>
              <Users className='mr-2 h-4 w-4' />
              Create new group
              </Link>
            </Button>
          </CardFooter>
        </Card>
        </div>
      </div>
    </>
    )}
    </div>
  )
}

export default Dashboard;