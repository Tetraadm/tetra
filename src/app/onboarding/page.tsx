import { redirect } from 'next/navigation'

export default function OnboardingPage() {
  redirect('/login?error=Du må bli invitert for å bruke Tetra')
}