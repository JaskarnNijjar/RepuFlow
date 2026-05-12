const express = require('express')
const router = express.Router()
const twilio = require('twilio')
const supabase = require('../supabase')

const client = twilio(process.env.TWILIO_ACCOUNT_SID, process.env.TWILIO_AUTH_TOKEN)

router.post('/send-review-request', async (req, res) => {
  const { customerPhone, customerName, businessName, placeId, business_id, customer_id } = req.body

  const reviewLink = `https://search.google.com/local/writereview?placeid=${placeId}`
  const message = `Hi ${customerName}, thank you for choosing ${businessName}! We'd love to hear about your experience. Please leave us a review here: ${reviewLink}`

  try {
    await client.messages.create({
      body: message,
      from: process.env.TWILIO_PHONE_NUMBER,
      to: customerPhone,
    })
  } catch (err) {
    console.error('Twilio error:', err)
    return res.status(500).json({ error: 'Failed to send SMS' })
  }

  const { error: dbError } = await supabase
    .from('review_requests')
    .insert({ business_id, customer_id, status: 'sent' })

  if (dbError) {
    console.error('Failed to log review request to Supabase:', dbError)
  }

  return res.json({ success: true })
})

module.exports = router
