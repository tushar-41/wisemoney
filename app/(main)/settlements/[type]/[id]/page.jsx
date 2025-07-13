'use client';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { api } from '@/convex/_generated/api';
import { useConvexQuery } from '@/hooks/use-convex-query';
import { ArrowLeft, Users } from 'lucide-react';
import { useParams, useRouter } from 'next/navigation';
import React from 'react'
import { BarLoader } from 'react-spinners';
import SettlementForm from './_components/SettlementForm';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';

const SettlementPage = () => {
    const params = useParams();
    const router = useRouter();
    const {type,id} = params;

    const {data,isLoading} = useConvexQuery(api.settlements.settlementData,{entityType:type,entityId:id,});

    if(isLoading){
      return(
      <div className='container mx-auto py-12'>
      <BarLoader width={"100%"} color='#64748B'/>
     </div>
    )}

    if(!data){
      throw new Error('Failed to fetch the data');
    }


    //Funtion to handle after successful submission creation
    const handleSuccess = () => {
      if(type === 'user'){
        router.push(`/person/${id}`);
      }else if(type === 'group'){
        router.push(`/person/${id}`);
      }
    }

    return (
    <div className='flex items-center justify-center py-20'>
        <div className='mb-4'>
          <Button
          variant='outline'
          size='sm'
          onClick={() => router.back()}
          className='mb-3'
          >
            <ArrowLeft/>
          Back
          </Button>
          <div>
            <h1 className='text-5xl gradient-title'>Record a Settlement</h1>
            <p className='text-muted-foreground text-sm pb-6'>
              {type === 'user' ?
              `Setting up with the ${data?.counterPart?.name}` : `Settling up in ${data?.group?.name}`}
            </p>
          <Card>
          <CardHeader>
            <div  className="flex items-center gap-3">
                {type === "user" ?
                (
                  <Avatar>
                    <AvatarImage src={data?.counterPart?.imageUrl} />
                    <AvatarFallback>{data?.counterPart?.name.charAt(0) || "?"}</AvatarFallback>
                  </Avatar>
                ) : (
                  <div className='bg-primary/10 p-2 rounded-md'>
                    <Users className='h-6 w-6 text-primary' />
                    </div>
                )}
            
            <CardTitle>
            {type === 'user' ? data?.counterPart?.name : data?.group?.name}
          </CardTitle>
          </div>
          </CardHeader>
          <CardContent>
            <SettlementForm
            entityType={type}
            entityData={data}
            onSuccess={handleSuccess}
            />
          </CardContent>
          </Card>
          </div>
        </div>    
    </div>
  )
}

export default SettlementPage