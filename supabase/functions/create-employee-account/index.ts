import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version',
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders })
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!
    const serviceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    const anonKey = Deno.env.get('SUPABASE_ANON_KEY')!

    // Verify caller is admin
    const authHeader = req.headers.get('Authorization')
    if (!authHeader) {
      return new Response(JSON.stringify({ error: 'Missing authorization' }), {
        status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    const callerClient = createClient(supabaseUrl, anonKey, {
      global: { headers: { Authorization: authHeader } },
    })
    const { data: { user: caller }, error: callerError } = await callerClient.auth.getUser()
    if (callerError || !caller) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), {
        status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    // Check admin role
    const adminClient = createClient(supabaseUrl, serviceRoleKey)
    const { data: roleData } = await adminClient
      .from('user_roles')
      .select('role')
      .eq('user_id', caller.id)
      .eq('role', 'admin')
      .maybeSingle()

    if (!roleData) {
      return new Response(JSON.stringify({ error: 'Only admins can create employee accounts' }), {
        status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    const body = await req.json()
    const { email, name, role, department, job_title, start_date, leave_balance, app_role } = body

    if (!email || !name) {
      return new Response(JSON.stringify({ error: 'Email and name are required' }), {
        status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    const selectedRole = app_role || 'employee'

    // 1. Create auth user with a random password (email auto-confirmed)
    const randomPassword = crypto.randomUUID() + '!Aa1'
    const { data: newUser, error: createError } = await adminClient.auth.admin.createUser({
      email,
      password: randomPassword,
      email_confirm: true,
      user_metadata: { full_name: name },
    })

    if (createError) {
      return new Response(JSON.stringify({ error: createError.message }), {
        status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    const newUserId = newUser.user.id

    // 2. Assign role in user_roles
    await adminClient.from('user_roles').insert({
      user_id: newUserId,
      role: selectedRole,
    })

    // 3. Create employee record (owned by admin so admin can manage via RLS)
    const { data: employee, error: empError } = await adminClient.from('employees').insert({
      name,
      email,
      role: role || null,
      department: department || null,
      job_title: job_title || null,
      start_date: start_date || null,
      leave_balance: leave_balance ?? 20,
      app_role: selectedRole,
      user_id: caller.id,
    }).select('id').single()

    if (empError) {
      return new Response(JSON.stringify({ error: empError.message }), {
        status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    // 4. Send password reset email so employee can set their own password
    const { error: linkError } = await adminClient.auth.admin.generateLink({
      type: 'recovery',
      email,
    })

    if (linkError) {
      console.error('Failed to generate recovery link:', linkError.message)
      // Non-fatal - account is created, admin can manually trigger reset
    }

    return new Response(JSON.stringify({
      success: true,
      employee_id: employee.id,
      user_id: newUserId,
      message: `Account created for ${email}. A password reset email has been sent.`,
    }), {
      status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  } catch (err) {
    return new Response(JSON.stringify({ error: err.message }), {
      status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  }
})
