import { SignIn } from '@clerk/nextjs'
import React from 'react'

const page = () => {
  return (
    <div className='pt-10'>
      <SignIn/>
    </div>
  )
}

export default page;