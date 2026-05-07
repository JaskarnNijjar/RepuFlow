import supabase from '../supabase'
import BusinessSetup from './BusinessSetup'

function Dashboard() {
  async function handleLogout() {
    await supabase.auth.signOut()
  }

  return (
    <div>
      <h1>Dashboard</h1>
      <button onClick={handleLogout}>Logout</button>
      <BusinessSetup />
    </div>
  )
}

export default Dashboard
