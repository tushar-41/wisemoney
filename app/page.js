import { Avatar, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { FEATURES, STEPS, TESTIMONIALS } from "@/lib/landing";
import { AvatarFallback } from "@/components/ui/avatar";
import { ArrowRight } from "lucide-react";
import Image from "next/image";
import Link from "next/link";

export default function Home() {
  return <div className="flex flex-col pt-16">
    <section className="mt-20 pb-12 space-y-12 md:space-y-20 px-5">
      <div className="container mx-auto px-4 md:px-6 text-center space-y-6">
        <Badge variant='outline' className="bg-amber-100 text-slate-700" >
        Split Expenses. Simplify Life
        </Badge>
        <h1 className="gradient-title mx-auto max-w-4xl text-4xl md:text-6xl">
         The smartest way to split your expenses with your friends
        </h1>
        <p className="mx-auto max-w-[700px] text-gray-500 md:text/relaxed">
        Track shared Expenses, split bill effortlessly, and settle up quickly. Never
          who owes who again.
        </p>
        <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
          <Button
          asChild
          size={"lg"}
          className={"bg-gray-500 hover:bg-gray-700"}>
            <Link href="/dashboard">
            Get Started
            <ArrowRight className="ml-2 h-4 w-4"/>
            </Link>
          </Button>
          <Button
          asChild
          variant={"outline"}
          size={"lg"}
          className={"border-indigo-600 text-slate-700 hover:bg-slate-50"}>
            <Link href="#how-it-works">
            See how it works
            </Link>
          </Button>
          </div>
      </div>
          <div className="container mx-auto max-w-5xl overflow-hidden rounded-xl
          shadow-xl">
            <div className="gradient p-1 aspect-[16/9]">
              <Image
              src="/testimonials/hero2.png"
              width={1280}
              height={720}
              alt="Banner"
              className="rounded-lg mx-auto"
              priority
              />
            </div>
          </div>
    </section>
    <section id='features' className="bg-gray-50 py-20">
      <div className="container mx-auto px-4 md:px-6 text-center">
        <Badge variant="outline" className="bg-white-100 text-slate-700">
          Features
        </Badge>
        <h2 className="gradient-title mt-2 text-3xl md:text-4xl">
          Everthing you need to split expenses
        </h2>
        <p className="mx-auto mt-3 max-w-[700px] text-gray-500 md:text-xl/relaxed">
        Our platform provides all the tools you need to handle shared expenses with ease.
        </p>
      </div>
      <div className="mx-auto mt-12 grid max-w-5xl gap-6 md:grid-cols-2 lg:grid-cols-3">
      {FEATURES.map(({title,Icon,bg,description,color}) => (
        <Card key={title} 
        className={"flex flex-col items-center space-y-4 text-center p-6"}>
          <div className={`rounded-full p-3 ${bg}`}>
            <Icon className={`h-6 w-6 ${color}`}/>
          </div>
          <h3 className="text-xl font-bold">{title}</h3>
          <p className="text-gray-500">{description}</p>
        </Card>
      ))}
      </div>
    </section>
    <section id='how-it-works' className="py-20">
      <div className="container mx-auto px-4 md:px-6 text-center">
        <Badge variant="outline" className="bg-white-100 text-slate-700">
          How it Works
        </Badge>
        <h2 className="gradient-title mt-2 text-3xl md:text-4xl">
          Splitting expenses has never been easier
        </h2>
        <p className="mx-auto mt-3 max-w-[700px] text-gray-500 md:text-xl/relaxed">
        Follow these simple steps to start tracking and splitting expenses 
        with friends.
        </p>
      </div>
      <div className="mx-auto mt-12 grid max-w-5xl gap-8 lg:grid-cols-3">
      {STEPS.map(({description,label,title}) => (
        <div key={title}
        className="flex flex-col items-center space-y-4">
          <div className="flex h-12 w-12 items-center justify-center rounded-full bg-green-100
          text-xl font-bold text-slate-600">
            {label}
          </div>
          <h3 className="text-xl font-bold">
            {title}
          </h3>
          <p className="text-gray-500 text-center">{description}</p>
        </div>
      ))}
      </div>
    </section>
    <section id='how-it-works' className="py-20">
      <div className="container mx-auto px-4 md:px-6 text-center">
        <Badge variant="outline" className="bg-white-100 text-slate-700">
          Testimonials
        </Badge>
        <h2 className="gradient-title mt-2 text-3xl md:text-4xl">
          What our users are saying
        </h2>
      </div>
      <div className="mx-auto mt-12 grid max-w-5xl gap-6 md:grid-cols-2 lg:grid-cols-3">
      {TESTIMONIALS.map(({quote,name,image,role}) => (
        <Card key={name}>
          <CardContent className={"space-y-4 p-4"}>                       
            <p className="text-gray-500">{quote}</p>
            <div className="flex items-center space-x-3">
            <Avatar>
            <AvatarImage src={image} alt={name}/>
            <AvatarFallback>{name.charAt(0)}</AvatarFallback>
            </Avatar> 

            <div className="text-left">
              <p className="text-sm font-medium">{name}</p>
              <p className="text-sm text-muted-foreground">{role}</p>
            </div>
            </div>
          </CardContent>
        </Card>
      ))}
      </div>
    </section>
    <section className="py-20 gradient">
      <div className="container mx-auto px-4 md:px-6 text-center space-y-6">
        <h2 className="text-3xl font-extrabold tacking-tight md:text-4xl text-white">
          Ready to simplfy expenses
        </h2>
        <p className="mx-auto max-w-[600px] text-green-100 md:text-xl/relaxed">
          Join thousands of users who have made splitting expenses stress free.
        </p>
        <Button
          asChild
          size={"lg"}
          className={"bg-gray-500 hover:bg-gray-700"}>
            <Link href="/dashboard">
            Get Started
            <ArrowRight className="ml-2 h-4 w-4"/>
            </Link>
          </Button>
      </div>
    </section>
    <footer className="border-t bg-gray-50 py-12 text-center text-sm text-muted-foreground">
      Made with ❤️ by CleanCoder (Tushar😊).
    </footer>
  </div>
}
