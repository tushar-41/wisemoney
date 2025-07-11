'use client';
import { useParams, useRouter } from 'next/navigation';
import React from 'react'

const SettlementPage = () => {
    const params = useParams();
    const router = useRouter();
    const {type,id} = params;

    return (
    <div>
        <h1>{type}{id}</h1>
    </div>
  )
}

export default SettlementPage