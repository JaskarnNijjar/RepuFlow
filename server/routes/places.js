const express = require('express')
const axios = require('axios')
const router = express.Router()

router.get('/search', async (req, res) => {
    const input = req.query.input

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
        res.json(response.data)
    } catch (error) {
        res.status(500).json({ error: 'Failed to fetch places' })
    }
})

module.exports = router