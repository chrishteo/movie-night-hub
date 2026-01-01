import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'

const RESEND_API_KEY = Deno.env.get('RESEND_API_KEY')
const ADMIN_EMAIL = Deno.env.get('ADMIN_EMAIL')
const FROM_EMAIL = Deno.env.get('FROM_EMAIL') || 'Movie Night Hub <onboarding@resend.dev>'

interface NotificationPayload {
  type: 'new_user' | 'profile_change' | 'bug_report'
  data: {
    name?: string
    old_name?: string
    avatar?: string
    title?: string
    description?: string
    user_name?: string
  }
}

serve(async (req) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response(null, {
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'POST',
        'Access-Control-Allow-Headers': 'Content-Type, Authorization',
      },
    })
  }

  try {
    const { type, data }: NotificationPayload = await req.json()

    if (!RESEND_API_KEY || !ADMIN_EMAIL) {
      console.error('Missing RESEND_API_KEY or ADMIN_EMAIL')
      return new Response(
        JSON.stringify({ error: 'Missing configuration' }),
        { status: 500, headers: { 'Content-Type': 'application/json' } }
      )
    }

    let subject: string
    let html: string
    const timestamp = new Date().toLocaleString('en-US', {
      dateStyle: 'medium',
      timeStyle: 'short'
    })

    switch (type) {
      case 'new_user':
        subject = `New User: ${data.name}`
        html = `
          <div style="font-family: system-ui, sans-serif; max-width: 600px; margin: 0 auto;">
            <h2 style="color: #7c3aed;">New User Joined Movie Night Hub</h2>
            <div style="background: #f3f4f6; padding: 20px; border-radius: 8px; margin: 20px 0;">
              <p style="margin: 0 0 10px 0;"><strong>Name:</strong> ${data.name}</p>
              <p style="margin: 0 0 10px 0;"><strong>Avatar:</strong> ${data.avatar || 'Not set'}</p>
              <p style="margin: 0; color: #6b7280;"><strong>Joined:</strong> ${timestamp}</p>
            </div>
            <p style="color: #6b7280; font-size: 14px;">
              View all users in your <a href="#" style="color: #7c3aed;">Admin Panel</a>
            </p>
          </div>
        `
        break

      case 'profile_change':
        subject = `Profile Updated: ${data.name}`
        html = `
          <div style="font-family: system-ui, sans-serif; max-width: 600px; margin: 0 auto;">
            <h2 style="color: #7c3aed;">User Profile Updated</h2>
            <div style="background: #f3f4f6; padding: 20px; border-radius: 8px; margin: 20px 0;">
              <p style="margin: 0 0 10px 0;"><strong>User:</strong> ${data.name}</p>
              ${data.old_name && data.old_name !== data.name
                ? `<p style="margin: 0 0 10px 0;"><strong>Previous Name:</strong> ${data.old_name}</p>`
                : ''}
              <p style="margin: 0; color: #6b7280;"><strong>Updated:</strong> ${timestamp}</p>
            </div>
          </div>
        `
        break

      case 'bug_report':
        subject = `Bug Report: ${data.title}`
        html = `
          <div style="font-family: system-ui, sans-serif; max-width: 600px; margin: 0 auto;">
            <h2 style="color: #dc2626;">New Bug Report Submitted</h2>
            <div style="background: #fef2f2; padding: 20px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #dc2626;">
              <p style="margin: 0 0 10px 0;"><strong>Title:</strong> ${data.title}</p>
              <p style="margin: 0 0 10px 0;"><strong>Reported by:</strong> ${data.user_name || 'Unknown'}</p>
              <p style="margin: 0 0 10px 0;"><strong>Description:</strong></p>
              <p style="margin: 0; padding: 10px; background: white; border-radius: 4px;">
                ${data.description || 'No description provided'}
              </p>
              <p style="margin: 10px 0 0 0; color: #6b7280;"><strong>Submitted:</strong> ${timestamp}</p>
            </div>
            <p style="color: #6b7280; font-size: 14px;">
              Manage bug reports in your <a href="#" style="color: #7c3aed;">Admin Panel</a>
            </p>
          </div>
        `
        break

      default:
        return new Response(
          JSON.stringify({ error: 'Unknown notification type' }),
          { status: 400, headers: { 'Content-Type': 'application/json' } }
        )
    }

    // Send email via Resend
    const response = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${RESEND_API_KEY}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        from: FROM_EMAIL,
        to: ADMIN_EMAIL,
        subject,
        html
      })
    })

    if (!response.ok) {
      const error = await response.text()
      console.error('Resend API error:', error)
      return new Response(
        JSON.stringify({ error: 'Failed to send email', details: error }),
        { status: 500, headers: { 'Content-Type': 'application/json' } }
      )
    }

    const result = await response.json()
    console.log('Email sent successfully:', result)

    return new Response(
      JSON.stringify({ success: true, id: result.id }),
      {
        status: 200,
        headers: {
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': '*'
        }
      }
    )

  } catch (error) {
    console.error('Error processing notification:', error)
    return new Response(
      JSON.stringify({ error: 'Internal server error' }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    )
  }
})
