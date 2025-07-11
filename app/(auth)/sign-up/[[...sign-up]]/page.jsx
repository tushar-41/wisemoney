import { Button } from '@/components/ui/button'
import { SignUp } from '@clerk/nextjs'
import React from 'react'

const page = () => {
  return (
    <div className='pt-10'>
        <SignUp/> 
    </div>
  )
}

export default page