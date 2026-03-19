import { redirect } from 'next/navigation';

export default function Home() {
  // Instantly redirect users from the root URL to the planner module
  redirect('/planner');
}