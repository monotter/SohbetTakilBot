import express from 'express'
const app = express()
const port = process.env.PORT || 5000

app.get('/', (req, res) => {
  res.send('Sohbet et & Takıl!')
})

app.listen(port, () => {
  console.log(`Web app listening on port ${port}`)
})