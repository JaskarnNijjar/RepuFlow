const express = require('express')
const axios = require('axios')
const router = express.Router()

router.get('/search', async (req, res) => {
    const input = req.query.input
    console.log('Search called with input:', input)
    console.log('API key exists:', !!process.env.GOOGLE_PLACES_KEY)

    if (!input) {
        return res.status(400).json({ error: 'Input is required' })
    }

    try {
        const response = await axios.post(
            'https://places.googleapis.com/v1/places:autocomplete',
            { input: input },
            {
                headers: {
                    'Content-Type': 'application/json',
                    'X-Goog-Api-Key': process.env.GOOGLE_PLACES_KEY,
                }
            }
        )
        console.log('Google response:', response.data)
        res.json(response.data)
    } catch (error) {
        console.error('Full error:', error.response?.data || error.message)
        res.status(500).json({ error: 'Failed to fetch places' })
    }
})

module.exports = router