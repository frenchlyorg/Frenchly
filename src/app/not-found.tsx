import ErrorCard from '@/components/ui/ErrorCard'

export default function NotFound() {
  return (
    <ErrorCard
      heading="Page not found"
      body="That page wandered off. Let's get you back on track."
      action={{ label: 'Back to dashboard', href: '/dashboard' }}
    />
  )
}
