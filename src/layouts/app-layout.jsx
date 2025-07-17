import Header from '@/components/header'
import Footer from '@/components/ui/footer';
import React from 'react'
import { Outlet } from 'react-router-dom'

const AppLayout = () => {
 return(
  <div>
  <div className="grid-background"></div>
  <main className="w-full min-h-screen container mx-auto px-4">

    <Header />
    <Outlet />
  
  </main>

  <Footer/>
</div>
 );
}

export default AppLayout